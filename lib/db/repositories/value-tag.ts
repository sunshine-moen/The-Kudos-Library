import type { TenantContext } from "@/lib/auth/tenant-context";
import type { ValueTag } from "@prisma/client";

export async function listValueTags(
  _ctx: TenantContext,
): Promise<ValueTag[]> {
  throw new Error("not implemented");
}
