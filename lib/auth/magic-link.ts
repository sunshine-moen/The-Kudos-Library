import { createHash, randomUUID } from "crypto";
import { prisma } from "@/lib/db/prisma";

const DEEP_LINK_TTL_DAYS = 14;

export async function issueDeepLink(
  tenantId: string,
  kudosId: string,
  recipientEmail: string,
): Promise<string> {
  const token = randomUUID();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + DEEP_LINK_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.magicLinkToken.create({
    data: {
      tenant_id: tenantId,
      token_hash: tokenHash,
      email: recipientEmail,
      kind: "deep_link",
      target_kudos_id: kudosId,
      expires_at: expiresAt,
    },
  });

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/auth/deep-link?token=${token}`;
}

export async function verifyDeepLink(
  token: string,
): Promise<{ kudosId: string; email: string; tenantId: string } | null> {
  const tokenHash = hashToken(token);

  const row = await prisma.magicLinkToken.findFirst({
    where: { token_hash: tokenHash, kind: "deep_link" },
  });

  if (!row) return null;
  if (row.used_at) return null;
  if (row.expires_at < new Date()) return null;
  if (!row.target_kudos_id) return null;

  // Mark as used atomically — if two requests race, only one wins
  const updated = await prisma.magicLinkToken.updateMany({
    where: { id: row.id, used_at: null },
    data: { used_at: new Date() },
  });

  if (updated.count === 0) return null;

  return { kudosId: row.target_kudos_id, email: row.email, tenantId: row.tenant_id };
}

const DELETION_CANCEL_TTL_DAYS = 30;

export async function issueDeletionCancelToken(
  tenantId: string,
  email: string,
): Promise<string> {
  const token = randomUUID();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + DELETION_CANCEL_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.magicLinkToken.create({
    data: {
      tenant_id: tenantId,
      token_hash: tokenHash,
      email,
      kind: "deletion_cancel",
      expires_at: expiresAt,
    },
  });

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/api/auth/deletion-cancel?token=${token}`;
}

export async function verifyDeletionCancelToken(
  token: string,
): Promise<{ email: string; tenantId: string } | null> {
  const tokenHash = hashToken(token);

  const row = await prisma.magicLinkToken.findFirst({
    where: { token_hash: tokenHash, kind: "deletion_cancel" },
  });

  if (!row) return null;
  if (row.used_at) return null;
  if (row.expires_at < new Date()) return null;

  const updated = await prisma.magicLinkToken.updateMany({
    where: { id: row.id, used_at: null },
    data: { used_at: new Date() },
  });

  if (updated.count === 0) return null;

  return { email: row.email, tenantId: row.tenant_id };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashDeviceToken(deviceToken: string): string {
  return createHash("sha256").update(`device:${deviceToken}`).digest("hex");
}

export async function isKnownDevice(
  tenantId: string,
  email: string,
  deviceToken: string,
): Promise<boolean> {
  const tokenHash = hashDeviceToken(deviceToken);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const row = await prisma.deviceConfirmation.findFirst({
    where: {
      tenant_id: tenantId,
      email,
      device_token: tokenHash,
      last_used_at: { gte: ninetyDaysAgo },
    },
  });

  if (row) {
    await prisma.deviceConfirmation.update({
      where: { id: row.id },
      data: { last_used_at: new Date() },
    });
    return true;
  }
  return false;
}

export async function confirmDevice(
  tenantId: string,
  email: string,
  deviceToken: string,
): Promise<void> {
  const tokenHash = hashDeviceToken(deviceToken);
  await prisma.deviceConfirmation.upsert({
    where: { tenant_id_email_device_token: { tenant_id: tenantId, email, device_token: tokenHash } },
    update: { last_used_at: new Date() },
    create: {
      tenant_id: tenantId,
      email,
      device_token: tokenHash,
      confirmed_at: new Date(),
      last_used_at: new Date(),
    },
  });
}
