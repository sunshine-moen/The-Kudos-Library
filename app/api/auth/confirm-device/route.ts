import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { confirmDevice } from "@/lib/auth/magic-link";

const DEVICE_COOKIE = "kl-device-token";
const PENDING_COOKIE = "kl-deep-link-pending";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const pendingRaw = cookieStore.get(PENDING_COOKIE)?.value;

  if (!pendingRaw) {
    return NextResponse.json({ error: "Session context expired" }, { status: 400 });
  }

  let pending: { userId: string; kudosId: string; email: string; tenantId: string };
  try {
    pending = JSON.parse(pendingRaw) as typeof pending;
  } catch {
    return NextResponse.json({ error: "Invalid session context" }, { status: 400 });
  }

  const deviceToken =
    cookieStore.get(DEVICE_COOKIE)?.value ?? randomUUID();

  // Confirm the device
  await confirmDevice(pending.tenantId, pending.email, deviceToken);

  // Verify user still exists
  const user = await prisma.user.findFirst({
    where: { id: pending.userId, tenant_id: pending.tenantId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Create a session
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: { userId: user.id, sessionToken, expires },
  });

  const SESSION_COOKIE = process.env.NODE_ENV === "production"
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  const response = NextResponse.json({ ok: true, kudos_id: pending.kudosId });
  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  });
  response.cookies.set(DEVICE_COOKIE, deviceToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 90 * 24 * 60 * 60,
    path: "/",
  });
  // Clear the pending cookie
  response.cookies.set(PENDING_COOKIE, "", { maxAge: 0, path: "/" });

  return response;
}
