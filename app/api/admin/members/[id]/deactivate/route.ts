import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ForbiddenError } from "@/lib/errors/app-error";

export const POST = requireAdmin(async (_req, ctx, { params }) => {
  const { id } = await params;

  const member = await prisma.user.findFirst({
    where: { id, tenant_id: ctx.tenantId },
  });
  if (!member) throw new NotFoundError("Member not found");
  if (member.id === ctx.userId) {
    throw new ForbiddenError("You cannot deactivate your own account");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: { status: "former" },
    });

    await tx.adminAuditLog.create({
      data: {
        tenant_id: ctx.tenantId,
        actor_id: ctx.userId,
        action: "deactivate_member",
        target_type: "team_member",
        target_id: id,
      },
    });
  });

  return NextResponse.json({ ok: true });
});
