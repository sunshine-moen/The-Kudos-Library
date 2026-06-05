import { NextResponse } from "next/server";
import { withTenantContext } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

export const GET = withTenantContext(async (_req, ctx) => {
  const tags = await prisma.valueTag.findMany({
    where: { tenant_id: ctx.tenantId, is_active: true },
    orderBy: [{ display_order: "asc" }, { label: "asc" }],
  });
  return NextResponse.json(tags);
});
