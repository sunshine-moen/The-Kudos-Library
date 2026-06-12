-- Migration 011: account deletion flow
-- Adds deletion_cancel token kind for 30-day cancellation links.

ALTER TYPE "MagicLinkTokenKind" ADD VALUE 'deletion_cancel';

-- Update magic_link_token CHECK to allow deletion_cancel (target_kudos_id NULL)
ALTER TABLE "magic_link_token" DROP CONSTRAINT IF EXISTS "chk_magic_link_kind";
ALTER TABLE "magic_link_token" ADD CONSTRAINT "chk_magic_link_kind"
  CHECK (
    (kind = 'deep_link' AND target_kudos_id IS NOT NULL)
    OR (kind IN ('login', 'deletion_cancel') AND target_kudos_id IS NULL)
  );
