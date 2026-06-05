-- Migration 005a: featured_prompt
-- week_start_date is NULLABLE — default-rotation prompts have NULL; scheduled prompts have the Monday date.
-- The partial UNIQUE index enforces one scheduled prompt per tenant per week,
-- while allowing unlimited default-rotation prompts (NULL week_start_date).

CREATE TABLE "featured_prompt" (
  "id"                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id"           UUID NOT NULL REFERENCES "tenant"("id"),
  -- NULL for default-rotation prompts; Monday of target week (tenant timezone) for scheduled
  "week_start_date"     DATE,
  "prompt_text"         TEXT NOT NULL,
  "pre_tag_value_id"    UUID REFERENCES "value_tag"("id"),
  "scheduled_by"        UUID REFERENCES "team_member"("id"),
  "is_default_rotation" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite FKs for tenant isolation (scheduled_by and pre_tag_value must belong to same tenant)
ALTER TABLE "featured_prompt"
  ADD CONSTRAINT "fk_featured_prompt_scheduled_by_tenant"
    FOREIGN KEY ("scheduled_by", "tenant_id")
    REFERENCES "team_member" ("id", "tenant_id");

ALTER TABLE "featured_prompt"
  ADD CONSTRAINT "fk_featured_prompt_pre_tag_tenant"
    FOREIGN KEY ("pre_tag_value_id", "tenant_id")
    REFERENCES "value_tag" ("id", "tenant_id")
    DEFERRABLE INITIALLY DEFERRED;
-- Note: pre_tag_value_id is nullable so the deferred constraint fires only when set.

-- Partial UNIQUE: one scheduled prompt per tenant per week; default-rotation rows unconstrained
CREATE UNIQUE INDEX "idx_featured_prompt_scheduled"
  ON "featured_prompt" ("tenant_id", "week_start_date")
  WHERE "week_start_date" IS NOT NULL;
