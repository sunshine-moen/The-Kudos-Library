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
  { key: "collaboration", label: "Collaboration", group_label: "Teamwork", color_token: "var(--spine-royal)" },
  { key: "innovation", label: "Innovation", group_label: "Growth", color_token: "var(--spine-green)" },
  { key: "integrity", label: "Integrity", group_label: "Values", color_token: "var(--spine-navy)" },
  { key: "service", label: "Service", group_label: "Community", color_token: "var(--spine-brick)" },
  { key: "learning", label: "Learning", group_label: "Growth", color_token: "var(--spine-moss)" },
  { key: "leadership", label: "Leadership", group_label: "Teamwork", color_token: "var(--spine-oxblood)" },
  { key: "inclusion", label: "Inclusion", group_label: "Values", color_token: "var(--spine-gold)" },
  { key: "excellence", label: "Excellence", group_label: "Quality", color_token: "var(--spine-heritage)" },
  { key: "creativity", label: "Creativity", group_label: "Growth", color_token: "var(--spine-burnished)" },
  { key: "stewardship", label: "Stewardship", group_label: "Community", color_token: "var(--spine-leather)" },
  { key: "responsiveness", label: "Responsiveness", group_label: "Quality", color_token: "var(--spine-ink)" },
  { key: "wellbeing", label: "Wellbeing", group_label: "Community", color_token: "var(--spine-vellum)" },
];

