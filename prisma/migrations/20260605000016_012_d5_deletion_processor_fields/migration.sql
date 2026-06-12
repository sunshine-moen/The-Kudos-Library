-- Migration 012: account deletion processor fields
-- Makes kudos.giver_id nullable for anonymization on account deletion.
-- Adds audit_log_retention_days to team_settings.

ALTER TABLE "kudos" ALTER COLUMN "giver_id" DROP NOT NULL;

ALTER TABLE "team_settings"
  ADD COLUMN "audit_log_retention_days" INT NOT NULL DEFAULT 365;
