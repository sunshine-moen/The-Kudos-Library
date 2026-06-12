-- Migration 010: Phase D1 — additional team_settings columns for admin configuration form
ALTER TABLE "team_settings"
  ADD COLUMN "edit_window_minutes"            INT     NOT NULL DEFAULT 15,
  ADD COLUMN "max_kudos_per_day_per_giver"    INT     NOT NULL DEFAULT 30,
  ADD COLUMN "kudos_char_limit"               INT     NOT NULL DEFAULT 2000,
  ADD COLUMN "context_char_limit"             INT     NOT NULL DEFAULT 200,
  ADD COLUMN "context_required"               BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "anniversary_reminder_advance_days" INT  NOT NULL DEFAULT 7;