// Context categories — placeholder list; final list pending Rebekah sign-off (REB-82).
// process_or_system is required by acceptance test C1 (docs/qa/16_acceptance_test_spec.md).
const CONTEXT_CATEGORIES = [
  { key: "process_or_system", label: "Process or system improvement" },
  { key: "project", label: "Project work" },
  { key: "mentorship", label: "Mentorship or coaching" },
  { key: "coverage", label: "Going above and beyond" },
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

// Default rotation pool — canonical 8 witnessing-framed prompts from 12_content_plan.md §4.
const FEATURED_PROMPTS = [
  "Who covered for someone without being asked?",
  "Whose quiet effort do you want to celebrate?",
  "Whose kindness made your week easier?",
  "Who shared what they knew when you needed it?",
  "Who stayed steady when things were chaotic?",
  "What did you watch a teammate handle well this week?",
  "Whose work this week should be recognized by the team?",
  "Who showed up for someone—and how?",
];

// ✓-verified quotes only — source: docs/content/05_author_quotes_starter.md
// Lower-confidence (~, ⚠) entries pending Rebekah verification (REB-82) before seeding.
const AUTHOR_QUOTES = [
  {
    author_name: "Margaret Atwood",
    author_country: "CA",
    quote_text: "A word after a word after a word is power.",
    source_work: "Spelling, in Two-Headed Poems (1978)",
  },
  {
    author_name: "Lucy Maud Montgomery",
    author_country: "CA",
    quote_text: "Kindred spirits are not so scarce as I used to think. It's splendid to find out there are so many of them in the world.",
    source_work: "Anne of Green Gables (1908)",
  },
  {
    author_name: "Lucy Maud Montgomery",
    author_country: "CA",
    quote_text: "Isn't it splendid to think of all the things there are to find out about?",
    source_work: "Anne of Green Gables (1908)",
  },
  {
    author_name: "Richard Wagamese",
    author_country: "CA",
    quote_text: "All that we are is story. From the moment we are born to the time we continue on our spirit journey, we are involved in the creation of the story of our time here.",
    source_work: "Embers: One Ojibway's Meditations (2016)",
  },
  {
    author_name: "Mary Oliver",
    author_country: "US",
    quote_text: "Tell me, what is it you plan to do with your one wild and precious life?",
    source_work: "The Summer Day, in House of Light (1990)",
  },
  {
    author_name: "Mary Oliver",
    author_country: "US",
    quote_text: "Instructions for living a life: Pay attention. Be astonished. Tell about it.",
    source_work: "Sometimes, in Red Bird (2008)",
  },
  {
    author_name: "Maya Angelou",
    author_country: "US",
    quote_text: "People will forget what you said, people will forget what you did, but people will never forget how you made them feel.",
    source_work: null,
  },
  {
    author_name: "Toni Morrison",
    author_country: "US",
    quote_text: "We die. That may be the meaning of life. But we do language. That may be the measure of our lives.",
    source_work: "Nobel Lecture (1993)",
  },
  {
    author_name: "Octavia Butler",
    author_country: "US",
    quote_text: "All that you touch you change. All that you change changes you.",
    source_work: "Parable of the Sower (1993)",
  },
  {
    author_name: "Kurt Vonnegut",
    author_country: "US",
    quote_text: "I urge you to please notice when you are happy, and exclaim or murmur or think at some point, 'If this isn't nice, I don't know what is.'",
    source_work: "A Man Without a Country (2005)",
  },
  {
    author_name: "Annie Dillard",
    author_country: "US",
    quote_text: "How we spend our days is, of course, how we spend our lives.",
    source_work: "The Writing Life (1989)",
  },
  {
    author_name: "Ursula K. Le Guin",
    author_country: "US",
    quote_text: "It is good to have an end to journey toward; but it is the journey that matters, in the end.",
    source_work: "The Left Hand of Darkness (1969)",
  },
  {
    author_name: "Wendell Berry",
    author_country: "US",
    quote_text: "It may be that when we no longer know what to do, we have come to our real work, and that when we no longer know which way to go, we have begun our real journey.",
    source_work: "Standing by Words (1983)",
  },
  {
    author_name: "James Baldwin",
    author_country: "US",
    quote_text: "Not everything that is faced can be changed, but nothing can be changed until it is faced.",
    source_work: "As Much Truth As One Can Bear (1962)",
  },
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
      update: { color_token: tag.color_token },
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

  // 9. Badge definitions — upsert with update so re-seeding corrects name/description/criteria
  for (const def of BADGE_DEFINITIONS) {
    await prisma.badgeDefinition.upsert({
      where: { tenant_id_key: { tenant_id: AG_TENANT_ID, key: def.key } },
      update: { name: def.name, description: def.description, criteria: def.criteria as object, visual_asset: def.visual_asset },
      create: { tenant_id: AG_TENANT_ID, ...def, criteria: def.criteria as object },
    });
  }

  // 10. Author quotes — keyed by author_name + quote_text to support multiple quotes per author
  for (const quote of AUTHOR_QUOTES) {
    const existing = await prisma.authorQuote.findFirst({
      where: { tenant_id: AG_TENANT_ID, author_name: quote.author_name, quote_text: quote.quote_text },
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

  // 12. Static content — T&C + Privacy Policy placeholder from 12_content_plan.md §7.5.
  // UBC comms partner replaces with legal-reviewed copy before public-tenant rollout (v1.5).
  // Contact email to fill before production deploy; date is seed date.
  const CONTACT_EMAIL = process.env.AG_CONTACT_EMAIL ?? "kudos@ag.ubc.ca";
  const SEED_DATE = "June 12, 2026";

  const TERMS_HTML = `<h1>Terms of Service — The Kudos Library</h1>
<p><em>Last updated: ${SEED_DATE}</em></p>
<h2>What this is</h2>
<p>The Kudos Library is a private peer-recognition tool for the UBC Annual Giving (AG) team. You leave each other written kudos that appear as books on personal bookshelves, and the library keeps that history over time.</p>
<h2>Who can use it</h2>
<p>You can use the Kudos Library if your AG admin has added you to the team roster. Accounts are managed by admins, not by self-signup.</p>
<h2>What you agree to</h2>
<p>When you use the Kudos Library, you agree to:</p>
<ul>
<li>Use it to recognize colleagues for things you've noticed.</li>
<li>Not post content that harasses, harms or is inappropriate for a workplace.</li>
<li>Accept that admins can soft-delete any kudos they consider problematic.</li>
</ul>
<p>You also agree to keep your account secure. Your admin will help if you need to recover access.</p>
<h2>What we agree to</h2>
<p>We do our best to:</p>
<ul>
<li>Keep the library running reliably (best effort; this is a v1 prototype).</li>
<li>Hold on to your data for the windows described in the Privacy Policy and no longer.</li>
<li>Tell you when these terms change in any meaningful way.</li>
</ul>
<h2>Required disclosures</h2>
<p><strong>Author names.</strong> Badge names reference Canadian authors as cultural homage. No affiliation, endorsement or commercial use is implied. v1 is a non-commercial UBC internal tool.</p>
<p><strong>FIPPA posture.</strong> v1 is a single-unit prototype. Data is hosted on US cloud providers (Vercel, Neon, Resend). No formal UBC Privacy Impact Assessment has been filed for v1. The PIA conversation begins as part of v1.5 prep. See the Privacy Policy "Your privacy" section for how to request kudos removal or account deletion.</p>
<p><strong>Public to your team.</strong> Every kudos in the library is visible to every other team member in your tenant. Managers also receive weekly digests of kudos given to their direct reports.</p>
<p><strong>Vendors.</strong> We use Vercel (hosting), Neon (database), Resend (email), Giphy (GIF picker, browser-only), Plausible (analytics, no PII) and Sentry (error monitoring, PII stripped). See the Privacy Policy for what each vendor touches.</p>
<h2>Your data rights</h2>
<p>You can:</p>
<ul>
<li>Export all your data from your profile page.</li>
<li>Ask an admin to remove any kudos you gave or received.</li>
<li>Delete your account from your profile page. Your account stays in a 30-day grace period after the request—you can restore it any time in that window. After 30 days, everything is removed and cannot be undone.</li>
</ul>
<h2>Changes to these terms</h2>
<p>If we change these terms in a meaningful way, you'll see a notice when you next sign in. Small changes (typos, clarifications) won't trigger a notice.</p>
<h2>Contact</h2>
<p>Questions? Email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>`;

  const PRIVACY_HTML = `<h1>Privacy Policy — The Kudos Library</h1>
<p><em>Last updated: ${SEED_DATE}</em></p>
<h2>What we collect</h2>
<p>About you: your name, work email, department and job title; your UBC hire date and Annual Giving join date (used for work-anniversary reminders).</p>
<p>About what you do in the library: the kudos you write—message text, any context you add, the values you tag, optional GIF; the kudos you read—which ones, and when; your email-setting preferences.</p>
<p>About how the app is used overall: page views and event counts via Plausible. Plausible does not collect PII or use cookies.</p>
<h2>How we use it</h2>
<ul>
<li>Display kudos in the library so your team can see them.</li>
<li>Send emails per your opt-in choices (digests, prompts, anniversary reminders, etc.).</li>
<li>Generate weekly manager digests of direct reports' kudos.</li>
<li>Internal analytics to understand how the library is being used.</li>
</ul>
<h2>Who can see what</h2>
<p><strong>Every team member</strong> in your tenant can see every kudos in the library. <strong>Managers</strong> receive weekly digests of kudos given to their direct reports. <strong>Admins</strong> can see the full roster, the audit log of admin actions, and can soft-delete any kudos.</p>
<h2>How long we keep it</h2>
<ul>
<li>Email-send logs: 90 days (admin-configurable per tenant).</li>
<li>Magic-link login tokens: expire 10 minutes after issue.</li>
<li>Magic deep-link tokens (from emails): expire 14 days after issue.</li>
<li>Device confirmations: expire 90 days after last use.</li>
<li>Soft-deleted kudos: kept indefinitely in v1 for audit and recompute logic.</li>
<li>Backups (Neon point-in-time recovery): rolling 7-day window.</li>
</ul>
<h2>Your privacy</h2>
<p>You can: <strong>export your data</strong> from your profile page; <strong>request kudos removal</strong> for any kudos you gave or received (ask an admin); <strong>delete your account</strong> from your profile page (30-day grace period, then permanent removal); <strong>update your email settings</strong> any time on your profile page.</p>
<h2>Third-party vendors</h2>
<table>
<tr><th>Vendor</th><th>What they touch</th></tr>
<tr><td>Vercel</td><td>Hosting; sees all HTTP traffic between you and the app.</td></tr>
<tr><td>Neon</td><td>Postgres database; stores everything in "What we collect" above.</td></tr>
<tr><td>Resend</td><td>Email delivery; sees recipient emails, subjects and bodies.</td></tr>
<tr><td>Giphy</td><td>GIF picker; runs in your browser only. Your search queries go to Giphy.</td></tr>
<tr><td>Plausible</td><td>Analytics; no PII, no cookies, no IP storage.</td></tr>
<tr><td>Sentry</td><td>Error monitoring; PII is stripped before any event leaves the app.</td></tr>
</table>
<h2>FIPPA posture</h2>
<p>v1 is a single-unit prototype for the UBC Annual Giving team. Data lives with US cloud providers (Vercel, Neon, Resend) under those vendors' standard data-processing terms. No formal UBC Privacy Impact Assessment has been filed for v1. The PIA conversation begins as part of v1.5 prep. For FIPPA-related concerns, contact the UBC privacy office.</p>
<h2>Cookies</h2>
<p>We use one cookie: a session cookie that keeps you signed in. It's HttpOnly, Secure and SameSite=Lax. We don't use analytics cookies (Plausible is cookieless).</p>
<h2>Updates to this policy</h2>
<p>If we change this policy in a meaningful way, you'll see a notice when you next sign in. Small changes won't trigger a notice.</p>
<h2>Contact</h2>
<p>Questions about your data or this policy? Email <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>. For FIPPA-related questions, contact the UBC privacy office.</p>`;

  const staticEntries: Array<{ key: string; body_html: string }> = [
    { key: "terms", body_html: TERMS_HTML },
    { key: "privacy", body_html: PRIVACY_HTML },
    { key: "marketing", body_html: "<p>Marketing content managed via admin UI.</p>" },
  ];

  for (const entry of staticEntries) {
    await prisma.staticContent.upsert({
      where: { tenant_id_key: { tenant_id: AG_TENANT_ID, key: entry.key } },
      update: { body_html: entry.body_html },
      create: { tenant_id: AG_TENANT_ID, key: entry.key, body_html: entry.body_html },
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
