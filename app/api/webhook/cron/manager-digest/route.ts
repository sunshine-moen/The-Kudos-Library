import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { writeOutboxRow } from "@/lib/outbox/writer";
import type { EmailTemplateType } from "@prisma/client";

// Returns the ISO week number (1–53) for a given Date
function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export async function GET(req: Request) {
  const invalid = verifyCronSecret(req);
  if (invalid) return invalid;

  const now = new Date();

  // Self-gate: only run on Monday at 09:xx local time
  const settings = await prisma.teamSettings.findFirst({ select: { timezone: true, tenant_id: true } });
  const tz = settings?.timezone ?? "America/Vancouver";

  const localDay = now.toLocaleString("en-CA", { timeZone: tz, weekday: "long" }).toLowerCase();
  const localHour = parseInt(
    now.toLocaleString("en-CA", { timeZone: tz, hour: "numeric", hour12: false }),
    10,
  );

  if (localDay !== "monday" || localHour !== 9) {
    return NextResponse.json({ skipped: true, localDay, localHour });
  }

  const weekIso = `${now.getUTCFullYear()}-W${String(isoWeek(now)).padStart(2, "0")}`;

  const startRow = await prisma.cronRunLog.create({
    data: { cron_name: "manager-digest", tenant_id: settings?.tenant_id ?? null, outcome: "success" },
  });

  let processed = 0;
  let errors = 0;

  try {
    // Find all managers in the tenant
    const managers = await prisma.user.findMany({
      where: {
        role: { in: ["manager", "admin"] },
        status: "active",
        ...(settings?.tenant_id ? { tenant_id: settings.tenant_id } : {}),
      },
      select: {
        id: true,
        first_name: true,
        tenant_id: true,
        digest_cadence: true,
        reports: {
          where: { status: { in: ["active", "on_leave"] } },
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });

    for (const manager of managers) {
      try {
        const windowDays = manager.digest_cadence === "biweekly" ? 14 : 7;
        const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

        const reportIds = manager.reports.map((r) => r.id);
        if (reportIds.length === 0) continue;

        const recentKudos = await prisma.kudos.count({
          where: {
            recipient_id: { in: reportIds },
            tenant_id: manager.tenant_id,
            submitted_at: { gte: windowStart },
            deleted_at: null,
          },
        });

        // reportIds excludes the manager themselves — badge self-exclusion is implicit
        const recentBadges = await prisma.badgeAward.findMany({
          where: {
            awarded_to: { in: reportIds },
            tenant_id: manager.tenant_id,
            awarded_at: { gte: windowStart },
          },
          select: {
            badge_id: true,
            awarded_at: true,
            awardee: { select: { first_name: true } },
          },
          orderBy: { awarded_at: "desc" },
        });

        const badges = recentBadges.map((b) => ({
          recipient_first_name: b.awardee.first_name,
          badge_id: b.badge_id,
          awarded_at: b.awarded_at.toISOString(),
        }));

        const templateType: EmailTemplateType = recentKudos > 0 ? "manager_digest" : "manager_quiet_week";
        const idempotencyKey = `manager_digest:${manager.tenant_id}:${manager.id}:${weekIso}`;

        await prisma.$transaction(async (tx) => {
          // upsert with empty update = ON CONFLICT DO NOTHING
          const existing = await tx.emailOutbox.findUnique({ where: { idempotency_key: idempotencyKey } });
          if (!existing) {
            await writeOutboxRow(tx, {
              tenantId: manager.tenant_id,
              templateType,
              recipientUserId: manager.id,
              idempotencyKey,
              payload: { window_days: windowDays, week_iso: weekIso, kudos_count: recentKudos, badges },
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
