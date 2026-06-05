import type { TenantContext } from "@/lib/auth/tenant-context";
import type { Team } from "@prisma/client";

export async function getTeam(
  _ctx: TenantContext,
  _teamId: string,
): Promise<Team | null> {
  throw new Error("not implemented");
}

export async function listTeams(
  _ctx: TenantContext,
): Promise<Team[]> {
  throw new Error("not implemented");
}
