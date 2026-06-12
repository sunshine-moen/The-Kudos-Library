-- Migration 011: account deletion flow
-- Adds deletion_cancel token kind for 30-day cancellation links.
-- NOTE: The magic_link_token CHECK constraint update is in migration 012 because
-- PostgreSQL cannot use a newly-added enum value in the same transaction that created it.

ALTER TYPE "MagicLinkTokenKind" ADD VALUE IF NOT EXISTS 'deletion_cancel';
