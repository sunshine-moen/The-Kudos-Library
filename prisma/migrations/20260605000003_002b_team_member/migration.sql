-- Migration 002b: team_member (NextAuth User model + app fields) + NextAuth session tables
-- Self-FK (manager_id) and sub_team FK → team require 002a to have run first.
-- NextAuth tables co-located here because they reference team_member.

-- ─── team_member ─────────────────────────────────────────────────────────────
-- This IS the NextAuth User model (@@map("team_member") in Prisma schema).
-- Pre-seeded with the AG roster before any member logs in.
-- On first magic-link login, NextAuth finds the existing row by email.

CREATE TABLE "team_member" (
  "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NextAuth adapter required fields
  "name"                TEXT,
  "email"               TEXT NOT NULL UNIQUE,
  "emailVerified"       TIMESTAMPTZ,
  "image"               TEXT,
  -- App-specific fields
  "tenant_id"           UUID NOT NULL REFERENCES "tenant"("id"),
  "first_name"          TEXT NOT NULL DEFAULT '',
  "last_name"           TEXT NOT NULL DEFAULT '',
  "department"          TEXT NOT NULL DEFAULT '',
  "job_title"           TEXT NOT NULL DEFAULT '',
  "ubc_hire_date"       DATE,
  "ag_join_date"        DATE,
  "icon"                TEXT NOT NULL DEFAULT 'book-default' REFERENCES "icon_preset"("key"),
  "role"                "UserRole" NOT NULL DEFAULT 'user',
  "manager_id"          UUID REFERENCES "team_member"("id"),
  "sub_team_id"         UUID REFERENCES "team"("id"),
  "digest_cadence"      "DigestCadence" NOT NULL DEFAULT 'weekly',
  "status"              "MemberStatus" NOT NULL DEFAULT 'active',
  "on_leave_from"       TIMESTAMPTZ,
  "on_leave_until"      TIMESTAMPTZ,
  "tos_accepted_at"     TIMESTAMPTZ,
  -- Atomic first-read claim; drives recipient onboarding teaching moment
  "first_kudos_read_at" TIMESTAMPTZ,
  -- Grace-period account deletion; processed by account-deletion-processor cron
  "pending_deletion_at" TIMESTAMPTZ,
  "email_settings"      JSONB NOT NULL DEFAULT '{"anniversary_reminders":true,"anniversary_about_me":true,"overlooked_recipient_nudge":true,"inactive_giver_nudge":true,"top_giver_thank_you":true,"prompt_of_the_week":true,"kudos_was_read_digest":false,"show_pickup_indicator":true}',
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenant_id", "email")
);

-- Composite unique required for composite FK references from kudos and other tables
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_id_tenant_id_key" UNIQUE ("id", "tenant_id");

CREATE INDEX "idx_team_member_tenant" ON "team_member" ("tenant_id");

-- Partial index: used by account-deletion-processor cron to find rows due for hard-delete
CREATE INDEX "idx_team_member_pending_deletion" ON "team_member" ("pending_deletion_at")
  WHERE "pending_deletion_at" IS NOT NULL;

-- ─── NextAuth session tables ──────────────────────────────────────────────────

CREATE TABLE "account" (
  "id"                TEXT PRIMARY KEY,
  "userId"            UUID NOT NULL REFERENCES "team_member"("id") ON DELETE CASCADE,
  "type"              TEXT NOT NULL,
  "provider"          TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token"     TEXT,
  "access_token"      TEXT,
  "expires_at"        INTEGER,
  "token_type"        TEXT,
  "scope"             TEXT,
  "id_token"          TEXT,
  "session_state"     TEXT,
  UNIQUE ("provider", "providerAccountId")
);

CREATE TABLE "session" (
  "id"           TEXT PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId"       UUID NOT NULL REFERENCES "team_member"("id") ON DELETE CASCADE,
  "expires"      TIMESTAMPTZ NOT NULL
);

CREATE TABLE "verification_token" (
  "identifier" TEXT NOT NULL,
  "token"      TEXT NOT NULL UNIQUE,
  "expires"    TIMESTAMPTZ NOT NULL,
  UNIQUE ("identifier", "token")
);
