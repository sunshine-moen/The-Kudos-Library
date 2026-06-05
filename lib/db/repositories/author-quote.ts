import type { TenantContext } from "@/lib/auth/tenant-context";
import type { AuthorQuote } from "@prisma/client";

export async function selectQuote(
  _ctx: TenantContext,
  _recipientEmail: string,
): Promise<AuthorQuote> {
  throw new Error("not implemented");
}
