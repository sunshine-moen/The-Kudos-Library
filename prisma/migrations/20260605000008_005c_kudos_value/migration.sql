-- Migration 005c: kudos_value join table
-- Composite FKs enforce tenant isolation at the schema layer.

CREATE TABLE "kudos_value" (
  "kudos_id"     UUID NOT NULL,
  "value_tag_id" UUID NOT NULL,
  "tenant_id"    UUID NOT NULL REFERENCES "tenant"("id"),
  PRIMARY KEY ("kudos_id", "value_tag_id")
);

-- Simple FKs
ALTER TABLE "kudos_value"
  ADD CONSTRAINT "kudos_value_kudos_id_fkey"
    FOREIGN KEY ("kudos_id") REFERENCES "kudos"("id") ON DELETE CASCADE;

ALTER TABLE "kudos_value"
  ADD CONSTRAINT "kudos_value_value_tag_id_fkey"
    FOREIGN KEY ("value_tag_id") REFERENCES "value_tag"("id");

-- Composite FKs: prevent cross-tenant linkage
ALTER TABLE "kudos_value"
  ADD CONSTRAINT "fk_kudos_value_kudos_tenant"
    FOREIGN KEY ("kudos_id", "tenant_id") REFERENCES "kudos" ("id", "tenant_id");

ALTER TABLE "kudos_value"
  ADD CONSTRAINT "fk_kudos_value_tag_tenant"
    FOREIGN KEY ("value_tag_id", "tenant_id") REFERENCES "value_tag" ("id", "tenant_id");
