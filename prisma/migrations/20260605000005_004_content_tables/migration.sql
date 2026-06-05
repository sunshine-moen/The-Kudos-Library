-- Migration 004: Admin-editable content tables
-- value_tag, context_category, prompt_starter, author_quote, static_content, email_template

-- ─── value_tag ───────────────────────────────────────────────────────────────
-- Seeded with 12 AG values; admin can toggle is_active.

CREATE TABLE "value_tag" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"     UUID NOT NULL REFERENCES "tenant"("id"),
  "key"           TEXT NOT NULL,
  "label"         TEXT NOT NULL,
  "group_label"   TEXT NOT NULL DEFAULT '',
  "is_active"     BOOLEAN NOT NULL DEFAULT TRUE,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenant_id", "key")
);

-- Composite unique required for composite FK references from kudos_value
ALTER TABLE "value_tag" ADD CONSTRAINT "value_tag_id_tenant_id_key" UNIQUE ("id", "tenant_id");

-- ─── context_category ────────────────────────────────────────────────────────
-- Seeded with 6 AG context categories.

CREATE TABLE "context_category" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"     UUID NOT NULL REFERENCES "tenant"("id"),
  "key"           TEXT NOT NULL,
  "label"         TEXT NOT NULL,
  "is_active"     BOOLEAN NOT NULL DEFAULT TRUE,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenant_id", "key")
);

-- ─── prompt_starter ──────────────────────────────────────────────────────────
-- Pool of witnessing-framed prompts used in /celebrate picker.

CREATE TABLE "prompt_starter" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"     UUID NOT NULL REFERENCES "tenant"("id"),
  "label"         TEXT NOT NULL,
  "starter_text"  TEXT NOT NULL,
  "is_active"     BOOLEAN NOT NULL DEFAULT TRUE,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── author_quote ────────────────────────────────────────────────────────────
-- ~30 seeded quotes appended to every transactional email footer.
-- Dedup logic in lib/email/quote-footer.ts prevents repeats in a session.

CREATE TABLE "author_quote" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"        UUID NOT NULL REFERENCES "tenant"("id"),
  "author_name"      TEXT NOT NULL,
  "author_country"   TEXT NOT NULL DEFAULT '',
  "quote_text"       TEXT NOT NULL,
  "source_work"      TEXT,
  "is_active"        BOOLEAN NOT NULL DEFAULT TRUE,
  "last_reviewed_at" TIMESTAMPTZ,
  "created_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "chk_author_quote_length" CHECK (char_length("quote_text") <= 300)
);

-- ─── static_content ──────────────────────────────────────────────────────────
-- Keys: terms_of_service, privacy_policy, marketing_landing. Version is incremental.

CREATE TABLE "static_content" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"    UUID NOT NULL REFERENCES "tenant"("id"),
  "key"          TEXT NOT NULL,
  "version"      INTEGER NOT NULL DEFAULT 1,
  "body_html"    TEXT NOT NULL,
  "effective_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenant_id", "key")
);

-- ─── email_template ──────────────────────────────────────────────────────────
-- 14 template types; one row per type per tenant; admin-editable subject + body.

CREATE TABLE "email_template" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"    UUID NOT NULL REFERENCES "tenant"("id"),
  "type"         "EmailTemplateType" NOT NULL,
  "subject_line" TEXT NOT NULL,
  "body_html"    TEXT NOT NULL,
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenant_id", "type")
);
