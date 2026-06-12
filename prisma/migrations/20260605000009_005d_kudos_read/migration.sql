-- Migration 005d: kudos_read
-- Tracks which team members have opened each kudos (drives read-receipt UX + digest logic).

CREATE TABLE "kudos_read" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL REFERENCES "tenant"("id"),
  "kudos_id"  UUID NOT NULL REFERENCES "kudos"("id"),
  "reader_id" UUID NOT NULL REFERENCES "team_member"("id"),
  "read_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("kudos_id", "reader_id")
);

CREATE INDEX "idx_kudos_read_reader" ON "kudos_read" ("reader_id", "tenant_id");
