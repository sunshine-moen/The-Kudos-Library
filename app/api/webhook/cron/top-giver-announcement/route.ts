import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { writeOutboxRow } from "@/lib/outbox/writer";

function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export async function GET(req: Request) {
  const invalid = verifyCronSecret(req);
  if (invalid) return invalid;

  const now = new Date();

  const settings = await prisma.teamSettings.findFirst({
    select: {
      timezone: true,
      tenant_id: true,
      top_giver_send_local_time: true,
    },
  });
  const tz = settings?.timezone ?? "America/Vancouver";
  const tenantId = settings?.tenant_id;

  // Self-gate: Friday at the configured local time (default 15:00)
  const [targetHourStr] = (settings?.top_giver_send_local_time ?? "15:00").split(":");
  const targetHour = parseInt(targetHourStr ?? "15", 10);

  const localDay = now.toLocaleString("en-CA", { timeZone: tz, weekday: "long" }).toLowerCase();
  const localHour = parseInt(
    now.toLocaleString("en-CA", { timeZone: tz, hour: "numeric", hour12: false }),
    10,
  );

  if (localDay !== "friday" || localHour !== targetHour) {
    return NextResponse.json({ skipped: true, localDay, localHour });
  }

  const weekIso = `${now.getUTCFullYear()}-W${String(isoWeek(now)).padStart(2, "0")}`;

  const startRow = await prisma.cronRunLog.create({
    data: { cron_name: "top-giver-announcement", tenant_id: tenantId ?? null, outcome: "success" },
  });

  try {
    if (!tenantId) {
      await prisma.cronRunLog.update({
        where: { id: startRow.id },
        data: { completed_at: new Date(), outcome: "success", rows_processed: 0 },
      });
      return NextResponse.json({ ok: true, processed: 0 });
    }

    // Find rank-1 winner for the current week
    const winner = await prisma.leaderboardWinner.findFirst({
      where: { tenant_id: tenantId, kind: "top_giver_week", rank: 1 },
      orderBy: { period_start: "desc" },
      include: { winner: { select: { id: true, email_settings: true } } },
    });

    let processed = 0;

    if (winner) {
      // Check opt-in (email_settings.top_giver_thank_you defaults true)
      const emailSettings = winner.winner.email_settings as Record<string, unknown> | null;
      const optedIn = emailSettings?.["top_giver_thank_you"] !== false;

      if (optedIn) {
        const idempotencyKey = `top_giver:${tenantId}:${weekIso}`;
        await prisma.$transaction(async (tx) => {
          const existing = await tx.emailOutbox.findUnique({ where: { idempotency_key: idempotencyKey } });
          if (!existing) {
            await writeOutboxRow(tx, {
              tenantId,
              templateType: "top_giver_announcement",
              recipientUserId: winner.winner_id,
              idempotencyKey,
              payload: { kudos_count: winner.kudos_count, week_iso: weekIso },
            });
          }
        });
        processed = 1;
      }
    }

    await prisma.cronRunLog.update({
      where: { id: startRow.id },
      data: { completed_at: new Date(), outcome: "success", rows_processed: processed },
    });

    return NextResponse.json({ ok: true, processed });
  } catch (err) {
    await prisma.cronRunLog.update({
      where: { id: startRow.id },
      data: { completed_at: new Date(), outcome: "failure" },
    });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
