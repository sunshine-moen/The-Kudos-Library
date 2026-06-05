import { NextResponse } from "next/server";
import { withTenantContext, requireAdmin } from "@/lib/auth/middleware";
import { prisma } from "@/lib/db/prisma";
import { patchKudosSchema } from "@/lib/validators/kudos";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors/app-error";

export const PATCH = withTenantContext(async (req, ctx) => {
  const id = new URL(req.url).pathname.split("/").at(-1) ?? "";

  const kudos = await prisma.kudos.findFirst({
    where: { id, tenant_id: ctx.tenantId },
    select: { giver_id: true, deleted_at: true, edit_window_expires_at: true },
  });
  if (!kudos) throw new NotFoundError("Kudos");
  if (kudos.deleted_at) throw new ForbiddenError("Kudos has been deleted");
  if (kudos.giver_id !== ctx.userId) throw new ForbiddenError("Not your kudos");
  if (kudos.edit_window_expires_at < new Date()) {
    throw new ForbiddenError("Edit window has expired");
  }

  const body = await req.json().catch(() => null);
  const parsed = patchKudosSchema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const { value_tag_ids, ...fields } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    if (value_tag_ids !== undefined) {
      await tx.kudosValue.deleteMany({ where: { kudos_id: id } });
      if (value_tag_ids.length > 0) {
        await tx.kudosValue.createMany({
          data: value_tag_ids.map((vtId) => ({
            kudos_id: id,
            value_tag_id: vtId,
            tenant_id: ctx.tenantId,
          })),
        });
      }
    }
    return tx.kudos.update({ where: { id }, data: fields });
  });

  return NextResponse.json(updated);
});

export const DELETE = requireAdmin(async (req, ctx) => {
  const id = new URL(req.url).pathname.split("/").at(-1) ?? "";

  const kudos = await prisma.kudos.findFirst({
    where: { id, tenant_id: ctx.tenantId },
    select: { id: true },
  });
  if (!kudos) throw new NotFoundError("Kudos");

  await prisma.kudos.update({
    where: { id },
    data: { deleted_at: new Date() },
  });

  return new NextResponse(null, { status: 204 });
});
