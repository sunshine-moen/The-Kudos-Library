import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";
import { z } from "zod";

const leaveSchema = z.object({
  action: z.enum(["start", "return"]),
  on_leave_until: z.string().datetime().nullable().optional(),
});

export const POST = requireAdmin(async (req, ctx, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = leaveSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const member = await prisma.user.findFirst({
    where: { id, tenant_id: ctx.tenantId },
  });
  if (!member) throw new NotFoundError("Member not found");

  const { action, on_leave_until } = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (action === "start") {
      await tx.user.update({
        where: { id },
        data: {
          status: "on_leave",
          on_leave_from: new Date(),
          on_leave_until: on_leave_until ? new Date(on_leave_until) : null,
        },
      });
    } else {
      await tx.user.update({
        where: { id },
        data: {
          status: "active",
          on_leave_from: null,
          on_leave_until: null,
        },
      });
    }

    await tx.adminAuditLog.create({
      data: {
        tenant_id: ctx.tenantId,
        actor_id: ctx.userId,
        action: action === "start" ? "set_on_leave" : "return_from_leave",
        target_type: "team_member",
        target_id: id,
        metadata: { on_leave_until: on_leave_until ?? null } as object,
      },
    });
  });

  return NextResponse.json({ ok: true });
});
