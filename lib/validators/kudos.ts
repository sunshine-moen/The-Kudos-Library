import { z } from "zod";

const kudosCommonFields = {
  message_text: z.string().min(1).max(2000),
  book_design: z.string().optional(),
  font_choice: z.string().optional(),
  value_tag_ids: z.array(z.string().uuid()).default([]),
  context_category_id: z.string().uuid().nullable().optional(),
  context_text: z.string().max(200).nullable().optional(),
  giphy_id: z.string().nullable().optional(),
  gif_alt_text: z.string().max(200).nullable().optional(),
  featured_prompt_id: z.string().uuid().nullable().optional(),
};

export const createKudosIndividualSchema = z.object({
  mode: z.literal("individual"),
  recipient_id: z.string().uuid(),
  ...kudosCommonFields,
});

export const createKudosTeamSchema = z.object({
  mode: z.literal("team"),
  team_recipient_id: z.string().uuid(),
  ...kudosCommonFields,
});

export const createKudosSchema = z.discriminatedUnion("mode", [
  createKudosIndividualSchema,
  createKudosTeamSchema,
]);

export const patchKudosSchema = z.object({
  message_text: z.string().min(1).max(2000).optional(),
  book_design: z.string().optional(),
  font_choice: z.string().optional(),
  value_tag_ids: z.array(z.string().uuid()).optional(),
  context_category_id: z.string().uuid().nullable().optional(),
  context_text: z.string().max(200).nullable().optional(),
  giphy_id: z.string().nullable().optional(),
  gif_alt_text: z.string().max(200).nullable().optional(),
});

export type CreateKudosInput = z.infer<typeof createKudosSchema>;
export type PatchKudosInput = z.infer<typeof patchKudosSchema>;
