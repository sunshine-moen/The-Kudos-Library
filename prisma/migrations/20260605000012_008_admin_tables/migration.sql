-- Migration 008: admin tables
-- admin_audit_log, cron_run_log, work_anniversary_reminder, feedback_submission

-- ─── admin_audit_log ─────────────────────────────────────────────────────────
-- Immutable log of admin actions; retained per audit_log_retention_days setting.

CREATE TABLE "admin_audit_log" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"   UUID NOT NULL REFERENCES "tenant"("id"),
  "actor_id"    UUID REFERENCES "team_member"("id"),
  "action"      TEXT NOT NULL,
  "target_type" TEXT NOT NULL,
  "target_id"   TEXT,
  "metadata"    JSONB,
  "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_admin_audit_log_tenant" ON "admin_audit_log" ("tenant_id", "occurred_at");

-- ─── cron_run_log ────────────────────────────────────────────────────────────
-- One row per cron invocation; used by health-check endpoint and ops monitoring.

CREATE TABLE "cron_run_log" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "cron_name"      TEXT NOT NULL,
  "tenant_id"      UUID REFERENCES "tenant"("id"),
  "started_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completed_at"   TIMESTAMPTZ,
  "rows_processed" INTEGER,
  "outcome"        "CronOutcome" NOT NULL,
  "error_message"  TEXT
);

CREATE INDEX "idx_cron_run_log" ON "cron_run_log" ("cron_name", "started_at");

-- ─── work_anniversary_reminder ───────────────────────────────────────────────
-- Idempotency table: one row per (employee, kind, date) prevents duplicate reminders.

CREATE TABLE "work_anniversary_reminder" (
  "id"               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"        UUID NOT NULL REFERENCES "tenant"("id"),
  "employee_id"      UUID NOT NULL REFERENCES "team_member"("id"),
  "anniversary_kind" "AnniversaryKind" NOT NULL,
  "anniversary_date" DATE NOT NULL,
  "sent_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenant_id", "employee_id", "anniversary_kind", "anniversary_date")
);

-- ─── feedback_submission ─────────────────────────────────────────────────────

CREATE TABLE "feedback_submission" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"    UUID NOT NULL REFERENCES "tenant"("id"),
  "submitted_by" UUID NOT NULL REFERENCES "team_member"("id"),
  "kind"         "FeedbackKind" NOT NULL,
  "subject"      TEXT NOT NULL,
  "body"         TEXT NOT NULL,
  "status"       "FeedbackStatus" NOT NULL DEFAULT 'open',
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "resolved_at"  TIMESTAMPTZ,
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "idx_feedback_submission_tenant" ON "feedback_submission" ("tenant_id", "status");
