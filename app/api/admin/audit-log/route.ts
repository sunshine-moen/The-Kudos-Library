import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";

const PAGE_LIMIT = 50;

export const GET = requireAdmin(async (req, ctx) => {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limitParam = searchParams.get("limit");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const actorId = searchParams.get("actor_id");
  const action = searchParams.get("action");

  const limit = Math.min(parseInt(limitParam ?? "") || PAGE_LIMIT, 100);

  const rows = await prisma.adminAuditLog.findMany({
    where: {
      tenant_id: ctx.tenantId,
      ...(from ? { occurred_at: { gte: new Date(from) } } : {}),
      ...(to ? { occurred_at: { lte: new Date(to) } } : {}),
      ...(actorId ? { actor_id: actorId } : {}),
      ...(action ? { action } : {}),
    },
    orderBy: { occurred_at: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      action: true,
      target_type: true,
      target_id: true,
      metadata: true,
      occurred_at: true,
      actor: { select: { first_name: true, last_name: true, id: true } },
    },
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (page[page.length - 1]?.id ?? null) : null;

  return NextResponse.json({ rows: page, nextCursor, hasMore });
});
