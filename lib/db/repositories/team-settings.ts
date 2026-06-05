import type { TenantContext } from "@/lib/auth/tenant-context";
import type { TeamSettings } from "@prisma/client";

export async function getTeamSettings(
  _ctx: TenantContext,
): Promise<TeamSettings | null> {
  throw new Error("not implemented");
}
