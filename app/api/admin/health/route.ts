import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { captureWarning } from "@/lib/monitoring/sentry";

// Enforce at startup that ADMIN_HEALTH_SECRET != CRON_SECRET
const healthSecret = process.env.ADMIN_HEALTH_SECRET ?? "";
const cronSecret = process.env.CRON_SECRET ?? "";
if (healthSecret && cronSecret && healthSecret === cronSecret) {
  throw new Error("ADMIN_HEALTH_SECRET must not equal CRON_SECRET");
}

const EXPECTED_CRONS = [
  "outbox-poller",
  "badge-evaluator",
  "leaderboard-rollover",
  "inactive-nudge",
  "overlooked-recipient",
  "top-giver-announcement",
  "manager-digest",
  "prompt-of-week",
  "anniversary-reminder",
  "kudos-read-digest",
  "dr_verify",
];

function timingSafeSecretCheck(provided: string, expected: string): boolean {
  if (!expected) return false;
  try {
    const a = Buffer.from(provided.padEnd(expected.length));
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export async function GET(req: Request): Promise<NextResponse> {
  const authHeader = req.headers.get("authorization") ?? "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  // Wrong secret → 404 to avoid path enumeration
  if (!healthSecret || !timingSafeSecretCheck(provided, healthSecret)) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  let dbStatus: "ok" | "degraded" | "down" = "ok";
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 2000)),
    ]);
  } catch {
    dbStatus = "down";
  }

  const outboxPending = await prisma.emailOutbox.count({
    where: { delivered_at: null, cancelled_at: null },
  }).catch(() => -1);

  const outboxDeadLetter = await prisma.emailOutbox.count({
    where: {
      failed_at: { not: null },
      attempts: { gte: 3 },
      delivered_at: null,
      cancelled_at: null,
    },
  }).catch(() => -1);

  if (outboxDeadLetter > 0) {
    captureWarning("Dead-letter outbox rows detected", { count: outboxDeadLetter });
  }

  // Last run time for each expected cron
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentRuns = await prisma.cronRunLog.findMany({
    where: { started_at: { gte: last24h } },
    orderBy: { started_at: "desc" },
    select: { cron_name: true, started_at: true },
  }).catch(() => []);

  const lastCronRun: Record<string, string> = {};
  for (const run of recentRuns) {
    if (!(run.cron_name in lastCronRun)) {
      lastCronRun[run.cron_name] = relativeTime(run.started_at);
    }
  }

  return NextResponse.json({
    db: dbStatus,
    outbox_pending: outboxPending,
    outbox_dead_letter: outboxDeadLetter,
    last_cron_run: lastCronRun,
    env: process.env.NODE_ENV ?? "unknown",
  });
}
