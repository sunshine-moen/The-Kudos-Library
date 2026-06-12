-- Migration 012: account deletion processor fields + magic_link_token CHECK update.
-- Makes kudos.giver_id nullable for anonymization on account deletion.
-- Adds audit_log_retention_days to team_settings.
-- CHECK constraint update moved here from 011 — new enum values can only be used
-- after the transaction that added them has committed.

-- Update magic_link_token CHECK to allow deletion_cancel (target_kudos_id NULL)
ALTER TABLE "magic_link_token" DROP CONSTRAINT IF EXISTS "chk_magic_link_kind";
ALTER TABLE "magic_link_token" ADD CONSTRAINT "chk_magic_link_kind"
  CHECK (
    (kind = 'deep_link' AND target_kudos_id IS NOT NULL)
    OR (kind IN ('login', 'deletion_cancel') AND target_kudos_id IS NULL)
  );

ALTER TABLE "kudos" ALTER COLUMN "giver_id" DROP NOT NULL;

ALTER TABLE "team_settings"
  ADD COLUMN "audit_log_retention_days" INT NOT NULL DEFAULT 365;
