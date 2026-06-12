-- Migration 007: email infrastructure
-- email_outbox, email_send_log

-- ─── email_outbox ────────────────────────────────────────────────────────────
-- Outbox pattern: rows written at kudos submit; delivered by outbox-poller after edit window.
-- idempotency_key prevents double-delivery on cron retries.

CREATE TABLE "email_outbox" (
  "id"                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"                UUID NOT NULL REFERENCES "tenant"("id"),
  "template_type"            "EmailTemplateType" NOT NULL,
  "kudos_id"                 UUID REFERENCES "kudos"("id") ON DELETE CASCADE,
  "recipient_user_id"        UUID REFERENCES "team_member"("id"),
  "recipient_email_override" TEXT,
  "badge_award_id"           UUID REFERENCES "badge_award"("id"),
  "payload"                  JSONB,
  "send_after"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "idempotency_key"          TEXT NOT NULL UNIQUE,
  "delivered_at"             TIMESTAMPTZ,
  "failed_at"                TIMESTAMPTZ,
  "failure_reason"           TEXT,
  "attempts"                 INTEGER NOT NULL DEFAULT 0,
  "cancelled_at"             TIMESTAMPTZ,
  "cancellation_reason"      TEXT,
  "created_at"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_outbox_send_after" ON "email_outbox" ("send_after");

-- Partial index used by outbox-poller: undelivered, uncancelled, past send_after
CREATE INDEX "idx_outbox_pending" ON "email_outbox" ("send_after")
  WHERE "delivered_at" IS NULL AND "cancelled_at" IS NULL AND "failed_at" IS NULL;

-- ─── email_send_log ──────────────────────────────────────────────────────────
-- Immutable delivery audit; rows expire per email_log_retention_days setting.

CREATE TABLE "email_send_log" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"       UUID NOT NULL REFERENCES "tenant"("id"),
  "template_type"   "EmailTemplateType" NOT NULL,
  "recipient_email" TEXT NOT NULL REFERENCES "team_member"("email"),
  "quote_id"        UUID REFERENCES "author_quote"("id"),
  "sent_at"         TIMESTAMPTZ,
  "failed_at"       TIMESTAMPTZ,
  "failure_reason"  TEXT,
  "attempts"        INTEGER NOT NULL DEFAULT 0,
  "created_at"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_email_send_log_tenant" ON "email_send_log" ("tenant_id", "created_at");
