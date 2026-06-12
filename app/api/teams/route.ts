import { NextResponse } from "next/server";
import { withTenantContext } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

export const GET = withTenantContext(async (_req, ctx) => {
  const teams = await prisma.team.findMany({
    where: { tenant_id: ctx.tenantId },
    select: { id: true, name: true, slug: true, kind: true, description: true },
    orderBy: [{ kind: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(teams);
});
