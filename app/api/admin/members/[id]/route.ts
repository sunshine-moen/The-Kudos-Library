import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { NotFoundError, ValidationError } from "@/lib/errors/app-error";

const editMemberSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  department: z.string().max(100).nullable().optional(),
  job_title: z.string().max(100).nullable().optional(),
  sub_team_id: z.string().uuid().nullable().optional(),
  manager_id: z.string().uuid().nullable().optional(),
  digest_cadence: z.enum(["weekly", "biweekly"]).optional(),
});

export const PATCH = requireAdmin(async (req, ctx, { params }) => {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = editMemberSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const member = await prisma.user.findFirst({
    where: { id, tenant_id: ctx.tenantId },
  });
  if (!member) throw new NotFoundError("Member not found");

  await prisma.$transaction(async (tx) => {
    const d = parsed.data;
    // Prisma's discriminated union for update data requires a cast here — the
    // runtime types are correct; the TypeScript types are overly restrictive.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      ...(d.first_name !== undefined && { first_name: d.first_name }),
      ...(d.last_name !== undefined && { last_name: d.last_name }),
      ...(d.department !== undefined && { department: d.department }),
      ...(d.job_title !== undefined && { job_title: d.job_title }),
      ...(d.digest_cadence !== undefined && { digest_cadence: d.digest_cadence }),
      ...(d.sub_team_id !== undefined && { sub_team_id: d.sub_team_id }),
      ...(d.manager_id !== undefined && { manager_id: d.manager_id }),
    };
    await tx.user.update({ where: { id }, data: updateData });

    await tx.adminAuditLog.create({
      data: {
        tenant_id: ctx.tenantId,
        actor_id: ctx.userId,
        action: "edit_member",
        target_type: "team_member",
        target_id: id,
        metadata: parsed.data as object,
      },
    });
  });

  return NextResponse.json({ ok: true });
});
