// Canonical badge definitions — source of truth: docs/content/12_content_plan.md §5
// Keys, names, criteria, and description copy are locked; do not edit without a product decision.
// re_earnable is stored in criteria for future evaluator support (v1: streak badges not re-awarded).

export interface BadgeDefinitionSeed {
  key: string;
  name: string;
  description: string;
  criteria: Record<string, unknown>;
  visual_asset: string;
}

export const BADGE_DEFINITIONS: BadgeDefinitionSeed[] = [
  {
    key: "first_chapter",
    name: "First Chapter",
    description:
      "Every shelf starts with one. You added your first kudos to the library—the first chapter on your shelf.\n\nWhat you noticed mattered enough to write down. That's all the library asks.\n\nThe library keeps it.",
    criteria: { event: "kudos_given_total", count: 1, re_earnable: false },
    visual_asset: "badge-first-chapter",
  },
  {
    key: "robinson_roll",
    name: "Robinson Roll",
    description:
      "Ten kudos. The Robinson Roll joins your shelf.\n\nEden Robinson writes about paying attention to a place. You've been paying attention to a team—ten times now.\n\nThe library is starting to know you.",
    criteria: { event: "kudos_given_total", count: 10, re_earnable: false },
    visual_asset: "badge-robinson-roll",
  },
  {
    key: "montgomery_medal",
    name: "Montgomery Medal",
    description:
      "Twenty-five kudos. The Montgomery Medal joins your shelf.\n\nL.M. Montgomery wrote about kindred spirits—people who notice each other across a room. You've noticed yours twenty-five times.\n\nThe library keeps every one of them.",
    criteria: { event: "kudos_given_total", count: 25, re_earnable: false },
    visual_asset: "badge-montgomery-medal",
  },
  {
    key: "atwood_accolade",
    name: "Atwood Accolade",
    description:
      "Fifty kudos. The Atwood Accolade joins your shelf.\n\nMargaret Atwood writes about persistence—about showing up to the same kind of work, again and again. You've been doing that here. Fifty times now.\n\nThe library has noticed.",
    criteria: { event: "kudos_given_total", count: 50, re_earnable: false },
    visual_asset: "badge-atwood-accolade",
  },
  {
    key: "ondaatje_order",
    name: "Ondaatje Order",
    description:
      "One hundred kudos. The Ondaatje Order joins your shelf.\n\nMichael Ondaatje writes whole books out of fragments—small moments held together until they mean something. That's what you've been doing here. One hundred fragments, all on the shelf.\n\nThe library is grateful.",
    criteria: { event: "kudos_given_total", count: 100, re_earnable: false },
    visual_asset: "badge-ondaatje-order",
  },
  {
    key: "shields_standard",
    name: "Shields Standard",
    description:
      "Four weeks running. The Shields Standard joins your shelf.\n\nCarol Shields built a body of work on the dignity of ordinary lives—the kind of attention you've been paying to your team, week after week.\n\nThe library is steady when you are.",
    criteria: { event: "kudos_given_weekly_streak", weeks: 4, re_earnable: true },
    visual_asset: "badge-shields-standard",
  },
  {
    key: "wagamese_way",
    name: "Wagamese Way",
    description:
      "Eight weeks running. The Wagamese Way joins your shelf.\n\nRichard Wagamese wrote that we are all our relations. You've been holding to that—week after week, noticing the people around you.\n\nThe library is grateful for the rhythm.",
    criteria: { event: "kudos_given_weekly_streak", weeks: 8, re_earnable: true },
    visual_asset: "badge-wagamese-way",
  },
  {
    key: "campbell_continuum",
    name: "Campbell Continuum",
    description:
      "Twelve weeks running. The Campbell Continuum joins your shelf.\n\nMaria Campbell's work is about what gets passed forward—stories that hold a community together across time. You've been doing your small version of that, twelve weeks straight.\n\nThe library is full of what you've kept.",
    criteria: { event: "kudos_given_weekly_streak", weeks: 12, re_earnable: true },
    visual_asset: "badge-campbell-continuum",
  },
  {
    key: "hill_honour",
    name: "Hill Honour",
    description:
      "Sixteen weeks running. The Hill Honour joins your shelf.\n\nLawrence Hill writes about witnessing as an act of generosity—the kind of work that asks something of the witness. You've been doing it for sixteen weeks.\n\nThe library knows you well now.",
    criteria: { event: "kudos_given_weekly_streak", weeks: 16, re_earnable: true },
    visual_asset: "badge-hill-honour",
  },
];
