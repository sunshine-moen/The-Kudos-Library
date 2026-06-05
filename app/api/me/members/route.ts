import { NextResponse } from "next/server";
import { withTenantContext } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

export const GET = withTenantContext(async (_req, ctx) => {
  const members = await prisma.user.findMany({
    where: {
      tenant_id: ctx.tenantId,
      status: { in: ["active", "on_leave"] },
      id: { not: ctx.userId },
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      job_title: true,
      department: true,
      icon: true,
    },
    orderBy: [{ first_name: "asc" }, { last_name: "asc" }],
  });
  return NextResponse.json(members);
});
