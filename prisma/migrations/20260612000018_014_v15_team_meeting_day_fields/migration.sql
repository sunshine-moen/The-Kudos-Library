-- Migration 014: add team_meeting_day and team_meeting_end_local_time to team_settings
-- v1.5 prep: per-tenant meeting-window exclusion for unprompted-giver rate metric
-- Both columns are nullable — no default, not used by any v1 code.

CREATE TYPE "TeamMeetingDay" AS ENUM ('Mon', 'Tue', 'Wed', 'Thu', 'Fri');

ALTER TABLE "team_settings"
  ADD COLUMN "team_meeting_day"           "TeamMeetingDay" NULL,
  ADD COLUMN "team_meeting_end_local_time" TEXT             NULL;
