import type { TenantContext } from "@/lib/auth/tenant-context";
import type { ContextCategory } from "@prisma/client";

export async function listContextCategories(
  _ctx: TenantContext,
): Promise<ContextCategory[]> {
  throw new Error("not implemented");
}
