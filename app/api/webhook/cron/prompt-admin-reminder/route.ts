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
    select: { timezone: true, tenant_id: true, prompt_queue_low_threshold: true },
  });
  const tz = settings?.timezone ?? "America/Vancouver";
  const tenantId = settings?.tenant_id;
  const threshold = settings?.prompt_queue_low_threshold ?? 2;

  // Self-gate: Monday at 09:30 PT
  const localDay = now.toLocaleString("en-CA", { timeZone: tz, weekday: "long" }).toLowerCase();
  const localHour = parseInt(
    now.toLocaleString("en-CA", { timeZone: tz, hour: "numeric", hour12: false }),
    10,
  );
  const localMinute = parseInt(
    now.toLocaleString("en-CA", { timeZone: tz, minute: "numeric" }),
    10,
  );

  if (localDay !== "monday" || localHour !== 9 || localMinute < 30 || localMinute > 59) {
    return NextResponse.json({ skipped: true, localDay, localHour, localMinute });
  }

  const weekIso = `${now.getUTCFullYear()}-W${String(isoWeek(now)).padStart(2, "0")}`;

  const startRow = await prisma.cronRunLog.create({
    data: { cron_name: "prompt-admin-reminder", tenant_id: tenantId ?? null, outcome: "success" },
  });

  try {
    if (!tenantId) {
      await prisma.cronRunLog.update({
        where: { id: startRow.id },
        data: { completed_at: new Date(), outcome: "success", rows_processed: 0 },
      });
      return NextResponse.json({ ok: true, processed: 0 });
    }

    // Count queued (scheduled, unpublished) prompts
    const queuedCount = await prisma.featuredPrompt.count({
      where: {
        tenant_id: tenantId,
        week_start_date: { not: null },
        published_at: null,
        is_default_rotation: false,
      },
    });

    if (queuedCount >= threshold) {
      await prisma.cronRunLog.update({
        where: { id: startRow.id },
        data: { completed_at: new Date(), outcome: "success", rows_processed: 0 },
      });
      return NextResponse.json({ ok: true, processed: 0, reason: "queue_sufficient", queuedCount });
    }

    // Find active admins
    const admins = await prisma.user.findMany({
      where: { tenant_id: tenantId, role: "admin", status: "active" },
      select: { id: true },
    });

    const idempotencyBase = `prompt_admin_reminder:${tenantId}:${weekIso}`;
    let processed = 0;

    await prisma.$transaction(async (tx) => {
      for (const admin of admins) {
        const idempotencyKey = `${idempotencyBase}:${admin.id}`;
        const existing = await tx.emailOutbox.findUnique({ where: { idempotency_key: idempotencyKey } });
        if (!existing) {
          await writeOutboxRow(tx, {
            tenantId,
            templateType: "prompt_admin_reminder",
            recipientUserId: admin.id,
            idempotencyKey,
            payload: { queued_count: queuedCount, threshold },
          });
          processed++;
        }
      }
    });

    await prisma.cronRunLog.update({
      where: { id: startRow.id },
      data: { completed_at: new Date(), outcome: "success", rows_processed: processed },
    });

    return NextResponse.json({ ok: true, processed, queuedCount, threshold });
  } catch (err) {
    await prisma.cronRunLog.update({
      where: { id: startRow.id },
      data: { completed_at: new Date(), outcome: "failure" },
    });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
