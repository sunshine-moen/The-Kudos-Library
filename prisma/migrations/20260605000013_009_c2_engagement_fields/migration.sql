-- Migration 009: Phase C2 engagement fields
-- Adds published_at to featured_prompt, read_digest_sent_at + gif_alt_text to kudos,
-- and prompt_queue_low_threshold to team_settings.

-- Track when a featured prompt was broadcast to the team
ALTER TABLE "featured_prompt"
  ADD COLUMN "published_at" TIMESTAMPTZ;

-- Track which kudos have been included in a giver's read-digest email
ALTER TABLE "kudos"
  ADD COLUMN "read_digest_sent_at" TIMESTAMPTZ;

-- Alt text for optional GIF attachment on kudos
ALTER TABLE "kudos"
  ADD COLUMN "gif_alt_text" TEXT;

-- Low-queue threshold for prompt-admin-reminder cron (default: send reminder when < 2 queued)
ALTER TABLE "team_settings"
  ADD COLUMN "prompt_queue_low_threshold" INT NOT NULL DEFAULT 2;
