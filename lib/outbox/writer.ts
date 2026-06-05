import type { Prisma, EmailTemplateType } from "@prisma/client";

export interface WriteOutboxRowOpts {
  tenantId: string;
  templateType: EmailTemplateType;
  kudosId?: string;
  recipientUserId?: string;
  badgeAwardId?: string;
  payload?: Record<string, unknown>;
  sendAfter?: Date;
  idempotencyKey: string;
}

export async function writeOutboxRow(
  tx: Prisma.TransactionClient,
  opts: WriteOutboxRowOpts,
): Promise<void> {
  await tx.emailOutbox.create({
    data: {
      tenant_id: opts.tenantId,
      template_type: opts.templateType,
      kudos_id: opts.kudosId,
      recipient_user_id: opts.recipientUserId,
      badge_award_id: opts.badgeAwardId,
      payload: opts.payload as object | undefined,
      send_after: opts.sendAfter ?? new Date(),
      idempotency_key: opts.idempotencyKey,
    },
  });
}
