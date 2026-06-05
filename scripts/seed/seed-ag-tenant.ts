import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { BADGE_DEFINITIONS } from "../../lib/badges/definitions";

const prisma = new PrismaClient();

// Fixed UUIDs for idempotency
const AG_TENANT_ID = process.env.AG_TENANT_ID ?? "00000000-0000-0000-0000-000000000001";
const AG_TEAM_ID = "00000000-0000-0000-0000-000000000010";
const TEAM_IDS: Record<string, string> = {
  BB: "00000000-0000-0000-0000-000000000011",
  IF: "00000000-0000-0000-0000-000000000012",
  OPS: "00000000-0000-0000-0000-000000000013",
  SA: "00000000-0000-0000-0000-000000000014",
};

const VALUE_TAGS = [
  { key: "collaboration", label: "Collaboration", group_label: "Teamwork" },
  { key: "innovation", label: "Innovation", group_label: "Growth" },
  { key: "integrity", label: "Integrity", group_label: "Values" },
  { key: "service", label: "Service", group_label: "Community" },
  { key: "learning", label: "Learning", group_label: "Growth" },
  { key: "leadership", label: "Leadership", group_label: "Teamwork" },
  { key: "inclusion", label: "Inclusion", group_label: "Values" },
  { key: "excellence", label: "Excellence", group_label: "Quality" },
  { key: "creativity", label: "Creativity", group_label: "Growth" },
  { key: "stewardship", label: "Stewardship", group_label: "Community" },
  { key: "responsiveness", label: "Responsiveness", group_label: "Quality" },
  { key: "wellbeing", label: "Wellbeing", group_label: "Community" },
];

const CONTEXT_CATEGORIES = [
  { key: "project", label: "Project work" },
  { key: "mentorship", label: "Mentorship or coaching" },
  { key: "coverage", label: "Going above and beyond" },
  { key: "onboarding", label: "Onboarding support" },
  { key: "collaboration_event", label: "Cross-team collaboration" },
  { key: "everyday_moment", label: "Everyday kindness" },
];

const PROMPT_STARTERS = [
  { label: "What did they do?", starter_text: "I want to celebrate [name] because they..." },
  { label: "How did it help?", starter_text: "The impact of what [name] did was..." },
  { label: "What quality shone through?", starter_text: "What I noticed most about [name] was..." },
  { label: "A small moment", starter_text: "It might seem small, but when [name]..." },
  { label: "Behind the scenes", starter_text: "[Name] doesn't always get credit for..." },
  { label: "Lifted the whole team", starter_text: "When [name] did this, the whole team benefited because..." },
  { label: "Taught me something", starter_text: "I learned from [name] that..." },
  { label: "Under pressure", starter_text: "Even when things were difficult, [name]..." },
  { label: "First impression", starter_text: "The first time I saw what [name] was capable of..." },
  { label: "Why it matters", starter_text: "This matters because [name]..." },
];

const FEATURED_PROMPTS = [
  "Who helped you navigate something unfamiliar this week?",
  "Who showed up for a colleague when it wasn't their job to?",
  "Who made the library feel more like a community this week?",
  "Who gave you a piece of feedback that stuck with you?",
  "Who brought calm to a chaotic moment?",
  "Who went out of their way to document or share knowledge?",
  "Who made a patron feel genuinely welcomed?",
  "Who taught you something — even in passing?",
  "Who carried more than their share this week without complaint?",
  "Who modelled a value you want to embody?",
];

const AUTHOR_QUOTES = [
  { author_name: "Maya Angelou", author_country: "US", quote_text: "People will forget what you said, people will forget what you did, but people will never forget how you made them feel." },
  { author_name: "Brené Brown", author_country: "US", quote_text: "Connection is why we're here. It is what gives purpose and meaning to our lives." },
  { author_name: "Fred Rogers", author_country: "US", quote_text: "The greatest thing we can do is to help somebody know that they're loved and capable of loving." },
  { author_name: "Desmond Tutu", author_country: "ZA", quote_text: "My humanity is bound up in yours, for we can only be human together." },
  { author_name: "Ursula K. Le Guin", author_country: "US", quote_text: "It is good to have an end to journey toward; but it is the journey that matters, in the end." },
];

function parseRosterCsv(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");
  const headers = lines[0]!.split(",");
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (values[i] ?? "").trim()])) as {
      email: string;
      first_name: string;
      last_name: string;
      role: string;
      department: string;
      job_title: string;
      sub_team: string;
    };
  });
}

