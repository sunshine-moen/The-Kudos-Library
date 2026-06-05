import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";
import { verifyDeepLink, isKnownDevice, hashToken } from "@/lib/auth/magic-link";

const SESSION_MAX_AGE_DAYS = 30;
const DEVICE_COOKIE = "kl-device-token";
const SESSION_COOKIE = process.env.NODE_ENV === "production"
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=InvalidToken", req.url));
  }

  const result = await verifyDeepLink(token);

  if (!result) {
    // Distinguish between expired and already-used by re-querying without the used_at filter
    const row = await prisma.magicLinkToken.findFirst({
      where: { token_hash: hashToken(token), kind: "deep_link" },
      select: { used_at: true, expires_at: true },
    });

    if (row?.used_at) {
      return NextResponse.redirect(new URL("/login?error=LinkUsed", req.url));
    }
    if (row && row.expires_at < new Date()) {
      return NextResponse.redirect(new URL("/login?error=LinkExpired", req.url));
    }
    return NextResponse.redirect(new URL("/login?error=InvalidToken", req.url));
  }

  const user = await prisma.user.findFirst({
    where: { email: result.email, tenant_id: result.tenantId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/login?error=UserNotFound", req.url));
  }

  const cookieStore = await cookies();
  let deviceToken = cookieStore.get(DEVICE_COOKIE)?.value;

  // Set device cookie if not present
  if (!deviceToken) {
    deviceToken = randomUUID();
  }

  const knownDevice = deviceToken
    ? await isKnownDevice(result.tenantId, result.email, deviceToken)
    : false;

  if (!knownDevice) {
    // Redirect to device confirmation — pass a short-lived pending token via cookie
    const pendingToken = randomUUID();
    const response = NextResponse.redirect(
      new URL(`/auth/confirm-device?kudos_id=${result.kudosId}`, req.url),
    );
    response.cookies.set(DEVICE_COOKIE, deviceToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 90 * 24 * 60 * 60,
      path: "/",
    });
    // Store pending session creation context in a short-lived cookie
    response.cookies.set("kl-deep-link-pending", JSON.stringify({
      token: pendingToken,
      userId: user.id,
      kudosId: result.kudosId,
      email: result.email,
      tenantId: result.tenantId,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 10 * 60, // 10 minutes
      path: "/",
    });
    return response;
  }

  // Known device — create session and redirect directly
  const response = await createSessionAndRedirect(
    user.id,
    result.kudosId,
    deviceToken,
    req.url,
  );
  return response;
}

async function createSessionAndRedirect(
  userId: string,
  kudosId: string,
  deviceToken: string,
  requestUrl: string,
): Promise<NextResponse> {
  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { userId, sessionToken, expires },
  });

  const response = NextResponse.redirect(new URL(`/book/${kudosId}`, requestUrl));
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
  return response;
}
