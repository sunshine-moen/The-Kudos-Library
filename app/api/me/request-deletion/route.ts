import { NextResponse } from "next/server";
import { withTenantContext } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { writeOutboxRow } from "@/lib/outbox/writer";
import { issueDeletionCancelToken } from "@/lib/auth/magic-link";
import { renderDeletionConfirmation } from "@/lib/email/templates/deletion-confirmation";

export const POST = withTenantContext(async (_req, ctx) => {
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { email: true, first_name: true, tenant_id: true, status: true },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.status === "pending_deletion") {
    return NextResponse.json({ error: "Deletion already scheduled" }, { status: 409 });
  }

  const deletionAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: ctx.userId },
      data: { status: "pending_deletion", pending_deletion_at: deletionAt },
    });

    await tx.emailOutbox.updateMany({
      where: {
        tenant_id: ctx.tenantId,
        recipient_user_id: ctx.userId,
        delivered_at: null,
        cancelled_at: null,
      },
      data: {
        cancelled_at: new Date(),
        cancellation_reason: "account_deletion_requested",
      },
    });
  });

  const cancelUrl = await issueDeletionCancelToken(ctx.tenantId, user.email);

  await prisma.$transaction(async (tx) => {
    await writeOutboxRow(tx, {
      tenantId: ctx.tenantId,
      templateType: "deletion_confirmation",
      recipientUserId: ctx.userId,
      payload: {
        firstName: user.first_name,
        deletionDate: deletionAt.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }),
        cancelUrl,
        html: renderDeletionConfirmation({
          firstName: user.first_name,
          deletionDate: deletionAt.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }),
          cancelUrl,
        }),
      },
      idempotencyKey: `deletion_request:${ctx.userId}`,
    });
  });

  return NextResponse.json({
    pending_deletion_at: deletionAt.toISOString(),
  });
});
