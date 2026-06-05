import type { TenantContext } from "@/lib/auth/tenant-context";

export interface AuditLogInput {
  action: string;
  target_type: string;
  target_id?: string;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(
  _ctx: TenantContext,
  _input: AuditLogInput,
): Promise<void> {
  throw new Error("not implemented");
}
