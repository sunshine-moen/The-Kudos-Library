import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { ConflictError, ValidationError } from "@/lib/errors/app-error";
import { z } from "zod";

const IANA_TIMEZONES = Intl.supportedValuesOf("timeZone");

const patchSchema = z.object({
  edit_window_minutes: z.number().int().min(5).max(60).optional(),
  max_kudos_per_day_per_giver: z.number().int().min(1).max(100).optional(),
  kudos_char_limit: z.number().int().min(100).max(5000).optional(),
  context_char_limit: z.number().int().min(50).max(1000).optional(),
  context_required: z.boolean().optional(),
  leaderboard_top_n_week: z.number().int().min(1).max(20).optional(),
  leaderboard_top_n_month: z.number().int().min(1).max(20).optional(),
  inactive_threshold_weeks: z.number().int().min(1).max(52).optional(),
  overlooked_recipient_window_days: z.number().int().min(7).max(180).optional(),
  anniversary_reminder_advance_days: z.number().int().min(0).max(14).optional(),
  prompt_queue_low_threshold: z.number().int().min(1).max(10).optional(),
  timezone: z.string().refine((tz) => IANA_TIMEZONES.includes(tz), { message: "Invalid IANA timezone" }).optional(),
  max_admins: z.number().int().min(1).max(20).optional(),
  // v1.5 prep: per-tenant meeting-window exclusion for unprompted-giver rate metric
  team_meeting_day: z.enum(["Mon", "Tue", "Wed", "Thu", "Fri"]).nullable().optional(),
  team_meeting_end_local_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, { message: "team_meeting_end_local_time must be HH:MM (24-hour)" })
    .nullable()
    .optional(),
});

export const GET = requireAdmin(async (_req, ctx) => {
  const settings = await prisma.teamSettings.findUnique({
    where: { tenant_id: ctx.tenantId },
  });
  return NextResponse.json(settings ?? {});
});

export const PATCH = requireAdmin(async (req, ctx) => {
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const updates = parsed.data;

  // max_admins cannot be set below current active admin count
  if (updates.max_admins !== undefined) {
    const activeAdminCount = await prisma.user.count({
      where: { tenant_id: ctx.tenantId, role: "admin", status: "active" },
    });
    if (updates.max_admins < activeAdminCount) {
      throw new ConflictError(
        `Cannot set max_admins below current active admin count (${activeAdminCount})`,
      );
    }
  }

  const changedFields = Object.keys(updates);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.teamSettings.update({
      where: { tenant_id: ctx.tenantId },
      data: updates,
    });

    await tx.adminAuditLog.create({
      data: {
        tenant_id: ctx.tenantId,
        actor_id: ctx.userId,
        action: "settings_update",
        target_type: "team_settings",
        target_id: result.id,
        metadata: { changed_fields: changedFields },
      },
    });

    return result;
  });

  return NextResponse.json(updated);
});
