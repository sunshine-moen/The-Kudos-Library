// AG_TENANT_ID: v1 single-tenant constant.
// v1.5+: replace with session-derived tenant lookup — see 15_decision_log.md
export const AG_TENANT_ID = process.env.AG_TENANT_ID ?? "ag-tenant-placeholder";

export type UserRole = "user" | "manager" | "admin";

export interface TenantContext {
  tenantId: string;
  userId: string;
  role: UserRole;
}

export function extractTenantContext(userId: string, role: UserRole): TenantContext {
  return {
    tenantId: AG_TENANT_ID,
    userId,
    role,
  };
}
