-- Migration 006: recognition tables
-- badge_definition, badge_award, leaderboard_winner

-- ─── badge_definition ────────────────────────────────────────────────────────
-- Seeded with 9 canonical badges (lib/badges/definitions.ts).
-- criteria is JSONB: { type, threshold } evaluated by badge-evaluator cron.

CREATE TABLE "badge_definition" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"    UUID NOT NULL REFERENCES "tenant"("id"),
  "key"          TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "description"  TEXT NOT NULL,
  "criteria"     JSONB NOT NULL,
  "visual_asset" TEXT NOT NULL DEFAULT '',
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenant_id", "key")
);

-- ─── badge_award ─────────────────────────────────────────────────────────────
-- One row per award event; a member may earn the same badge again after cooldown.
-- Idempotency key: (tenant_id, badge_id, awarded_to, awarded_at) — cron uses awarded_at date bucket.

CREATE TABLE "badge_award" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"  UUID NOT NULL REFERENCES "tenant"("id"),
  "badge_id"   UUID NOT NULL REFERENCES "badge_definition"("id"),
  "awarded_to" UUID NOT NULL REFERENCES "team_member"("id"),
  "awarded_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenant_id", "badge_id", "awarded_to", "awarded_at")
);

-- ─── leaderboard_winner ──────────────────────────────────────────────────────
-- Written by leaderboard-rollover cron; read by library + manager-digest.
-- Composite unique prevents double-fire on Mondays.

CREATE TABLE "leaderboard_winner" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"    UUID NOT NULL REFERENCES "tenant"("id"),
  "kind"         "LeaderboardKind" NOT NULL,
  "period_start" DATE NOT NULL,
  "period_end"   DATE NOT NULL,
  "winner_id"    UUID NOT NULL REFERENCES "team_member"("id"),
  "rank"         INTEGER NOT NULL,
  "kudos_count"  INTEGER NOT NULL,
  "awarded_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenant_id", "kind", "period_start", "rank")
);
