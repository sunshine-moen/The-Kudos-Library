-- Migration 005b: kudos
-- Central table. Carries the CHECK constraints and composite FKs that enforce
-- tenant isolation at the schema layer (binding constraint per ADD §3).

CREATE TABLE "kudos" (
  "id"                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"              UUID NOT NULL REFERENCES "tenant"("id"),
  "recipient_id"           UUID REFERENCES "team_member"("id"),
  "team_recipient_id"      UUID REFERENCES "team"("id"),
  "giver_id"               UUID NOT NULL REFERENCES "team_member"("id"),
  "message_text"           TEXT NOT NULL,
  "book_design"            TEXT NOT NULL DEFAULT 'classic-navy',
  "font_choice"            TEXT NOT NULL DEFAULT 'garamond',
  "context_category_id"    UUID REFERENCES "context_category"("id"),
  "context_text"           TEXT,
  "giphy_id"               TEXT,
  "featured_prompt_id"     UUID REFERENCES "featured_prompt"("id"),
  "submitted_at"           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Outbox send fires at this timestamp, not at submitted_at
  "edit_window_expires_at" TIMESTAMPTZ NOT NULL,
  -- NULL = not yet evaluated by badge-evaluator cron (runs after edit window closes)
  "badge_evaluated_at"     TIMESTAMPTZ,
  -- Admin soft-delete; recomputes badges + leaderboard for giver
  "deleted_at"             TIMESTAMPTZ,
  "updated_at"             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Exactly one of recipient_id or team_recipient_id must be set
  CONSTRAINT "chk_kudos_one_recipient"
    CHECK (num_nonnulls("recipient_id", "team_recipient_id") = 1),

  -- No self-kudos (individual recipient only; team kudos can include the giver)
  CONSTRAINT "chk_kudos_no_self"
    CHECK ("recipient_id" IS NULL OR "giver_id" <> "recipient_id"),

  -- Context text capped at 200 characters
  CONSTRAINT "chk_kudos_context_length"
    CHECK ("context_text" IS NULL OR char_length("context_text") <= 200)
);

-- Composite unique required so kudos_value, kudos_read, email_outbox, magic_link_token
-- can reference (kudos.id, kudos.tenant_id) via composite foreign keys
ALTER TABLE "kudos" ADD CONSTRAINT "kudos_id_tenant_id_key" UNIQUE ("id", "tenant_id");

-- Composite FKs: prevent cross-tenant linkage at write time
ALTER TABLE "kudos"
  ADD CONSTRAINT "fk_kudos_recipient_tenant"
    FOREIGN KEY ("recipient_id", "tenant_id")
    REFERENCES "team_member" ("id", "tenant_id");

ALTER TABLE "kudos"
  ADD CONSTRAINT "fk_kudos_team_recipient_tenant"
    FOREIGN KEY ("team_recipient_id", "tenant_id")
    REFERENCES "team" ("id", "tenant_id");

ALTER TABLE "kudos"
  ADD CONSTRAINT "fk_kudos_giver_tenant"
    FOREIGN KEY ("giver_id", "tenant_id")
    REFERENCES "team_member" ("id", "tenant_id");

-- Performance indexes
CREATE INDEX "idx_kudos_tenant"    ON "kudos" ("tenant_id");
CREATE INDEX "idx_kudos_giver"     ON "kudos" ("giver_id", "tenant_id", "deleted_at");
-- Used by badge-evaluator cron: find kudos past edit window but not yet evaluated
CREATE INDEX "idx_kudos_badge_eval" ON "kudos" ("edit_window_expires_at", "badge_evaluated_at", "deleted_at");
