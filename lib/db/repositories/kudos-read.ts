import type { TenantContext } from "@/lib/auth/tenant-context";

export interface RecordKudosReadResult {
  is_first_ever_read: boolean;
}

export async function recordKudosRead(
  _ctx: TenantContext,
  _kudosId: string,
): Promise<RecordKudosReadResult> {
  throw new Error("not implemented");
}
