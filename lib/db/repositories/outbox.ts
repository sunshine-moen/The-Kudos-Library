import type { TenantContext } from "@/lib/auth/tenant-context";
import type { EmailOutbox } from "@prisma/client";

export async function pollOutbox(
  _ctx: TenantContext,
  _limit?: number,
): Promise<EmailOutbox[]> {
  throw new Error("not implemented");
}

export async function markDelivered(
  _ctx: TenantContext,
  _outboxId: string,
): Promise<void> {
  throw new Error("not implemented");
}

export async function markFailed(
  _ctx: TenantContext,
  _outboxId: string,
  _reason: string,
): Promise<void> {
  throw new Error("not implemented");
}

export async function cancelOutboxRow(
  _ctx: TenantContext,
  _outboxId: string,
  _reason: string,
): Promise<void> {
  throw new Error("not implemented");
}
