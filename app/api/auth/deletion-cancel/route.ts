import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyDeletionCancelToken } from "@/lib/auth/magic-link";
import { writeOutboxRow } from "@/lib/outbox/writer";
import { renderDeletionCancelled } from "@/lib/email/templates/deletion-cancelled";

export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", req.url));
  }

  const result = await verifyDeletionCancelToken(token);
  if (!result) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", req.url));
  }

  const user = await prisma.user.findFirst({
    where: { email: result.email, tenant_id: result.tenantId },
    select: { id: true, first_name: true, status: true },
  });

  if (!user || user.status !== "pending_deletion") {
    return NextResponse.redirect(new URL("/library", req.url));
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { status: "active", pending_deletion_at: null },
    });

    await writeOutboxRow(tx, {
      tenantId: result.tenantId,
      templateType: "deletion_cancelled",
      recipientUserId: user.id,
      payload: {
        firstName: user.first_name,
        html: renderDeletionCancelled({ firstName: user.first_name }),
      },
      idempotencyKey: `deletion_cancelled:${user.id}:token`,
    });
  });

  return NextResponse.redirect(new URL("/library?deletion-cancelled=1", req.url));
}