export async function seedAgTenant() {
  console.log("Seeding AG tenant...");

  // 1. Tenant
  await prisma.tenant.upsert({
    where: { id: AG_TENANT_ID },
    update: {},
    create: { id: AG_TENANT_ID, name: "Arcadian Grove Library", slug: "ag" },
  });

  // 2. Icon presets (minimal set)
  const iconPresets = [
    { key: "book-default", label: "Default Book", visual_asset: "/icons/book-default.svg" },
    { key: "book-navy", label: "Navy Book", visual_asset: "/icons/book-navy.svg" },
    { key: "book-gold", label: "Gold Book", visual_asset: "/icons/book-gold.svg" },
  ];
  for (const preset of iconPresets) {
    await prisma.iconPreset.upsert({
      where: { key: preset.key },
      update: {},
      create: preset,
    });
  }

  // 3. Teams
  await prisma.team.upsert({
    where: { id: AG_TEAM_ID },
    update: {},
    create: { id: AG_TEAM_ID, tenant_id: AG_TENANT_ID, name: "Arcadian Grove", slug: "ag", kind: "organization" },
  });
  const subTeams = [
    { id: TEAM_IDS["BB"]!, slug: "bb", name: "Branch & Borrower Services" },
    { id: TEAM_IDS["IF"]!, slug: "if", name: "Information Foundations" },
    { id: TEAM_IDS["OPS"]!, slug: "ops", name: "Operations" },
    { id: TEAM_IDS["SA"]!, slug: "sa", name: "Strategic Alignment" },
  ];
  for (const t of subTeams) {
    await prisma.team.upsert({
      where: { id: t.id },
      update: {},
      create: { id: t.id, tenant_id: AG_TENANT_ID, name: t.name, slug: t.slug, kind: "sub_team" },
    });
  }

  // 4. Team settings
  await prisma.teamSettings.upsert({
    where: { tenant_id: AG_TENANT_ID },
    update: {},
    create: { tenant_id: AG_TENANT_ID },
  });

  // 5. Value tags
  for (let i = 0; i < VALUE_TAGS.length; i++) {
    const tag = VALUE_TAGS[i]!;
    await prisma.valueTag.upsert({
      where: { tenant_id_key: { tenant_id: AG_TENANT_ID, key: tag.key } },
      update: {},
      create: { tenant_id: AG_TENANT_ID, ...tag, display_order: i },
    });
  }

  // 6. Context categories
  for (let i = 0; i < CONTEXT_CATEGORIES.length; i++) {
    const cat = CONTEXT_CATEGORIES[i]!;
    await prisma.contextCategory.upsert({
      where: { tenant_id_key: { tenant_id: AG_TENANT_ID, key: cat.key } },
      update: {},
      create: { tenant_id: AG_TENANT_ID, ...cat, display_order: i },
    });
  }

  // 7. Prompt starters
  for (let i = 0; i < PROMPT_STARTERS.length; i++) {
    const ps = PROMPT_STARTERS[i]!;
    const existing = await prisma.promptStarter.findFirst({
      where: { tenant_id: AG_TENANT_ID, label: ps.label },
    });
    if (!existing) {
      await prisma.promptStarter.create({
        data: { tenant_id: AG_TENANT_ID, ...ps, display_order: i },
      });
    }
  }

  // 8. Featured prompts (default rotation)
  for (const promptText of FEATURED_PROMPTS) {
    const existing = await prisma.featuredPrompt.findFirst({
      where: { tenant_id: AG_TENANT_ID, prompt_text: promptText },
    });
    if (!existing) {
      await prisma.featuredPrompt.create({
        data: { tenant_id: AG_TENANT_ID, prompt_text: promptText, is_default_rotation: true },
      });
    }
  }

  // 9. Badge definitions
  for (const def of BADGE_DEFINITIONS) {
    await prisma.badgeDefinition.upsert({
      where: { tenant_id_key: { tenant_id: AG_TENANT_ID, key: def.key } },
      update: {},
      create: { tenant_id: AG_TENANT_ID, ...def, criteria: def.criteria as object },
    });
  }

  // 10. Author quotes
  for (const quote of AUTHOR_QUOTES) {
    const existing = await prisma.authorQuote.findFirst({
      where: { tenant_id: AG_TENANT_ID, author_name: quote.author_name },
    });
    if (!existing) {
      await prisma.authorQuote.create({ data: { tenant_id: AG_TENANT_ID, ...quote } });
    }
  }

  // 11. Email templates (one per type, placeholder copy)
  const templateTypes = [
    "recipient_notify", "manager_digest", "manager_quiet_week", "top_giver_announcement",
    "badge_milestone", "inactive_nudge", "overlooked_recipient_nudge", "work_anniversary_reminder",
    "broadcast", "prompt_of_the_week", "prompt_admin_reminder", "kudos_was_read_digest",
    "deletion_confirmation", "deletion_cancelled",
  ] as const;
  for (const type of templateTypes) {
    await prisma.emailTemplate.upsert({
      where: { tenant_id_type: { tenant_id: AG_TENANT_ID, type } },
      update: {},
      create: {
        tenant_id: AG_TENANT_ID,
        type,
        subject_line: `[Placeholder] ${type.replace(/_/g, " ")}`,
        body_html: `<p>Placeholder email body for ${type}. To be updated in Phase E.</p>`,
      },
    });
  }

  // 12. Static content
  for (const key of ["terms", "privacy", "marketing"]) {
    await prisma.staticContent.upsert({
      where: { tenant_id_key: { tenant_id: AG_TENANT_ID, key } },
      update: {},
      create: {
        tenant_id: AG_TENANT_ID,
        key,
        body_html: `<p>Placeholder ${key} content. To be updated in Phase E.</p>`,
      },
    });
  }

  // 13. Team members (from CSV)
  const rosterPath = path.join(__dirname, "data/ag-roster.csv");
  if (fs.existsSync(rosterPath)) {
    const members = parseRosterCsv(rosterPath);
    for (const m of members) {
      const subTeamId = TEAM_IDS[m.sub_team];
      await prisma.user.upsert({
        where: { email: m.email },
        update: {},
        create: {
          tenant_id: AG_TENANT_ID,
          email: m.email,
          first_name: m.first_name,
          last_name: m.last_name,
          name: `${m.first_name} ${m.last_name}`,
          role: m.role as "user" | "manager" | "admin",
          department: m.department,
          job_title: m.job_title,
          sub_team_id: subTeamId,
        },
      });
    }
    console.log(`Created ${members.length} team members.`);
  } else {
    console.warn("ag-roster.csv not found — skipping team member seeding.");
  }

  console.log("AG tenant seed complete.");
}

async function main() {
  try {
    await seedAgTenant();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
