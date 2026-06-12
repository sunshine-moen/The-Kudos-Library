import { NextResponse } from "next/server";
import { withTenantContext } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { writeOutboxRow } from "@/lib/outbox/writer";
import { renderDeletionCancelled } from "@/lib/email/templates/deletion-cancelled";

export const POST = withTenantContext(async (_req, ctx) => {
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { email: true, first_name: true, status: true, pending_deletion_at: true },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.status !== "pending_deletion") {
    return NextResponse.json({ error: "No pending deletion" }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: ctx.userId },
      data: { status: "active", pending_deletion_at: null },
    });

    await writeOutboxRow(tx, {
      tenantId: ctx.tenantId,
      templateType: "deletion_cancelled",
      recipientUserId: ctx.userId,
      payload: {
        firstName: user.first_name,
        html: renderDeletionCancelled({ firstName: user.first_name }),
      },
      idempotencyKey: `deletion_cancelled:${ctx.userId}:${Date.now()}`,
    });
  });

  return NextResponse.json({ cancelled: true });
});
