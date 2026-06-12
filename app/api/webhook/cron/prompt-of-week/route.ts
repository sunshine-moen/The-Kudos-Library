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

  // Self-gate: Sunday at 18:00 local time
  const localDay = now.toLocaleString("en-CA", { timeZone: tz, weekday: "long" }).toLowerCase();
  const localHour = parseInt(
    now.toLocaleString("en-CA", { timeZone: tz, hour: "numeric", hour12: false }),
    10,
  );

  if (localDay !== "sunday" || localHour !== 18) {
    return NextResponse.json({ skipped: true, localDay, localHour });
  }

  const weekIso = `${now.getUTCFullYear()}-W${String(isoWeek(now)).padStart(2, "0")}`;

  const startRow = await prisma.cronRunLog.create({
    data: { cron_name: "prompt-of-week", tenant_id: tenantId ?? null, outcome: "success" },
  });

  try {
    if (!tenantId) {
      await prisma.cronRunLog.update({
        where: { id: startRow.id },
        data: { completed_at: new Date(), outcome: "success", rows_processed: 0 },
      });
      return NextResponse.json({ ok: true, processed: 0 });
    }

    type PromptRow = { id: string; prompt_text: string };

    // Find the next unpublished scheduled prompt (smallest future week_start_date)
    let prompt: PromptRow | null = await prisma.featuredPrompt.findFirst({
      where: {
        tenant_id: tenantId,
        week_start_date: { not: null, lte: new Date() },
        published_at: null,
        is_default_rotation: false,
      },
      orderBy: { week_start_date: "asc" },
      select: { id: true, prompt_text: true },
    });

    // Fall back to a random default-rotation prompt if no scheduled prompt queued
    if (!prompt) {
      const defaults = await prisma.featuredPrompt.findMany({
        where: { tenant_id: tenantId, is_default_rotation: true },
        select: { id: true, prompt_text: true },
      });
      if (defaults.length > 0) {
        const idx = defaults.length === 1 ? 0 : Math.floor(Math.random() * defaults.length);
        prompt = defaults[idx] ?? null;
      }
    }

    if (!prompt) {
      await prisma.cronRunLog.update({
        where: { id: startRow.id },
        data: { completed_at: new Date(), outcome: "success", rows_processed: 0 },
      });
      return NextResponse.json({ ok: true, processed: 0, reason: "no_prompts_available" });
    }

    // Publish the prompt
    await prisma.featuredPrompt.update({
      where: { id: prompt.id },
      data: { published_at: new Date() },
    });

    // Write one outbox row per active team member (broadcast)
    const members = await prisma.user.findMany({
      where: { tenant_id: tenantId, status: { in: ["active", "on_leave"] } },
      select: { id: true, email_settings: true },
    });

    const idempotencyBase = `prompt_of_week:${tenantId}:${weekIso}`;
    let processed = 0;

    await prisma.$transaction(async (tx) => {
      for (const member of members) {
        const emailSettings = member.email_settings as Record<string, unknown> | null;
        if (emailSettings?.["prompt_of_the_week"] === false) continue;

        const idempotencyKey = `${idempotencyBase}:${member.id}`;
        const existing = await tx.emailOutbox.findUnique({ where: { idempotency_key: idempotencyKey } });
        if (!existing) {
          await writeOutboxRow(tx, {
            tenantId,
            templateType: "prompt_of_the_week",
            recipientUserId: member.id,
            idempotencyKey,
            payload: { prompt_text: prompt.prompt_text, week_iso: weekIso },
          });
          processed++;
        }
      }
    });

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
