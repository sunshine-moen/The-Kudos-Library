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
    select: { timezone: true, tenant_id: true },
  });
  const tz = settings?.timezone ?? "America/Vancouver";
  const tenantId = settings?.tenant_id;

  // Self-gate: Friday at 16:00 PT
  const localDay = now.toLocaleString("en-CA", { timeZone: tz, weekday: "long" }).toLowerCase();
  const localHour = parseInt(
    now.toLocaleString("en-CA", { timeZone: tz, hour: "numeric", hour12: false }),
    10,
  );

  if (localDay !== "friday" || localHour !== 16) {
    return NextResponse.json({ skipped: true, localDay, localHour });
  }

  const weekIso = `${now.getUTCFullYear()}-W${String(isoWeek(now)).padStart(2, "0")}`;

  const startRow = await prisma.cronRunLog.create({
    data: { cron_name: "kudos-was-read-digest", tenant_id: tenantId ?? null, outcome: "success" },
  });

  try {
    if (!tenantId) {
      await prisma.cronRunLog.update({
        where: { id: startRow.id },
        data: { completed_at: new Date(), outcome: "success", rows_processed: 0 },
      });
      return NextResponse.json({ ok: true, processed: 0 });
    }

    // Find all active givers who have opted in
    const givers = await prisma.user.findMany({
      where: { tenant_id: tenantId, status: { in: ["active", "on_leave"] } },
      select: { id: true, first_name: true, email_settings: true },
    });

    let processed = 0;

    for (const giver of givers) {
      const emailSettings = giver.email_settings as Record<string, unknown> | null;
      // Default is false (opt-in); only send if explicitly true
      if (emailSettings?.["kudos_was_read_digest"] !== true) continue;

      const idempotencyKey = `kudos_read_digest:${tenantId}:${giver.id}:${weekIso}`;
      const alreadySent = await prisma.emailOutbox.findUnique({ where: { idempotency_key: idempotencyKey } });
      if (alreadySent) continue;

      // Find kudos given by this giver that have been read but not yet included in a digest
      const readKudos = await prisma.kudos.findMany({
        where: {
          tenant_id: tenantId,
          giver_id: giver.id,
          deleted_at: null,
          read_digest_sent_at: null,
          kudos_reads: { some: {} },
        },
        select: {
          id: true,
          message_text: true,
          recipient: { select: { first_name: true, last_name: true } },
          team_recipient: { select: { name: true } },
        },
      });

      if (readKudos.length === 0) continue;

      const readItems = readKudos.map((k) => {
        const recipientName = k.recipient
          ? `${k.recipient.first_name} ${k.recipient.last_name}`.trim()
          : (k.team_recipient?.name ?? "the team");
        const messageSnippet = k.message_text.length > 100
          ? k.message_text.slice(0, 97) + "…"
          : k.message_text;
        return { recipientName, messageSnippet };
      });

      const kudosIds = readKudos.map((k) => k.id);

      await prisma.$transaction(async (tx) => {
        await writeOutboxRow(tx, {
          tenantId,
          templateType: "kudos_was_read_digest",
          recipientUserId: giver.id,
          idempotencyKey,
          payload: { read_items: readItems, week_iso: weekIso },
        });
        // Mark all included kudos so they don't appear in future digests
        await tx.kudos.updateMany({
          where: { id: { in: kudosIds } },
          data: { read_digest_sent_at: new Date() },
        });
      });

      processed++;
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
