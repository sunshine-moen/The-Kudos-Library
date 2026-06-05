import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  const invalid = verifyCronSecret(req);
  if (invalid) return invalid;

  const logRow = await prisma.cronRunLog.create({
    data: { cron_name: "dr_verify", outcome: "success" },
  });

  try {
    // Verify DB is reachable and returns expected structure
    const result = await prisma.$queryRaw<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM tenant
    `;
    const count = parseInt(result[0]?.count ?? "0", 10);

    await prisma.cronRunLog.update({
      where: { id: logRow.id },
      data: {
        completed_at: new Date(),
        outcome: "success",
        rows_processed: Number(count),
      },
    });

    return NextResponse.json({ processed: 1, tenant_count: Number(count) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.cronRunLog.update({
      where: { id: logRow.id },
      data: { completed_at: new Date(), outcome: "failure", error_message: message },
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
