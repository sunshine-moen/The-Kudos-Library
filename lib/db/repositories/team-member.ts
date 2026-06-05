import type { TenantContext } from "@/lib/auth/tenant-context";
import type { User } from "@prisma/client";

export async function getMemberByEmail(
  _ctx: TenantContext,
  _email: string,
): Promise<User | null> {
  throw new Error("not implemented");
}

export async function getMemberById(
  _ctx: TenantContext,
  _userId: string,
): Promise<User | null> {
  throw new Error("not implemented");
}

export async function listActiveMembers(
  _ctx: TenantContext,
): Promise<Pick<User, "id" | "first_name" | "last_name" | "email" | "icon" | "status">[]> {
  throw new Error("not implemented");
}

export async function updateTosAccepted(
  _ctx: TenantContext,
): Promise<void> {
  throw new Error("not implemented");
}
