import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

const WINDOW_DAYS = 30;

export const GET = requireAdmin(async (_req, ctx) => {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const tenantId = ctx.tenantId;

  const [
    cronRuns,
    outboxDeadLetter,
    outboxRecentDeliveries,
    emailSendStats,
    kudosCount,
    activeGivers,
    activeRecipients,
    totalKudosReads,
  ] = await Promise.all([
    // Cron health: all runs in window
    prisma.cronRunLog.findMany({
      where: { started_at: { gte: since } },
      select: {
        cron_name: true,
        outcome: true,
        rows_processed: true,
        started_at: true,
        completed_at: true,
      },
      orderBy: { started_at: "asc" },
    }),

    // Dead-letter outbox count
    prisma.emailOutbox.count({
      where: {
        tenant_id: tenantId,
        failed_at: { not: null },
        attempts: { gte: 3 },
        delivered_at: null,
        cancelled_at: null,
      },
    }),

    // Recent delivered outbox rows (for avg delivery time)
    prisma.emailOutbox.findMany({
      where: {
        tenant_id: tenantId,
        delivered_at: { gte: since, not: null },
      },
      select: { send_after: true, delivered_at: true },
      take: 500,
    }),

    // Email send log: count by template + outcome
    prisma.emailSendLog.groupBy({
      by: ["template_type"],
      where: { tenant_id: tenantId, created_at: { gte: since } },
      _count: { id: true },
      _sum: { attempts: true },
    }),

    // Kudos submitted
    prisma.kudos.count({
      where: { tenant_id: tenantId, submitted_at: { gte: since }, deleted_at: null },
    }),

    // Unique givers (non-null giver_id)
    prisma.kudos.findMany({
      where: {
        tenant_id: tenantId,
        submitted_at: { gte: since },
        deleted_at: null,
        giver_id: { not: null },
      },
      select: { giver_id: true },
      distinct: ["giver_id"],
    }),

    // Unique recipients
    prisma.kudos.findMany({
      where: {
        tenant_id: tenantId,
        submitted_at: { gte: since },
        deleted_at: null,
        recipient_id: { not: null },
      },
      select: { recipient_id: true },
      distinct: ["recipient_id"],
    }),

    // Total kudos reads in window (witnessing proxy)
    prisma.kudosRead.count({
      where: {
        kudos: {
          tenant_id: tenantId,
          submitted_at: { gte: since },
          deleted_at: null,
        },
      },
    }),
  ]);

  // ── Cron health aggregation ────────────────────────────────────────────────

  const cronMap: Record<
    string,
    { total: number; succeeded: number; failed: number; avgRowsProcessed: number | null; rowsSum: number; rowsCount: number }
  > = {};

  for (const run of cronRuns) {
    const entry = cronMap[run.cron_name] ?? {
      total: 0,
      succeeded: 0,
      failed: 0,
      avgRowsProcessed: null,
      rowsSum: 0,
      rowsCount: 0,
    };
    entry.total++;
    if (run.outcome === "success") entry.succeeded++;
    if (run.outcome === "failure") entry.failed++;
    if (run.rows_processed !== null && run.rows_processed !== undefined) {
      entry.rowsSum += run.rows_processed;
      entry.rowsCount++;
    }
    cronMap[run.cron_name] = entry;
  }

  const cron_health = Object.entries(cronMap).map(([name, stats]) => ({
    cron_name: name,
    total_runs: stats.total,
    succeeded: stats.succeeded,
    failed: stats.failed,
    success_rate_pct:
      stats.total > 0 ? Math.round((stats.succeeded / stats.total) * 100) : null,
    avg_rows_processed:
      stats.rowsCount > 0 ? Math.round(stats.rowsSum / stats.rowsCount) : null,
  }));

  // ── Outbox health ──────────────────────────────────────────────────────────

  let avgDeliveryMinutes: number | null = null;
  if (outboxRecentDeliveries.length > 0) {
    const totalMs = outboxRecentDeliveries.reduce((sum, row) => {
      if (!row.delivered_at) return sum;
      return sum + (row.delivered_at.getTime() - row.send_after.getTime());
    }, 0);
    avgDeliveryMinutes = Math.round(totalMs / outboxRecentDeliveries.length / 60_000);
  }

  // ── Email delivery aggregation ─────────────────────────────────────────────

  const email_delivery = emailSendStats.map((row) => ({
    template_type: row.template_type,
    total_sent: row._count.id,
    avg_attempts: row._sum.attempts !== null
      ? Math.round((row._sum.attempts ?? 0) / row._count.id * 10) / 10
      : null,
  }));

  // ── Usage metrics ──────────────────────────────────────────────────────────

  return NextResponse.json({
    window_days: WINDOW_DAYS,
    generated_at: new Date().toISOString(),
    cron_health,
    outbox: {
      dead_letter_count: outboxDeadLetter,
      recent_deliveries: outboxRecentDeliveries.length,
      avg_delivery_minutes: avgDeliveryMinutes,
    },
    email_delivery,
    usage: {
      kudos_submitted: kudosCount,
      unique_givers: activeGivers.length,
      unique_recipients: activeRecipients.length,
      giver_recipient_ratio:
        activeRecipients.length > 0
          ? Math.round((activeGivers.length / activeRecipients.length) * 100) / 100
          : null,
      total_kudos_reads: totalKudosReads,
      avg_reads_per_kudos:
        kudosCount > 0
          ? Math.round((totalKudosReads / kudosCount) * 10) / 10
          : null,
    },
  });
});
