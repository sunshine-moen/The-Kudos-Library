import type { TenantContext } from "@/lib/auth/tenant-context";
import type { LeaderboardWinner } from "@prisma/client";
import type { LeaderboardKind } from "@prisma/client";

export async function getLeaderboardWinners(
  _ctx: TenantContext,
  _kind: LeaderboardKind,
  _periodStart: Date,
): Promise<LeaderboardWinner[]> {
  throw new Error("not implemented");
}
