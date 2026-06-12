import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { z } from "zod";

const roleSchema = z.object({
  role: z.enum(["user", "manager", "admin"]),
});

export const POST = requireAdmin(async (req, ctx, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { role } = parsed.data;

  const member = await prisma.user.findFirst({
    where: { id, tenant_id: ctx.tenantId },
  });
  if (!member) throw new NotFoundError("Member not found");

  const settings = await prisma.teamSettings.findUnique({ where: { tenant_id: ctx.tenantId } });
  const maxAdmins = settings?.max_admins ?? 3;

  // Promoting to admin: check max_admins gate
  if (role === "admin" && member.role !== "admin") {
    const activeAdmins = await prisma.user.count({
      where: { tenant_id: ctx.tenantId, role: "admin", status: "active" },
    });
    if (activeAdmins >= maxAdmins) {
      return NextResponse.json(
        { error: `Cannot promote to admin: maximum of ${maxAdmins} admins reached` },
        { status: 422 },
      );
    }
  }

  // Demoting an admin: ensure at least 2 admins remain after demotion
  if (member.role === "admin" && role !== "admin") {
    const activeAdmins = await prisma.user.count({
      where: { tenant_id: ctx.tenantId, role: "admin", status: "active" },
    });
    if (activeAdmins <= 2) {
      return NextResponse.json(
        { error: "Cannot demote admin: at least 2 active admins must remain" },
        { status: 422 },
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id },
      data: { role },
    });

    await tx.adminAuditLog.create({
      data: {
        tenant_id: ctx.tenantId,
        actor_id: ctx.userId,
        action: "change_role",
        target_type: "team_member",
        target_id: id,
        metadata: { from: member.role, to: role } as object,
      },
    });
  });

  return NextResponse.json({ ok: true });
});
