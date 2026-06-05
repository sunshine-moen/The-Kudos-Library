-- Migration 001: Core infrastructure — tenant registry + shared icon presets
-- All PostgreSQL enums created here to avoid cross-migration ordering issues.

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE "UserRole" AS ENUM ('user', 'manager', 'admin');
CREATE TYPE "MemberStatus" AS ENUM ('active', 'on_leave', 'hidden', 'former', 'deleted', 'pending_deletion');
CREATE TYPE "DigestCadence" AS ENUM ('weekly', 'biweekly');
CREATE TYPE "TeamKind" AS ENUM ('organization', 'sub_team');
CREATE TYPE "EmailTemplateType" AS ENUM (
  'recipient_notify',
  'manager_digest',
  'manager_quiet_week',
  'top_giver_announcement',
  'badge_milestone',
  'inactive_nudge',
  'overlooked_recipient_nudge',
  'work_anniversary_reminder',
  'broadcast',
  'prompt_of_the_week',
  'prompt_admin_reminder',
  'kudos_was_read_digest',
  'deletion_confirmation',
  'deletion_cancelled'
);
CREATE TYPE "MagicLinkTokenKind" AS ENUM ('login', 'deep_link');
CREATE TYPE "AnniversaryKind" AS ENUM ('ubc', 'ag');
-- Values match Prisma @map() annotations
CREATE TYPE "AnniversaryLeadTime" AS ENUM ('1_week_before', '3_days_before', 'day_of');
CREATE TYPE "LeaderboardKind" AS ENUM ('top_giver_week', 'top_giver_month');
CREATE TYPE "CronOutcome" AS ENUM ('success', 'partial', 'failure');
CREATE TYPE "FeedbackKind" AS ENUM ('feature_request', 'bug_report');
CREATE TYPE "FeedbackStatus" AS ENUM ('open', 'acknowledged', 'closed');

-- ─── tenant ───────────────────────────────────────────────────────────────────
-- Single row at launch (AG). No tenant_id — this IS the registry.

CREATE TABLE "tenant" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"       TEXT NOT NULL,
  "slug"       TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── icon_preset ─────────────────────────────────────────────────────────────
-- Cross-tenant. Same icon set for all tenants. Seeded at deploy; read-only in app.

CREATE TABLE "icon_preset" (
  "key"          TEXT PRIMARY KEY,
  "visual_asset" TEXT NOT NULL,
  "label"        TEXT NOT NULL
);
