import type { TenantContext } from "@/lib/auth/tenant-context";
import type { Kudos, KudosValue } from "@prisma/client";

export type KudosWithValues = Kudos & { kudos_values: KudosValue[] };

export interface CreateKudosInput {
  recipient_id?: string;
  team_recipient_id?: string;
  message_text: string;
  book_design?: string;
  font_choice?: string;
  context_category_id?: string | null;
  context_text?: string | null;
  giphy_id?: string | null;
  featured_prompt_id?: string | null;
  value_tag_ids: string[];
}

export interface PatchKudosInput {
  message_text?: string;
  book_design?: string;
  font_choice?: string;
  context_category_id?: string | null;
  context_text?: string | null;
  giphy_id?: string | null;
  value_tag_ids?: string[];
}

export async function createKudos(
  _ctx: TenantContext,
  _input: CreateKudosInput,
): Promise<{ kudos_id: string; edit_window_expires_at: Date }> {
  throw new Error("not implemented");
}

export async function getKudos(
  _ctx: TenantContext,
  _kudosId: string,
): Promise<KudosWithValues | null> {
  throw new Error("not implemented");
}

export async function patchKudos(
  _ctx: TenantContext,
  _kudosId: string,
  _input: PatchKudosInput,
): Promise<Kudos> {
  throw new Error("not implemented");
}

export async function softDeleteKudos(
  _ctx: TenantContext,
  _kudosId: string,
): Promise<void> {
  throw new Error("not implemented");
}

export async function listKudosForLibrary(
  _ctx: TenantContext,
  _opts?: { limit?: number; cursor?: string },
): Promise<KudosWithValues[]> {
  throw new Error("not implemented");
}
