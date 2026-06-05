export interface BadgeDefinitionSeed {
  key: string;
  name: string;
  description: string;
  criteria: Record<string, unknown>;
  visual_asset: string;
}

export const BADGE_DEFINITIONS: BadgeDefinitionSeed[] = [
  {
    key: "first_kudos_given",
    name: "First Kudos",
    description: "Gave their first kudos to a colleague.",
    criteria: { event: "kudos_given", count: 1 },
    visual_asset: "badge-first-kudos",
  },
  {
    key: "kudos_streak_5",
    name: "Five-Week Streak",
    description: "Gave kudos in five consecutive weeks.",
    criteria: { event: "kudos_given_weekly_streak", weeks: 5 },
    visual_asset: "badge-streak-5",
  },
  {
    key: "kudos_streak_10",
    name: "Ten-Week Streak",
    description: "Gave kudos in ten consecutive weeks.",
    criteria: { event: "kudos_given_weekly_streak", weeks: 10 },
    visual_asset: "badge-streak-10",
  },
  {
    key: "top_giver_week",
    name: "Top Giver of the Week",
    description: "Ranked #1 on the weekly leaderboard.",
    criteria: { event: "leaderboard_top_giver_week", rank: 1 },
    visual_asset: "badge-top-giver-week",
  },
  {
    key: "top_giver_month",
    name: "Top Giver of the Month",
    description: "Ranked #1 on the monthly leaderboard.",
    criteria: { event: "leaderboard_top_giver_month", rank: 1 },
    visual_asset: "badge-top-giver-month",
  },
  {
    key: "kudos_milestone_10",
    name: "Ten Kudos Given",
    description: "Has given a total of 10 kudos.",
    criteria: { event: "kudos_given_total", count: 10 },
    visual_asset: "badge-milestone-10",
  },
  {
    key: "kudos_milestone_25",
    name: "25 Kudos Given",
    description: "Has given a total of 25 kudos.",
    criteria: { event: "kudos_given_total", count: 25 },
    visual_asset: "badge-milestone-25",
  },
  {
    key: "kudos_milestone_50",
    name: "50 Kudos Given",
    description: "Has given a total of 50 kudos.",
    criteria: { event: "kudos_given_total", count: 50 },
    visual_asset: "badge-milestone-50",
  },
  {
    key: "all_values_used",
    name: "Full Spectrum",
    description: "Has given kudos referencing every active value tag at least once.",
    criteria: { event: "all_value_tags_used" },
    visual_asset: "badge-full-spectrum",
  },
];
