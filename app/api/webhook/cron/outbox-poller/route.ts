import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send";
import { selectQuote } from "@/lib/email/quote-footer";
import { renderRecipientNotify } from "@/lib/email/templates/recipient-notify";
import { AG_TENANT_ID } from "@/lib/auth/tenant-context";
import { issueDeepLink } from "@/lib/auth/magic-link";

const POLL_LIMIT = 25;

export async function GET(req: Request) {
  const invalid = verifyCronSecret(req);
  if (invalid) return invalid;

  const logRow = await prisma.cronRunLog.create({
    data: { cron_name: "outbox_poller", tenant_id: AG_TENANT_ID, outcome: "success" },
  });

  let processed = 0;
  let errors = 0;

  try {
    // FOR UPDATE SKIP LOCKED prevents double-processing under concurrent invocations
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM email_outbox
      WHERE delivered_at IS NULL
        AND cancelled_at IS NULL
        AND attempts < 3
        AND send_after <= NOW()
      ORDER BY send_after
      LIMIT ${POLL_LIMIT}
      FOR UPDATE SKIP LOCKED
    `;

    for (const { id } of rows) {
      const outbox = await prisma.emailOutbox.findUnique({
        where: { id },
        include: { recipient: { select: { email: true, first_name: true, last_name: true } } },
      });
      if (!outbox) continue;

      const ctx = { tenantId: outbox.tenant_id, userId: "system", role: "admin" as const };

      try {
        if (outbox.template_type === "recipient_notify" && outbox.kudos_id) {
          // Re-check kudos deleted_at immediately before send
          const kudos = await prisma.kudos.findUnique({
            where: { id: outbox.kudos_id },
            include: {
              kudos_values: { include: { value_tag: true } },
              giver: { select: { first_name: true, last_name: true } },
              recipient: { select: { first_name: true, last_name: true, email: true } },
              context_category: { select: { label: true } },
            },
          });

          if (!kudos) {
            await prisma.emailOutbox.update({
              where: { id },
              data: { cancelled_at: new Date(), cancellation_reason: "kudos_not_found" },
            });
            continue;
          }

          if (kudos.deleted_at) {
            await prisma.emailOutbox.update({
              where: { id },
              data: {
                cancelled_at: new Date(),
                cancellation_reason: "kudos_soft_deleted_during_render",
              },
            });
            continue;
          }

          const recipientEmail =
            outbox.recipient?.email ?? kudos.recipient?.email;

          if (!recipientEmail) {
            await prisma.emailOutbox.update({
              where: { id },
              data: { cancelled_at: new Date(), cancellation_reason: "recipient_email_missing" },
            });
            continue;
          }

          const quote = await selectQuote(ctx, recipientEmail);

          const deepLinkUrl = await issueDeepLink(outbox.tenant_id, outbox.kudos_id, recipientEmail);

          const { subject, html } = renderRecipientNotify({
            kudos,
            giver: kudos.giver,
            recipient: kudos.recipient ?? { first_name: "", last_name: "", email: recipientEmail },
            deepLinkUrl,
            quote,
            contextCategoryLabel: kudos.context_category?.label,
          });

          const result = await sendEmail({
            to: recipientEmail,
            subject,
            html,
            idempotencyKey: outbox.idempotency_key,
          });

          if (result.delivered) {
            await prisma.$transaction([
              prisma.emailOutbox.update({
                where: { id },
                data: { delivered_at: new Date() },
              }),
              prisma.emailSendLog.create({
                data: {
                  tenant_id: outbox.tenant_id,
                  template_type: outbox.template_type,
                  recipient_email: recipientEmail,
                  quote_id: quote.id,
                  sent_at: new Date(),
                },
              }),
            ]);
            processed++;
          } else {
            await prisma.emailOutbox.update({
              where: { id },
              data: {
                failure_reason: result.error,
                attempts: { increment: 1 },
              },
            });
            errors++;
          }
        } else {
          // Template type not yet handled — skip and log
          await prisma.emailOutbox.update({
            where: { id },
            data: {
              failure_reason: `template_type "${outbox.template_type}" not yet implemented`,
              attempts: { increment: 1 },
            },
          });
        }
      } catch (rowErr) {
        const message = rowErr instanceof Error ? rowErr.message : "Unknown error";
        await prisma.emailOutbox.update({
          where: { id },
          data: { failure_reason: message, attempts: { increment: 1 } },
        });
        errors++;
      }
    }

    await prisma.cronRunLog.update({
      where: { id: logRow.id },
      data: { completed_at: new Date(), outcome: errors > 0 && processed === 0 ? "failure" : errors > 0 ? "partial" : "success", rows_processed: processed },
    });

    return NextResponse.json({ processed, errors });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.cronRunLog.update({
      where: { id: logRow.id },
      data: { completed_at: new Date(), outcome: "failure", error_message: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
