import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

const GRACE_PERIOD_DAYS = 30;

export async function GET(req: Request) {
  const invalid = verifyCronSecret(req);
  if (invalid) return invalid;

  const logRow = await prisma.cronRunLog.create({
    data: { cron_name: "account_deletion_processor", outcome: "success" },
  });

  try {
    const cutoff = new Date(Date.now() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    const members = await prisma.user.findMany({
      where: {
        status: "pending_deletion",
        pending_deletion_at: { lte: cutoff },
      },
      select: { id: true, tenant_id: true },
    });

    let processed = 0;
    let errors = 0;

    for (const member of members) {
      try {
        await prisma.$transaction(async (tx) => {
          // Anonymize kudos: null out giver/recipient references; text preserved
          await tx.kudos.updateMany({
            where: { tenant_id: member.tenant_id, giver_id: member.id },
            data: { giver_id: null },
          });
          await tx.kudos.updateMany({
            where: { tenant_id: member.tenant_id, recipient_id: member.id },
            data: { recipient_id: null },
          });

          // Delete badge awards
          await tx.badgeAward.deleteMany({
            where: { tenant_id: member.tenant_id, awarded_to: member.id },
          });

          // Delete leaderboard wins
          await tx.leaderboardWinner.deleteMany({
            where: { tenant_id: member.tenant_id, winner_id: member.id },
          });

          // Delete undelivered outbox rows
          await tx.emailOutbox.deleteMany({
            where: { tenant_id: member.tenant_id, recipient_user_id: member.id },
          });

          // Anonymize the member row; use sentinel email to preserve unique constraint
          await tx.user.update({
            where: { id: member.id },
            data: {
              status: "deleted",
              email: `deleted:${member.id}@kudos-library.deleted`,
              first_name: "Deleted",
              last_name: "User",
              pending_deletion_at: null,
            },
          });

          await tx.adminAuditLog.create({
            data: {
              tenant_id: member.tenant_id,
              actor_id: null,
              action: "account_deletion_processed",
              target_type: "team_member",
              target_id: member.id,
            },
          });
        });
        processed++;
      } catch {
        errors++;
      }
    }

    const outcome = errors === 0 ? "success" : processed > 0 ? "partial" : "failure";

    await prisma.cronRunLog.update({
      where: { id: logRow.id },
      data: {
        completed_at: new Date(),
        outcome,
        rows_processed: processed,
        error_message: errors > 0 ? `${errors} member(s) failed` : null,
      },
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
