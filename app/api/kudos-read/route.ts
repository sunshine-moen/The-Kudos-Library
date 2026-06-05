import { NextResponse } from "next/server";
import { withTenantContext } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { ValidationError } from "@/lib/errors/app-error";
import { z } from "zod";

const schema = z.object({ kudos_id: z.string().uuid() });

export const POST = withTenantContext(async (req, ctx) => {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ValidationError("kudos_id is required");

  const { kudos_id } = parsed.data;

  let isFirstEverRead = false;

  await prisma.$transaction(async (tx) => {
    // 1. Record the read (no-op if already recorded)
    await tx.kudosRead.upsert({
      where: { kudos_id_reader_id: { kudos_id, reader_id: ctx.userId } },
      create: { kudos_id, reader_id: ctx.userId, tenant_id: ctx.tenantId },
      update: {},
    });

    // 2. Race-free first-ever-read claim via conditional UPDATE
    const rows = await tx.$queryRaw<{ id: string }[]>`
      UPDATE team_member
      SET first_kudos_read_at = NOW()
      WHERE id = ${ctx.userId}::uuid
        AND tenant_id = ${ctx.tenantId}::uuid
        AND first_kudos_read_at IS NULL
      RETURNING id
    `;
    isFirstEverRead = rows.length > 0;
  });

  return NextResponse.json({ is_first_ever_read: isFirstEverRead });
});
