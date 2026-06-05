import { z } from "zod";

export const createKudosSchema = z.object({
  mode: z.literal("individual"),
  recipient_id: z.string().uuid(),
  message_text: z.string().min(1).max(2000),
  book_design: z.string().optional(),
  font_choice: z.string().optional(),
  value_tag_ids: z.array(z.string().uuid()).default([]),
  context_category_id: z.string().uuid().nullable().optional(),
  context_text: z.string().max(200).nullable().optional(),
  giphy_id: z.string().nullable().optional(),
  featured_prompt_id: z.string().uuid().nullable().optional(),
});

export const patchKudosSchema = z.object({
  message_text: z.string().min(1).max(2000).optional(),
  book_design: z.string().optional(),
  font_choice: z.string().optional(),
  value_tag_ids: z.array(z.string().uuid()).optional(),
  context_category_id: z.string().uuid().nullable().optional(),
  context_text: z.string().max(200).nullable().optional(),
  giphy_id: z.string().nullable().optional(),
});

export type CreateKudosInput = z.infer<typeof createKudosSchema>;
export type PatchKudosInput = z.infer<typeof patchKudosSchema>;
