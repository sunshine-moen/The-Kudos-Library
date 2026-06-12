import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { captureWarning } from "@/lib/monitoring/sentry";

const EXPECTED_CRONS = [
  "outbox-poller",
  "badge-evaluator",
  "leaderboard-rollover",
  "inactive-nudge",
  "overlooked-recipient",
  "top-giver-announcement",
  "manager-digest",
  "prompt_of_week",
  "anniversary_reminder",
  "kudos_read_digest",
];

export async function GET(req: Request) {
  const invalid = verifyCronSecret(req);
  if (invalid) return invalid;

  const logRow = await prisma.cronRunLog.create({
    data: { cron_name: "dr_verify", outcome: "success" },
  });

  const checks: Record<string, unknown> = {};
  let anyFailed = false;

  try {
    // 1. DB connectivity
    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000)),
      ]);
      checks.db = "ok";
    } catch (err) {
      checks.db = "down";
      anyFailed = true;
      captureWarning("dr-verify: DB connectivity failure", { error: String(err) });
    }

    // 2. Outbox dead-letter count
    const deadLetterCount = await prisma.emailOutbox.count({
      where: {
        failed_at: { not: null },
        attempts: { gte: 3 },
        delivered_at: null,
        cancelled_at: null,
      },
    });
    checks.outbox_dead_letter = deadLetterCount;
    if (deadLetterCount > 0) {
      anyFailed = true;
      captureWarning("dr-verify: outbox dead-letter rows detected", { count: deadLetterCount });
    }

    // 3. Check every expected cron has run in the last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentRuns = await prisma.cronRunLog.findMany({
      where: { started_at: { gte: since } },
      select: { cron_name: true },
    });
    const ran = new Set(recentRuns.map((r) => r.cron_name));

    const missingCrons: string[] = [];
    for (const name of EXPECTED_CRONS) {
      if (!ran.has(name)) missingCrons.push(name);
    }
    checks.missing_crons = missingCrons;
    if (missingCrons.length > 0) {
      anyFailed = true;
      captureWarning("dr-verify: expected crons not found in last 24h", { missing: missingCrons });
    }

    const outcome = anyFailed ? "partial" : "success";

    await prisma.cronRunLog.update({
      where: { id: logRow.id },
      data: {
        completed_at: new Date(),
        outcome,
        rows_processed: 1,
        error_message: anyFailed ? JSON.stringify(checks) : null,
      },
    });

    return NextResponse.json({ ok: !anyFailed, checks });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.cronRunLog.update({
      where: { id: logRow.id },
      data: { completed_at: new Date(), outcome: "failure", error_message: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
