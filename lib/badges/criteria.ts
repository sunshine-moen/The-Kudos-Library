/**
 * Pure functions for evaluating badge criteria against a giver's stats.
 * No DB access — all data is preloaded by the evaluator.
 */

export interface GiverStats {
  totalGiven: number;
  currentStreakWeeks: number;
  allValueTagsUsed: boolean;
}

/**
 * Returns whether the given criteria JSON is satisfied by the giver's current stats.
 * Returns false for leaderboard-based criteria (those are awarded by the rollover cron).
 */
export function checkCriteria(criteria: Record<string, unknown>, stats: GiverStats): boolean {
  const event = criteria["event"] as string | undefined;
  switch (event) {
    case "kudos_given":
      // first_event — fires as soon as total ≥ count (usually 1)
      return stats.totalGiven >= ((criteria["count"] as number | undefined) ?? 1);

    case "kudos_given_total":
      return stats.totalGiven >= ((criteria["count"] as number | undefined) ?? 1);

    case "kudos_given_weekly_streak":
      return stats.currentStreakWeeks >= ((criteria["weeks"] as number | undefined) ?? 1);

    case "all_value_tags_used":
      return stats.allValueTagsUsed;

    // Leaderboard-based badges are awarded by leaderboard-rollover cron, not here
    case "leaderboard_top_giver_week":
    case "leaderboard_top_giver_month":
      return false;

    default:
      return false;
  }
}

/**
 * Computes the current consecutive-week streak ending at the most recent week.
 * A "week" is the ISO Monday–Sunday calendar week.
 * Returns 0 if no kudos given.
 */
export function computeStreakWeeks(submittedAts: Date[]): number {
  if (submittedAts.length === 0) return 0;

  // Get the Monday (start) of each ISO week as a UTC timestamp
  const weekMondays = new Set<number>();
  for (const d of submittedAts) {
    weekMondays.add(isoWeekMonday(d).getTime());
  }

  // Sort descending
  const sorted = Array.from(weekMondays).sort((a, b) => b - a);

  let streak = 1;
  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];
    if (curr === undefined || next === undefined) break;
    // Check if consecutive (7 days apart)
    if (curr - next === 7 * 24 * 60 * 60 * 1000) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/** Returns the Monday of the ISO week containing the given date (UTC). */
function isoWeekMonday(d: Date): Date {
  const day = d.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setUTCDate(monday.getUTCDate() - daysFromMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}
