import { NextResponse } from "next/server";
import { requireManager } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { ValidationError } from "@/lib/errors/app-error";

export const GET = requireManager(async (req, ctx) => {
  const url = new URL(req.url);
  const dateFrom = url.searchParams.get("date_from");
  const dateTo = url.searchParams.get("date_to");
  const recipientIdParam = url.searchParams.get("recipient_id");
  const giverIdParam = url.searchParams.get("giver_id");
  const valueTagId = url.searchParams.get("value_tag_id");
  const contextCategoryId = url.searchParams.get("context_category_id");

  if (!dateFrom || !dateTo) {
    throw new ValidationError("date_from and date_to are required");
  }

  const from = new Date(dateFrom);
  const to = new Date(dateTo);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    throw new ValidationError("Invalid date format");
  }
  if (from > to) {
    throw new ValidationError("date_from must be before date_to");
  }

  // For managers: scope to direct reports only
  let allowedRecipientIds: string[] | null = null;
  if (ctx.role === "manager") {
    const reports = await prisma.user.findMany({
      where: { manager_id: ctx.userId, tenant_id: ctx.tenantId, status: { in: ["active", "on_leave"] } },
      select: { id: true },
    });
    allowedRecipientIds = reports.map((r) => r.id);

    // If manager tries to filter by a specific recipient, enforce scope silently
    if (recipientIdParam && !allowedRecipientIds.includes(recipientIdParam)) {
      allowedRecipientIds = []; // returns no results
    } else if (recipientIdParam) {
      allowedRecipientIds = [recipientIdParam];
    }
  }

  const kudosList = await prisma.kudos.findMany({
    where: {
      tenant_id: ctx.tenantId,
      deleted_at: null,
      submitted_at: { gte: from, lte: to },
      ...(allowedRecipientIds !== null
        ? { recipient_id: { in: allowedRecipientIds } }
        : { ...(recipientIdParam ? { recipient_id: recipientIdParam } : {}) }),
      ...(giverIdParam ? { giver_id: giverIdParam } : {}),
      ...(valueTagId ? { kudos_values: { some: { value_tag_id: valueTagId } } } : {}),
      ...(contextCategoryId ? { context_category_id: contextCategoryId } : {}),
    },
    include: {
      giver: { select: { first_name: true, last_name: true } },
      recipient: { select: { first_name: true, last_name: true } },
      team_recipient: { select: { slug: true } },
      context_category: { select: { label: true } },
      kudos_values: { include: { value_tag: { select: { label: true } } } },
    },
    orderBy: { submitted_at: "desc" },
  });

  const header = [
    "id", "submitted_at", "giver_first_name", "giver_last_name",
    "recipient_first_name", "recipient_last_name", "team_recipient_slug",
    "message_text", "values", "context_category", "context_text", "book_design",
  ].join(",");

  const rows = kudosList.map((k) => {
    const values = k.kudos_values.map((v) => v.value_tag.label).join("; ");
    return [
      k.id,
      k.submitted_at.toISOString(),
      k.giver?.first_name ?? "",
      k.giver?.last_name ?? "",
      k.recipient?.first_name ?? "",
      k.recipient?.last_name ?? "",
      k.team_recipient?.slug ?? "",
      k.message_text,
      values,
      k.context_category?.label ?? "",
      k.context_text ?? "",
      k.book_design,
    ].map(csvEscape).join(",");
  });

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="kudos-export-${dateFrom}-${dateTo}.csv"`,
    },
  });
});

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
