/**
 * bootstrap-admin.ts
 * Creates the minimum viable setup for testing:
 *   - AG tenant + team settings
 *   - Value tags
 *   - Email template stubs
 *   - Admin user (set ADMIN_EMAIL env var or defaults to rebekahsunshine@gmail.com)
 *
 * Safe to run multiple times (fully idempotent via upsert).
 * Run: DATABASE_URL="..." npx ts-node --project tsconfig.json scripts/seed/bootstrap-admin.ts
 */

import { PrismaClient, EmailTemplateType } from "@prisma/client";

const prisma = new PrismaClient();

const TENANT_ID = process.env.AG_TENANT_ID ?? "00000000-0000-0000-0000-000000000001";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "rebekahsunshine@gmail.com";
const ADMIN_FIRST = process.env.ADMIN_FIRST ?? "Rebekah";
const ADMIN_LAST = process.env.ADMIN_LAST ?? "Sunshine";

const VALUE_TAGS = [
  { key: "collaboration", label: "Collaboration", group_label: "Teamwork", color_token: "var(--spine-royal)" },
  { key: "innovation", label: "Innovation", group_label: "Growth", color_token: "var(--spine-green)" },
  { key: "integrity", label: "Integrity", group_label: "Values", color_token: "var(--spine-navy)" },
  { key: "service", label: "Service", group_label: "Community", color_token: "var(--spine-brick)" },
  { key: "learning", label: "Learning", group_label: "Growth", color_token: "var(--spine-moss)" },
  { key: "leadership", label: "Leadership", group_label: "Teamwork", color_token: "var(--spine-oxblood)" },
  { key: "inclusion", label: "Inclusion", group_label: "Values", color_token: "var(--spine-gold)" },
  { key: "excellence", label: "Excellence", group_label: "Quality", color_token: "var(--spine-heritage)" },
];

const EMAIL_TEMPLATE_TYPES: EmailTemplateType[] = [
  "recipient_notify",
  "manager_digest",
  "manager_quiet_week",
  "top_giver_announcement",
  "badge_milestone",
  "inactive_nudge",
  "overlooked_recipient_nudge",
  "work_anniversary_reminder",
  "broadcast",
  "prompt_of_the_week",
  "prompt_admin_reminder",
  "kudos_was_read_digest",
  "deletion_confirmation",
  "deletion_cancelled",
];

async function main() {
  console.log("→ Bootstrapping tenant:", TENANT_ID);
  console.log("→ Admin email:", ADMIN_EMAIL);

  // 1. Tenant
  await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: {},
    create: { id: TENANT_ID, name: "Annual Giving", slug: "ag" },
  });
  console.log("✓ Tenant");

  // 2. Team settings
  await prisma.teamSettings.upsert({
    where: { tenant_id: TENANT_ID },
    update: {},
    create: {
      tenant_id: TENANT_ID,
      edit_window_minutes: 15,
      max_kudos_per_day_per_giver: 5,
      kudos_char_limit: 1000,
      context_char_limit: 300,
      context_required: false,
      leaderboard_top_n_week: 5,
      leaderboard_top_n_month: 10,
      inactive_threshold_weeks: 4,
      overlooked_recipient_window_days: 30,
      anniversary_reminder_advance_days: 7,
      prompt_queue_low_threshold: 3,
      timezone: "America/Vancouver",
      max_admins: 5,
    },
  });
  console.log("✓ Team settings");

  // 3. Value tags
  for (const vt of VALUE_TAGS) {
    await prisma.valueTag.upsert({
      where: { tenant_id_key: { tenant_id: TENANT_ID, key: vt.key } },
      update: {},
      create: { tenant_id: TENANT_ID, ...vt, is_active: true },
    });
  }
  console.log(`✓ ${VALUE_TAGS.length} value tags`);

  // 4. Email template stubs (needed so outbox foreign keys resolve)
  for (const type of EMAIL_TEMPLATE_TYPES) {
    await prisma.emailTemplate.upsert({
      where: { tenant_id_type: { tenant_id: TENANT_ID, type } },
      update: {},
      create: {
        tenant_id: TENANT_ID,
        type,
        subject_line: `[Kudos Library] ${type.replace(/_/g, " ")}`,
        body_html: `<p>Placeholder — ${type}.</p>`,
      },
    });
  }
  console.log(`✓ ${EMAIL_TEMPLATE_TYPES.length} email template stubs`);

  // 5. Icon preset (required by team_member.icon FK)
  await prisma.iconPreset.upsert({
    where: { key: "book-default" },
    update: {},
    create: { key: "book-default", visual_asset: "📚", label: "Book" },
  });
  console.log("✓ Icon preset");

  // 6. Admin user
  const existing = await prisma.user.findFirst({
    where: { email: ADMIN_EMAIL, tenant_id: TENANT_ID },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "admin", status: "active" },
    });
    console.log("✓ Admin user updated (already existed):", ADMIN_EMAIL);
  } else {
    await prisma.user.create({
      data: {
        tenant_id: TENANT_ID,
        email: ADMIN_EMAIL,
        first_name: ADMIN_FIRST,
        last_name: ADMIN_LAST,
        name: `${ADMIN_FIRST} ${ADMIN_LAST}`,
        role: "admin",
        status: "active",
      },
    });
    console.log("✓ Admin user created:", ADMIN_EMAIL);
  }

  console.log("\n✅ Done. Add this to Vercel env vars:");
  console.log("   AG_TENANT_ID =", TENANT_ID);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
