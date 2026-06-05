import type { TenantContext } from "@/lib/auth/tenant-context";
import type { BadgeDefinition, BadgeAward } from "@prisma/client";

export async function listBadgeDefinitions(
  _ctx: TenantContext,
): Promise<BadgeDefinition[]> {
  throw new Error("not implemented");
}

export async function createBadgeAward(
  _ctx: TenantContext,
  _input: { badge_id: string; awarded_to: string },
): Promise<BadgeAward> {
  throw new Error("not implemented");
}
