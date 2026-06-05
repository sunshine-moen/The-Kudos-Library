-- Migration 002a: team
-- Must run before 002b (team_member) because team_member.sub_team_id FK → team.

CREATE TABLE "team" (
  "id"           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"    UUID NOT NULL REFERENCES "tenant"("id"),
  "name"         TEXT NOT NULL,
  "slug"         TEXT NOT NULL,
  "description"  TEXT NOT NULL DEFAULT '',
  "kind"         "TeamKind" NOT NULL,
  "visual_asset" TEXT NOT NULL DEFAULT '',
  "created_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("tenant_id", "slug")
);

-- Composite unique required so other tables can reference (team.id, team.tenant_id)
-- via composite foreign keys (schema-layer tenant-isolation enforcement per ADD §3).
ALTER TABLE "team" ADD CONSTRAINT "team_id_tenant_id_key" UNIQUE ("id", "tenant_id");
