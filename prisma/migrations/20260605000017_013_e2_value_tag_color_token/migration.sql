-- Migration 013: add color_token to value_tag for design-system color mapping

ALTER TABLE "value_tag" ADD COLUMN "color_token" TEXT;
