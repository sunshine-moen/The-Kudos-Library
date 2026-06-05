import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { evaluateGiverBadges } from "@/lib/badges/evaluator";

export async function GET(req: Request) {
  const invalid = verifyCronSecret(req);
  if (invalid) return invalid;

  const startRow = await prisma.cronRunLog.create({
    data: { cron_name: "badge-evaluator", tenant_id: null, outcome: "success" },
  });

  let badgesAwarded = 0;
  let kudosProcessed = 0;
  let errors = 0;

  try {
    // Find distinct (giver_id, tenant_id) pairs ready for badge evaluation.
    // Uses idx_kudos_badge_eval index: (edit_window_expires_at, badge_evaluated_at, deleted_at)
    const readyKudos = await prisma.kudos.findMany({
      where: {
        edit_window_expires_at: { lte: new Date() },
        badge_evaluated_at: null,
        deleted_at: null,
      },
      select: { id: true, giver_id: true, tenant_id: true },
    });

    if (readyKudos.length === 0) {
      await prisma.cronRunLog.update({
        where: { id: startRow.id },
        data: { completed_at: new Date(), outcome: "success", rows_processed: 0 },
      });
      return NextResponse.json({ ok: true, kudosProcessed: 0, badgesAwarded: 0 });
    }

    // Deduplicate givers — evaluate each giver only once
    const giverMap = new Map<string, { giverId: string; tenantId: string; kudosIds: string[] }>();
    for (const k of readyKudos) {
      const key = `${k.tenant_id}:${k.giver_id}`;
      const entry = giverMap.get(key);
      if (entry) {
        entry.kudosIds.push(k.id);
      } else {
        giverMap.set(key, { giverId: k.giver_id, tenantId: k.tenant_id, kudosIds: [k.id] });
      }
    }

    for (const { giverId, tenantId, kudosIds } of giverMap.values()) {
      try {
        const newAwards = await prisma.$transaction(async (tx) => {
          const awards = await evaluateGiverBadges(tx, tenantId, giverId);

          // Mark all ready kudos for this giver as evaluated
          await tx.kudos.updateMany({
            where: { id: { in: kudosIds } },
            data: { badge_evaluated_at: new Date() },
          });

          return awards;
        });

        badgesAwarded += newAwards.length;
        kudosProcessed += kudosIds.length;
      } catch {
        errors++;
        // Still mark kudos as evaluated to avoid infinite retry loops on broken data
        await prisma.kudos.updateMany({
          where: { id: { in: kudosIds } },
          data: { badge_evaluated_at: new Date() },
        }).catch(() => undefined);
      }
    }

    await prisma.cronRunLog.update({
      where: { id: startRow.id },
      data: {
        completed_at: new Date(),
        outcome: errors > 0 ? "partial" : "success",
        rows_processed: kudosProcessed,
      },
    });

    return NextResponse.json({ ok: true, kudosProcessed, badgesAwarded, errors });
  } catch (err) {
    await prisma.cronRunLog.update({
      where: { id: startRow.id },
      data: { completed_at: new Date(), outcome: "failure" },
    });
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
