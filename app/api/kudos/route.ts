import { NextResponse } from "next/server";
import { withTenantContext } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { writeOutboxRow } from "@/lib/outbox/writer";
import { createKudosSchema } from "@/lib/validators/kudos";
import { ForbiddenError, RateLimitError, ValidationError } from "@/lib/errors/app-error";

const EDIT_WINDOW_MS = 15 * 60 * 1000;
const KUDOS_PER_HOUR_LIMIT = 30;

export const POST = withTenantContext(async (req, ctx) => {
  const body = await req.json().catch(() => null);
  const parsed = createKudosSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const input = parsed.data;

  if (input.recipient_id === ctx.userId) {
    throw new ForbiddenError("You cannot give kudos to yourself");
  }

  // Per-user rate limit: 30 kudos per hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.kudos.count({
    where: { giver_id: ctx.userId, tenant_id: ctx.tenantId, submitted_at: { gte: oneHourAgo } },
  });
  if (recentCount >= KUDOS_PER_HOUR_LIMIT) {
    throw new RateLimitError(3600);
  }

  const editWindowExpiresAt = new Date(Date.now() + EDIT_WINDOW_MS);

  const kudos = await prisma.$transaction(async (tx) => {
    const created = await tx.kudos.create({
      data: {
        tenant_id: ctx.tenantId,
        giver_id: ctx.userId,
        recipient_id: input.recipient_id,
        message_text: input.message_text,
        book_design: input.book_design ?? "classic-navy",
        font_choice: input.font_choice ?? "garamond",
        context_category_id: input.context_category_id ?? null,
        context_text: input.context_text ?? null,
        giphy_id: input.giphy_id ?? null,
        featured_prompt_id: input.featured_prompt_id ?? null,
        edit_window_expires_at: editWindowExpiresAt,
        kudos_values: input.value_tag_ids.length > 0
          ? {
              create: input.value_tag_ids.map((vtId) => ({
                value_tag_id: vtId,
                tenant_id: ctx.tenantId,
              })),
            }
          : undefined,
      },
    });

    await writeOutboxRow(tx, {
      tenantId: ctx.tenantId,
      templateType: "recipient_notify",
      kudosId: created.id,
      recipientUserId: input.recipient_id,
      sendAfter: editWindowExpiresAt,
      idempotencyKey: `recipient_notify:k:${created.id}:r:${input.recipient_id}`,
    });

    return created;
  });

  return NextResponse.json(
    { kudos_id: kudos.id, edit_window_expires_at: editWindowExpiresAt },
    { status: 201 },
  );
});
