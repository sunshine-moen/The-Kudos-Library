import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import type { LeaderboardKind } from "@prisma/client";

export async function GET(req: Request) {
  const invalid = verifyCronSecret(req);
  if (invalid) return invalid;

  const now = new Date();

  const settings = await prisma.teamSettings.findFirst({
    select: {
      timezone: true,
      tenant_id: true,
      leaderboard_top_n_week: true,
      leaderboard_top_n_month: true,
    },
  });
  const tz = settings?.timezone ?? "America/Vancouver";
  const tenantId = settings?.tenant_id;
  const topNWeek = settings?.leaderboard_top_n_week ?? 5;
  const topNMonth = settings?.leaderboard_top_n_month ?? 5;

  // Self-gate: only run on Monday 00:xx PT (weekly) OR 1st of month 00:xx PT (monthly)
  const localDay = now
    .toLocaleString("en-CA", { timeZone: tz, weekday: "long" })
    .toLowerCase();
  const localHour = parseInt(
    now.toLocaleString("en-CA", { timeZone: tz, hour: "numeric", hour12: false }),
    10,
  );

  // Parse local date components: en-CA gives "YYYY-MM-DD"
  const localDateStr = now.toLocaleDateString("en-CA", { timeZone: tz });
  const parts = localDateStr.split("-").map(Number);
  const [yr, mo, dy] = [parts[0] ?? 2024, parts[1] ?? 1, parts[2] ?? 1];

  const isMonday = localDay === "monday" && localHour === 0;
  const isFirstOfMonth = dy === 1 && localHour === 0;

  if (!isMonday && !isFirstOfMonth) {
    return NextResponse.json({ skipped: true, localDay, localHour, localDate: localDateStr });
  }

  const startRow = await prisma.cronRunLog.create({
    data: {
      cron_name: "leaderboard-rollover",
      tenant_id: tenantId ?? null,
      outcome: "success",
    },
  });

  let processed = 0;

  try {
    // Weekly rollover — every Monday midnight PT
    if (isMonday) {
      // period_end = midnight of this Monday (local date) expressed as UTC date
      const periodEnd = new Date(Date.UTC(yr, mo - 1, dy));
      const periodStart = new Date(periodEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
      processed += await rolloverLeaderboard({
        tenantId,
        kind: "top_giver_week",
        periodStart,
        periodEnd,
        topN: topNWeek,
      });
    }

    // Monthly rollover — 1st of month midnight PT
    if (isFirstOfMonth) {
      const periodEnd = new Date(Date.UTC(yr, mo - 1, 1));
      const prevMonth = mo === 1 ? 12 : mo - 1;
      const prevYear = mo === 1 ? yr - 1 : yr;
      const periodStart = new Date(Date.UTC(prevYear, prevMonth - 1, 1));
      processed += await rolloverLeaderboard({
        tenantId,
        kind: "top_giver_month",
        periodStart,
        periodEnd,
        topN: topNMonth,
      });
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

async function rolloverLeaderboard({
  tenantId,
  kind,
  periodStart,
  periodEnd,
  topN,
}: {
  tenantId: string | undefined;
  kind: LeaderboardKind;
  periodStart: Date;
  periodEnd: Date;
  topN: number;
}): Promise<number> {
  if (!tenantId) return 0;

  // Count non-deleted kudos given per member in the period
  const rawCounts = await prisma.kudos.groupBy({
    by: ["giver_id"],
    where: {
      tenant_id: tenantId,
      submitted_at: { gte: periodStart, lt: periodEnd },
      deleted_at: null,
      giver_id: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: topN,
  });
  const giverCounts = rawCounts.filter((g): g is typeof g & { giver_id: string } => g.giver_id !== null);

  if (giverCounts.length === 0) return 0;

  const result = await prisma.leaderboardWinner.createMany({
    data: giverCounts.map((g, i) => ({
      tenant_id: tenantId,
      kind,
      period_start: periodStart,
      period_end: periodEnd,
      winner_id: g.giver_id,
      rank: i + 1,
      kudos_count: g._count.id,
    })),
    skipDuplicates: true, // UNIQUE(tenant_id, kind, period_start, rank) → idempotent on retry
  });

  return result.count;
}
