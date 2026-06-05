import type { Prisma } from "@prisma/client";
import { checkCriteria, computeStreakWeeks } from "./criteria";
import { writeOutboxRow } from "@/lib/outbox/writer";

export interface NewBadgeAward {
  badgeId: string;
  badgeAwardId: string;
  badgeName: string;
}

/**
 * Evaluates all unearned badges for a giver within a transaction.
 * Awards new badges and queues badge_milestone outbox rows.
 * Returns newly awarded badge info.
 */
export async function evaluateGiverBadges(
  tx: Prisma.TransactionClient,
  tenantId: string,
  giverId: string,
): Promise<NewBadgeAward[]> {
  // Load all non-deleted kudos given by this user (with their value tags)
  const kudos = await tx.kudos.findMany({
    where: { giver_id: giverId, tenant_id: tenantId, deleted_at: null },
    select: {
      submitted_at: true,
      kudos_values: { select: { value_tag_id: true } },
    },
  });

  const totalGiven = kudos.length;
  const currentStreakWeeks = computeStreakWeeks(kudos.map((k) => k.submitted_at));

  // Check all-value-tags-used criterion
  const usedTagIds = new Set(kudos.flatMap((k) => k.kudos_values.map((v) => v.value_tag_id)));
  const activeTagCount = await tx.valueTag.count({
    where: { tenant_id: tenantId, is_active: true },
  });
  const allValueTagsUsed = activeTagCount > 0 && usedTagIds.size >= activeTagCount;

  const stats = { totalGiven, currentStreakWeeks, allValueTagsUsed };

  // Load badge definitions for this tenant
  const badgeDefs = await tx.badgeDefinition.findMany({
    where: { tenant_id: tenantId },
    select: { id: true, name: true, criteria: true },
  });

  // Load already-awarded badge IDs for this giver
  const existingAwards = await tx.badgeAward.findMany({
    where: { tenant_id: tenantId, awarded_to: giverId },
    select: { badge_id: true },
  });
  const awardedBadgeIds = new Set(existingAwards.map((a) => a.badge_id));

  // Evaluate and award newly earned badges
  const newAwards: NewBadgeAward[] = [];
  for (const badge of badgeDefs) {
    if (awardedBadgeIds.has(badge.id)) continue;
    if (!checkCriteria(badge.criteria as Record<string, unknown>, stats)) continue;

    const award = await tx.badgeAward.create({
      data: { tenant_id: tenantId, badge_id: badge.id, awarded_to: giverId },
    });

    await writeOutboxRow(tx, {
      tenantId,
      templateType: "badge_milestone",
      badgeAwardId: award.id,
      recipientUserId: giverId,
      idempotencyKey: `badge_milestone:${award.id}`,
    });

    newAwards.push({ badgeId: badge.id, badgeAwardId: award.id, badgeName: badge.name });
  }

  return newAwards;
}
