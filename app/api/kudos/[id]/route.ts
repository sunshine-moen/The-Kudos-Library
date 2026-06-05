import { NextResponse } from "next/server";
import { withTenantContext, requireAdmin } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { patchKudosSchema } from "@/lib/validators/kudos";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { checkCriteria, computeStreakWeeks } from "@/lib/badges/criteria";

export const PATCH = withTenantContext(async (req, ctx) => {
  const id = new URL(req.url).pathname.split("/").at(-1) ?? "";

  const kudos = await prisma.kudos.findFirst({
    where: { id, tenant_id: ctx.tenantId },
    select: { giver_id: true, deleted_at: true, edit_window_expires_at: true },
  });
  if (!kudos) throw new NotFoundError("Kudos");
  if (kudos.deleted_at) throw new ForbiddenError("Kudos has been deleted");
  if (kudos.giver_id !== ctx.userId) throw new ForbiddenError("Not your kudos");
  if (kudos.edit_window_expires_at < new Date()) {
    throw new ForbiddenError("Edit window has expired");
  }

  const body = await req.json().catch(() => null);
  const parsed = patchKudosSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { value_tag_ids, ...fields } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    if (value_tag_ids !== undefined) {
      await tx.kudosValue.deleteMany({ where: { kudos_id: id } });
      if (value_tag_ids.length > 0) {
        await tx.kudosValue.createMany({
          data: value_tag_ids.map((vtId) => ({
            kudos_id: id,
            value_tag_id: vtId,
            tenant_id: ctx.tenantId,
          })),
        });
      }
    }
    return tx.kudos.update({ where: { id }, data: fields });
  });

  return NextResponse.json(updated);
});

export const DELETE = requireAdmin(async (req, ctx) => {
  const id = new URL(req.url).pathname.split("/").at(-1) ?? "";

  const kudos = await prisma.kudos.findFirst({
    where: { id, tenant_id: ctx.tenantId },
    select: {
      id: true,
      giver_id: true,
      recipient_id: true,
      submitted_at: true,
      deleted_at: true,
    },
  });
  if (!kudos) throw new NotFoundError("Kudos");
  if (kudos.deleted_at) throw new NotFoundError("Kudos"); // already deleted

  const revokedBadgeNames: string[] = [];

  await prisma.$transaction(async (tx) => {
    // Step 1: Soft-delete the kudos
    await tx.kudos.update({ where: { id }, data: { deleted_at: new Date() } });

    // Step 2: Cancel undelivered outbox rows for this kudos
    await tx.emailOutbox.updateMany({
      where: {
        kudos_id: id,
        delivered_at: null,
        cancelled_at: null,
      },
      data: {
        cancelled_at: new Date(),
        cancellation_reason: "kudos_admin_deleted",
      },
    });

    // Step 3: Badge recomputation for the giver
    // Load giver's remaining non-deleted kudos (after the delete above)
    const remainingKudos = await tx.kudos.findMany({
      where: { giver_id: kudos.giver_id, tenant_id: ctx.tenantId, deleted_at: null },
      select: {
        submitted_at: true,
        kudos_values: { select: { value_tag_id: true } },
      },
    });

    const totalGiven = remainingKudos.length;
    const currentStreakWeeks = computeStreakWeeks(remainingKudos.map((k) => k.submitted_at));
    const usedTagIds = new Set(
      remainingKudos.flatMap((k) => k.kudos_values.map((v) => v.value_tag_id)),
    );
    const activeTagCount = await tx.valueTag.count({
      where: { tenant_id: ctx.tenantId, is_active: true },
    });
    const allValueTagsUsed = activeTagCount > 0 && usedTagIds.size >= activeTagCount;
    const stats = { totalGiven, currentStreakWeeks, allValueTagsUsed };

    // For each badge currently held by the giver, check if threshold still met
    const currentAwards = await tx.badgeAward.findMany({
      where: { tenant_id: ctx.tenantId, awarded_to: kudos.giver_id },
      include: { badge: { select: { id: true, name: true, criteria: true } } },
      orderBy: { awarded_at: "asc" },
    });

    for (const award of currentAwards) {
      const criteria = award.badge.criteria as Record<string, unknown>;
      if (!checkCriteria(criteria, stats)) {
        // Below threshold — revoke the most recent award for this badge
        const mostRecent = await tx.badgeAward.findFirst({
          where: { tenant_id: ctx.tenantId, badge_id: award.badge.id, awarded_to: kudos.giver_id },
          orderBy: { awarded_at: "desc" },
          select: { id: true },
        });
        if (mostRecent) {
          await tx.badgeAward.delete({ where: { id: mostRecent.id } });
          revokedBadgeNames.push(award.badge.name);
        }
      }
    }

    // Step 4: Leaderboard recomputation for affected periods
    const affectedPeriods = await tx.leaderboardWinner.findMany({
      where: {
        winner_id: kudos.giver_id,
        tenant_id: ctx.tenantId,
        period_start: { lte: kudos.submitted_at },
        period_end: { gt: kudos.submitted_at },
      },
      select: { kind: true, period_start: true, period_end: true },
    });

    // Deduplicate periods
    const seen = new Set<string>();
    const uniquePeriods = affectedPeriods.filter((p) => {
      const key = `${p.kind}:${p.period_start.toISOString()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const settings = await tx.teamSettings.findFirst({
      where: { tenant_id: ctx.tenantId },
      select: { leaderboard_top_n_week: true, leaderboard_top_n_month: true },
    });

    for (const period of uniquePeriods) {
      const topN =
        period.kind === "top_giver_week"
          ? (settings?.leaderboard_top_n_week ?? 5)
          : (settings?.leaderboard_top_n_month ?? 5);

      // Recount kudos given by each member in this period
      const giverCounts = await tx.kudos.groupBy({
        by: ["giver_id"],
        where: {
          tenant_id: ctx.tenantId,
          submitted_at: { gte: period.period_start, lt: period.period_end },
          deleted_at: null,
        },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: topN,
      });

      // Delete existing rows for this period and re-insert with updated ranks
      await tx.leaderboardWinner.deleteMany({
        where: { tenant_id: ctx.tenantId, kind: period.kind, period_start: period.period_start },
      });

      if (giverCounts.length > 0) {
        await tx.leaderboardWinner.createMany({
          data: giverCounts.map((g, i) => ({
            tenant_id: ctx.tenantId,
            kind: period.kind,
            period_start: period.period_start,
            period_end: period.period_end,
            winner_id: g.giver_id,
            rank: i + 1,
            kudos_count: g._count.id,
          })),
        });
      }
    }

    // Step 5: Insert admin_audit_log row
    await tx.adminAuditLog.create({
      data: {
        tenant_id: ctx.tenantId,
        actor_id: ctx.userId,
        action: "kudos_soft_delete",
        target_type: "kudos",
        target_id: id,
        metadata: {
          giver_id: kudos.giver_id,
          recipient_id: kudos.recipient_id,
          badges_revoked: revokedBadgeNames,
        },
      },
    });
  });

  return new NextResponse(null, { status: 204 });
});
