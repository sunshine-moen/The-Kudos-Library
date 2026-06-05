import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { auth } from "@/lib/auth/auth";
import { extractTenantContext, type TenantContext, type UserRole } from "@/lib/auth/tenant-context";
import { AppError, ForbiddenError, RateLimitError, UnauthorizedError } from "@/lib/errors/app-error";
import { prisma } from "@/lib/db/prisma";

type RouteHandler<T = unknown> = (
  req: Request,
  ctx: TenantContext,
) => Promise<NextResponse<T>>;

export function withTenantContext<T = unknown>(handler: RouteHandler<T>) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
      }

      const member = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true, status: true },
      });

      const inactiveStatuses = ["former", "deleted", "pending_deletion"];
      if (!member || inactiveStatuses.includes(member.status)) {
        return NextResponse.json({ error: "Account not active", code: "UNAUTHORIZED" }, { status: 401 });
      }

      const ctx = extractTenantContext(session.user.id, member.role as UserRole);
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof RateLimitError) {
        return NextResponse.json(
          { error: err.message, code: err.code },
          { status: 429, headers: { "Retry-After": String(err.retryAfterSeconds) } },
        );
      }
      if (err instanceof AppError) {
        return NextResponse.json({ error: err.message, code: err.code }, { status: err.httpStatus });
      }
      console.error("Unhandled route error:", err);
      return NextResponse.json({ error: "Internal server error", code: "INTERNAL_ERROR" }, { status: 500 });
    }
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
