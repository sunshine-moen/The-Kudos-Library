import { NextResponse } from "next/server";
import { withTenantContext } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { ValidationError } from "@/lib/errors/app-error";
import { z } from "zod";

// recipient_notify is transactional and cannot be toggled off
const patchSchema = z.object({
  inactive_giver_nudge: z.boolean().optional(),
  top_giver_thank_you: z.boolean().optional(),
  kudos_was_read_digest: z.boolean().optional(),
  prompt_of_the_week: z.boolean().optional(),
  anniversary_reminders: z.boolean().optional(),
  overlooked_recipient_nudge: z.boolean().optional(),
  manager_digest: z.boolean().optional(),
  show_pickup_indicator: z.boolean().optional(),
  // Explicitly reject attempts to disable transactional email
  recipient_notify: z
    .literal(false)
    .transform(() => {
      throw new ValidationError("recipient_notify cannot be disabled");
    })
    .optional(),
});

export const PATCH = withTenantContext(async (req, ctx) => {
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const updates = parsed.data;

  // Load current settings and merge
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { email_settings: true },
  });

  const current = (user?.email_settings as Record<string, unknown>) ?? {};
  const merged = { ...current, ...updates };

  const updated = await prisma.user.update({
    where: { id: ctx.userId },
    data: { email_settings: merged },
    select: { email_settings: true },
  });

  return NextResponse.json(updated.email_settings);
});
