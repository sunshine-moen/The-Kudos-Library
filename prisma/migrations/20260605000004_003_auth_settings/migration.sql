-- Migration 003: device_confirmation, magic_link_token, team_settings

-- ─── device_confirmation ─────────────────────────────────────────────────────
-- Hashed device tokens for the magic-link new-device confirmation flow.
-- 90-day inactivity expiry handled by audit-purge cron.

CREATE TABLE "device_confirmation" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"    UUID NOT NULL REFERENCES "tenant"("id"),
  "email"        TEXT NOT NULL,
  "device_token" TEXT NOT NULL,
  "confirmed_at" TIMESTAMPTZ NOT NULL,
  "last_used_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenant_id", "email", "device_token")
);

-- ─── magic_link_token ────────────────────────────────────────────────────────
-- Single-use; 14d TTL. kind=deep_link tokens carry target_kudos_id.
-- New-device click invalidates the token and issues a fresh device confirmation.

CREATE TABLE "magic_link_token" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"       UUID NOT NULL REFERENCES "tenant"("id"),
  "token_hash"      TEXT NOT NULL,
  "email"           TEXT NOT NULL,
  "kind"            "MagicLinkTokenKind" NOT NULL,
  "target_kudos_id" UUID,
  "expires_at"      TIMESTAMPTZ NOT NULL,
  "used_at"         TIMESTAMPTZ,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- deep_link tokens must carry a target kudos; login tokens must not
  CONSTRAINT "chk_magic_link_kind"
    CHECK (
      (kind = 'deep_link' AND target_kudos_id IS NOT NULL) OR
      (kind = 'login' AND target_kudos_id IS NULL)
    )
);

CREATE INDEX "idx_magic_link_token_hash"    ON "magic_link_token" ("token_hash");
CREATE INDEX "idx_magic_link_token_expires" ON "magic_link_token" ("expires_at");

-- ─── team_settings ───────────────────────────────────────────────────────────
-- One row per tenant. All cadence/timing knobs for crons and email sends.

CREATE TABLE "team_settings" (
  "id"                                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"                                UUID NOT NULL UNIQUE REFERENCES "tenant"("id"),
  "max_admins"                               INTEGER NOT NULL DEFAULT 3,
  "inactive_threshold_weeks"                 INTEGER NOT NULL DEFAULT 4,
  "overlooked_recipient_window_days"         INTEGER NOT NULL DEFAULT 30,
  "top_giver_send_local_time"                TEXT NOT NULL DEFAULT '15:00',
  "anniversary_lead_time"                    "AnniversaryLeadTime" NOT NULL DEFAULT '1_week_before',
  "anniversary_email_local_time"             TEXT NOT NULL DEFAULT '09:00',
  "timezone"                                 TEXT NOT NULL DEFAULT 'America/Vancouver',
  "email_log_retention_days"                 INTEGER NOT NULL DEFAULT 90,
  "leaderboard_top_n_week"                   INTEGER NOT NULL DEFAULT 5,
  "leaderboard_top_n_month"                  INTEGER NOT NULL DEFAULT 5,
  "prompt_of_week_send_local_day_and_time"   TEXT NOT NULL DEFAULT 'wednesday 09:00',
  "prompt_admin_reminder_local_day_and_time" TEXT NOT NULL DEFAULT 'friday 09:00',
  "kudos_was_read_digest_local_day_and_time" TEXT NOT NULL DEFAULT 'friday 15:00',
  "created_at"                               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"                               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- max_admins must be ≥2 so the health check (≥2 active admins gate) can always pass
  CONSTRAINT "chk_team_settings_max_admins" CHECK ("max_admins" >= 2)
);
