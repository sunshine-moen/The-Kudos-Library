import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { auth } from "@/lib/auth/auth";
import { extractTenantContext, type TenantContext, type UserRole } from "@/lib/auth/tenant-context";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/db/prisma";

type RouteHandler<T = unknown> = (
  req: Request,
  ctx: TenantContext,
) => Promise<NextResponse<T>>;

export function withTenantContext<T = unknown>(handler: RouteHandler<T>) {
  return async (req: Request): Promise<NextResponse> => {
    const session = await auth();
    if (!session?.user?.id) {
      throw new UnauthorizedError();
    }

    const member = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, status: true },
    });

    const inactiveStatuses = ["former", "deleted", "pending_deletion"];
    if (!member || inactiveStatuses.includes(member.status)) {
      throw new UnauthorizedError("Account not active");
    }

    const ctx = extractTenantContext(session.user.id, member.role as UserRole);
    return handler(req, ctx);
  };
}

export function requireAdmin<T = unknown>(handler: RouteHandler<T>) {
  return withTenantContext<T>(async (req, ctx) => {
    if (ctx.role !== "admin") {
      throw new ForbiddenError("Admin role required");
    }
    return handler(req, ctx);
  });
}

export function requireManager<T = unknown>(handler: RouteHandler<T>) {
  return withTenantContext<T>(async (req, ctx) => {
    if (ctx.role !== "manager" && ctx.role !== "admin") {
      throw new ForbiddenError("Manager role required");
    }
    return handler(req, ctx);
  });
}

/**
 * Returns null if valid, or a 404 NextResponse if invalid.
 * Cron handlers must check and return early if this returns a response.
 */
export function verifyCronSecret(req: Request): NextResponse | null {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") ?? "";
  const secret = process.env.CRON_SECRET ?? "";

  if (!secret || !checkSecrets(token, secret)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

export function verifyHealthSecret(req: Request): NextResponse | null {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") ?? "";
  const secret = process.env.ADMIN_HEALTH_SECRET ?? "";

  if (!secret || !checkSecrets(token, secret)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}

function checkSecrets(provided: string, expected: string): boolean {
  const a = Buffer.from(provided.padEnd(expected.length, "\0").slice(0, expected.length));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
