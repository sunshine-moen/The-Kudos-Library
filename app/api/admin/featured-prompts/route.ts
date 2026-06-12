import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { ConflictError, ValidationError } from "@/lib/errors/app-error";
import { z } from "zod";

const postSchema = z.object({
  prompt_text: z.string().min(1).max(500),
  week_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  pre_tag_value_id: z.string().uuid().optional(),
});

export const POST = requireAdmin(async (req, ctx) => {
  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { prompt_text, week_start_date, pre_tag_value_id } = parsed.data;
  const weekDate = week_start_date ? new Date(week_start_date) : null;

  // Check for duplicate scheduled week (partial UNIQUE covers week_start_date IS NOT NULL)
  if (weekDate) {
    const existing = await prisma.featuredPrompt.findFirst({
      where: { tenant_id: ctx.tenantId, week_start_date: weekDate },
    });
    if (existing) throw new ConflictError("A featured prompt is already scheduled for that week");
  }

  const prompt = await prisma.$transaction(async (tx) => {
    const created = await tx.featuredPrompt.create({
      data: {
        tenant_id: ctx.tenantId,
        prompt_text,
        week_start_date: weekDate,
        pre_tag_value_id: pre_tag_value_id ?? null,
        scheduled_by: ctx.userId,
        is_default_rotation: false,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        tenant_id: ctx.tenantId,
        actor_id: ctx.userId,
        action: "featured_prompt_created",
        target_type: "featured_prompt",
        target_id: created.id,
        metadata: { week_start_date, prompt_text: prompt_text.slice(0, 100) },
      },
    });

    return created;
  });

  return NextResponse.json(prompt, { status: 201 });
});
