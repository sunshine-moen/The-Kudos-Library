import type { TenantContext } from "@/lib/auth/tenant-context";
import type { StaticContent } from "@prisma/client";

export async function getStaticContent(
  _ctx: TenantContext,
  _key: string,
): Promise<StaticContent | null> {
  throw new Error("not implemented");
}
