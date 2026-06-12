import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from "@/lib/errors/app-error";
import { z } from "zod";

const patchSchema = z.object({
  prompt_text: z.string().min(1).max(500).optional(),
  week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  pre_tag_value_id: z.string().uuid().nullable().optional(),
});

export const PATCH = requireAdmin(async (req, ctx, { params }) => {
  const { id } = await (params as Promise<{ id: string }>);
  const prompt = await prisma.featuredPrompt.findFirst({
    where: { id, tenant_id: ctx.tenantId },
  });

  if (!prompt) throw new NotFoundError("Prompt not found");
  if (prompt.published_at) throw new ForbiddenError("Cannot edit a published prompt");

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { prompt_text, week_start_date, pre_tag_value_id } = parsed.data;
  const weekDate = week_start_date === null ? null : week_start_date ? new Date(week_start_date) : undefined;

  // Check for duplicate scheduled week (if changing week_start_date)
  if (weekDate !== undefined && weekDate !== null) {
    const existing = await prisma.featuredPrompt.findFirst({
      where: { tenant_id: ctx.tenantId, week_start_date: weekDate, id: { not: id } },
    });
    if (existing) throw new ConflictError("A featured prompt is already scheduled for that week");
  }

  const updated = await prisma.featuredPrompt.update({
    where: { id },
    data: {
      ...(prompt_text !== undefined ? { prompt_text } : {}),
      ...(weekDate !== undefined ? { week_start_date: weekDate } : {}),
      ...(pre_tag_value_id !== undefined ? { pre_tag_value_id } : {}),
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = requireAdmin(async (_req, ctx, { params }) => {
  const { id } = await (params as Promise<{ id: string }>);
  const prompt = await prisma.featuredPrompt.findFirst({
    where: { id, tenant_id: ctx.tenantId },
  });

  if (!prompt) throw new NotFoundError("Prompt not found");

  await prisma.$transaction(async (tx) => {
    await tx.featuredPrompt.delete({ where: { id } });

    await tx.adminAuditLog.create({
      data: {
        tenant_id: ctx.tenantId,
        actor_id: ctx.userId,
        action: "featured_prompt_deleted",
        target_type: "featured_prompt",
        target_id: id,
        metadata: { prompt_text: prompt.prompt_text.slice(0, 100) },
      },
    });
  });

  return new NextResponse(null, { status: 204 });
});
