import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { writeOutboxRow } from "@/lib/outbox/writer";
import { computeStreakWeeks } from "@/lib/badges/criteria";

// ISO month string for idempotency: "YYYY-MM"
function monthIso(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export async function GET(req: Request) {
  const invalid = verifyCronSecret(req);
  if (invalid) return invalid;

  const now = new Date();

  const settings = await prisma.teamSettings.findFirst({
    select: { timezone: true, tenant_id: true, inactive_threshold_weeks: true },
  });
  const tenantId = settings?.tenant_id;
  const thresholdWeeks = settings?.inactive_threshold_weeks ?? 4;

  const startRow = await prisma.cronRunLog.create({
    data: { cron_name: "inactive-nudge", tenant_id: tenantId ?? null, outcome: "success" },
  });

  let processed = 0;
  let errors = 0;

  try {
    if (!tenantId) {
      await prisma.cronRunLog.update({
        where: { id: startRow.id },
        data: { completed_at: new Date(), outcome: "success", rows_processed: 0 },
      });
      return NextResponse.json({ ok: true, processed: 0 });
    }

    // Find all active members with inactive_giver_nudge enabled (default true)
    const members = await prisma.user.findMany({
      where: {
        tenant_id: tenantId,
        status: "active", // exclude on_leave
      },
      select: { id: true, email_settings: true, created_at: true },
    });

    const currentMonthIso = monthIso(now);

    for (const member of members) {
      try {
        const emailSettings = member.email_settings as Record<string, unknown> | null;
        if (emailSettings?.["inactive_giver_nudge"] === false) continue;

        // Load all non-deleted kudos given by this member
        const givenKudos = await prisma.kudos.findMany({
          where: {
            giver_id: member.id,
            tenant_id: tenantId,
            deleted_at: null,
          },
          select: { submitted_at: true },
          orderBy: { submitted_at: "desc" },
        });

        // Compute consecutive dry weeks from most recent kudos (or from account creation)
        const dryWeeks = computeDryWeeks(
          givenKudos.map((k) => k.submitted_at),
          member.created_at,
          now,
        );

        if (dryWeeks < thresholdWeeks) continue;

        // One nudge per member per month via idempotency key
        const idempotencyKey = `inactive_nudge:${tenantId}:${member.id}:${currentMonthIso}`;

        await prisma.$transaction(async (tx) => {
          const existing = await tx.emailOutbox.findUnique({ where: { idempotency_key: idempotencyKey } });
          if (!existing) {
            await writeOutboxRow(tx, {
              tenantId,
              templateType: "inactive_nudge",
              recipientUserId: member.id,
              idempotencyKey,
              payload: { dry_weeks: dryWeeks, month_iso: currentMonthIso },
            });
          }
        });

        processed++;
      } catch {
        errors++;
      }
    }

    await prisma.cronRunLog.update({
      where: { id: startRow.id },
      data: {
        completed_at: new Date(),
        outcome: errors > 0 ? "partial" : "success",
        rows_processed: processed,
      },
    });

    return NextResponse.json({ ok: true, processed, errors });
  } catch (err) {
    await prisma.cronRunLog.update({
      where: { id: startRow.id },
      data: { completed_at: new Date(), outcome: "failure" },
    });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Returns the number of consecutive calendar weeks (ending at `now`) with no kudos given.
 * Uses the inverse of computeStreakWeeks: counts backwards from `now` until a week with kudos.
 */
function computeDryWeeks(submittedAts: Date[], accountCreatedAt: Date, now: Date): number {
  if (submittedAts.length === 0) {
    // Never given — count weeks since account creation
    const ms = now.getTime() - accountCreatedAt.getTime();
    return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
  }

  const mostRecent = submittedAts[0];
  if (!mostRecent) return 0;

  // Weeks between most recent kudos and now
  const ms = now.getTime() - mostRecent.getTime();
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
}

