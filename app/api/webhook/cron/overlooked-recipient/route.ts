import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { writeOutboxRow } from "@/lib/outbox/writer";

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

  const settings = await prisma.teamSettings.findFirst({
    select: { timezone: true, tenant_id: true, overlooked_recipient_window_days: true },
  });
  const tz = settings?.timezone ?? "America/Vancouver";
  const windowDays = settings?.overlooked_recipient_window_days ?? 30;

  const localDay = now.toLocaleString("en-CA", { timeZone: tz, weekday: "long" }).toLowerCase();
  const localHour = parseInt(
    now.toLocaleString("en-CA", { timeZone: tz, hour: "numeric", hour12: false }),
    10,
  );

  if (localDay !== "monday" || localHour !== 9) {
    return NextResponse.json({ skipped: true, localDay, localHour });
  }

  const weekIso = `${now.getUTCFullYear()}-W${String(isoWeek(now)).padStart(2, "0")}`;
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const startRow = await prisma.cronRunLog.create({
    data: {
      cron_name: "overlooked-recipient",
      tenant_id: settings?.tenant_id ?? null,
      outcome: "success",
    },
  });

  let processed = 0;
  let errors = 0;

  try {
    const managers = await prisma.user.findMany({
      where: {
        role: { in: ["manager", "admin"] },
        status: "active",
        ...(settings?.tenant_id ? { tenant_id: settings.tenant_id } : {}),
      },
      select: {
        id: true,
        tenant_id: true,
        email_settings: true,
        reports: {
          where: { status: "active" },
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });

    for (const manager of managers) {
      try {
        // Check opt-in (default ON)
        const emailSettings = manager.email_settings as Record<string, unknown> | null;
        const nudgeEnabled = emailSettings?.overlooked_recipient_nudge !== false;
        if (!nudgeEnabled) continue;

        if (manager.reports.length === 0) continue;

        const reportIds = manager.reports.map((r) => r.id);

        // Find reports with no kudos in the window
        const recentRecipients = await prisma.kudos.findMany({
          where: {
            recipient_id: { in: reportIds },
            tenant_id: manager.tenant_id,
            submitted_at: { gte: windowStart },
            deleted_at: null,
          },
          select: { recipient_id: true },
          distinct: ["recipient_id"],
        });

        const recipientsWithKudos = new Set(recentRecipients.map((k) => k.recipient_id));
        const overlooked = manager.reports.filter((r) => !recipientsWithKudos.has(r.id));

        if (overlooked.length === 0) continue;

        const idempotencyKey = `overlooked_recipient:${manager.tenant_id}:${manager.id}:${weekIso}`;

        await prisma.$transaction(async (tx) => {
          const existing = await tx.emailOutbox.findUnique({ where: { idempotency_key: idempotencyKey } });
          if (!existing) {
            await writeOutboxRow(tx, {
              tenantId: manager.tenant_id,
              templateType: "overlooked_recipient_nudge",
              recipientUserId: manager.id,
              idempotencyKey,
              payload: {
                overlooked_member_ids: overlooked.map((r) => r.id),
                overlooked_member_names: overlooked.map((r) => `${r.first_name} ${r.last_name}`),
                window_days: windowDays,
              },
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
