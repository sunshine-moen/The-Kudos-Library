import type { TenantContext } from "@/lib/auth/tenant-context";
import type { AuthorQuote } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function selectQuote(
  ctx: TenantContext,
  recipientEmail: string,
): Promise<AuthorQuote> {
  const recentQuoteIds = await prisma.emailSendLog.findMany({
    where: { tenant_id: ctx.tenantId, recipient_email: recipientEmail },
    orderBy: { created_at: "desc" },
    take: 5,
    select: { quote_id: true },
  });

  const excludeIds = recentQuoteIds
    .map((r) => r.quote_id)
    .filter((id): id is string => id !== null);

  const quotes = await prisma.authorQuote.findMany({
    where: {
      tenant_id: ctx.tenantId,
      is_active: true,
      id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined,
    },
    take: 10,
  });

  if (quotes.length === 0) {
    // Fallback: pick any active quote if all have been recently used
    const fallback = await prisma.authorQuote.findFirst({
      where: { tenant_id: ctx.tenantId, is_active: true },
    });
    if (!fallback) throw new Error("No author quotes available for tenant");
    return fallback;
  }

  return quotes[Math.floor(Math.random() * quotes.length)]!;
}
