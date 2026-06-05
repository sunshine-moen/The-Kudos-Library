import type { TenantContext } from "@/lib/auth/tenant-context";
import type { FeaturedPrompt } from "@prisma/client";

export async function getActivePrompt(
  _ctx: TenantContext,
  _weekStartDate: Date,
): Promise<FeaturedPrompt | null> {
  throw new Error("not implemented");
}

export async function listDefaultPrompts(
  _ctx: TenantContext,
): Promise<FeaturedPrompt[]> {
  throw new Error("not implemented");
}
