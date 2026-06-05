import { NextResponse } from "next/server";
import { withTenantContext } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

export const POST = withTenantContext(async (_req, ctx) => {
  await prisma.user.update({
    where: { id: ctx.userId },
    data: { tos_accepted_at: new Date() },
  });
  return NextResponse.json({ ok: true });
});
