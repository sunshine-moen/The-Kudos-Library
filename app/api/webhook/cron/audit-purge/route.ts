import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  const invalid = verifyCronSecret(req);
  if (invalid) return invalid;

  const logRow = await prisma.cronRunLog.create({
    data: { cron_name: "audit_purge", outcome: "success" },
  });

  try {
    const tenants = await prisma.tenant.findMany({
      select: { id: true },
    });

    let totalDeleted = 0;

    for (const tenant of tenants) {
      const settings = await prisma.teamSettings.findUnique({
        where: { tenant_id: tenant.id },
        select: { audit_log_retention_days: true },
      });

      const retentionDays = settings?.audit_log_retention_days ?? 365;
      const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      const result = await prisma.adminAuditLog.deleteMany({
        where: {
          tenant_id: tenant.id,
          occurred_at: { lt: cutoff },
        },
      });

      totalDeleted += result.count;
    }

    await prisma.cronRunLog.update({
      where: { id: logRow.id },
      data: {
        completed_at: new Date(),
        outcome: "success",
        rows_processed: totalDeleted,
      },
    });

    return NextResponse.json({ deleted: totalDeleted });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.cronRunLog.update({
      where: { id: logRow.id },
      data: { completed_at: new Date(), outcome: "failure", error_message: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
