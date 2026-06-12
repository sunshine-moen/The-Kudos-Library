import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { ValidationError } from "@/lib/errors/app-error";

export const GET = requireAdmin(async (_req, ctx) => {
  const members = await prisma.user.findMany({
    where: {
      tenant_id: ctx.tenantId,
      status: { not: "deleted" },
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      role: true,
      status: true,
      department: true,
      job_title: true,
      digest_cadence: true,
      on_leave_from: true,
      on_leave_until: true,
      sub_team: { select: { id: true, name: true, slug: true } },
      manager: { select: { id: true, first_name: true, last_name: true } },
    },
    orderBy: [{ status: "asc" }, { last_name: "asc" }, { first_name: "asc" }],
  });
  return NextResponse.json(members);
});

const addMemberSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email(),
  department: z.string().max(100).optional(),
  job_title: z.string().max(100).optional(),
  sub_team_id: z.string().uuid().nullable().optional(),
  role: z.enum(["user", "manager", "admin"]).default("user"),
  manager_id: z.string().uuid().nullable().optional(),
  digest_cadence: z.enum(["weekly", "biweekly"]).default("weekly"),
});

export const POST = requireAdmin(async (req, ctx) => {
  const body = await req.json().catch(() => null);
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const input = parsed.data;

  // Check max_admins gate if adding an admin
  if (input.role === "admin") {
    const settings = await prisma.teamSettings.findUnique({ where: { tenant_id: ctx.tenantId } });
    const activeAdmins = await prisma.user.count({
      where: { tenant_id: ctx.tenantId, role: "admin", status: "active" },
    });
    if (activeAdmins >= (settings?.max_admins ?? 3)) {
      return NextResponse.json(
        { error: `Cannot add admin: maximum of ${settings?.max_admins ?? 3} admins reached` },
        { status: 422 },
      );
    }
  }

  const member = await prisma.$transaction(async (tx) => {
    const created = await tx.user.upsert({
      where: { tenant_id_email: { email: input.email, tenant_id: ctx.tenantId } },
      create: {
        tenant_id: ctx.tenantId,
        email: input.email,
        first_name: input.first_name,
        last_name: input.last_name,
        department: input.department ?? undefined,
        job_title: input.job_title ?? undefined,
        sub_team_id: input.sub_team_id ?? undefined,
        role: input.role,
        manager_id: input.manager_id ?? undefined,
        digest_cadence: input.digest_cadence,
        status: "active",
      },
      update: {
        first_name: input.first_name,
        last_name: input.last_name,
        department: input.department ?? undefined,
        job_title: input.job_title ?? undefined,
        sub_team_id: input.sub_team_id ?? undefined,
        role: input.role,
        manager_id: input.manager_id ?? undefined,
        digest_cadence: input.digest_cadence,
        status: "active",
      },
    });

    await tx.adminAuditLog.create({
      data: {
        tenant_id: ctx.tenantId,
        actor_id: ctx.userId,
        action: "add_member",
        target_type: "team_member",
        target_id: created.id,
        metadata: { email: input.email, role: input.role },
      },
    });

    return created;
  });

  return NextResponse.json({ id: member.id }, { status: 201 });
});
