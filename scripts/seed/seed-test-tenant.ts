import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fixed UUIDs — must not overlap with AG_TENANT seeding
const TEST_TENANT_ID = "00000000-0000-0000-0000-000000000002";
const TEST_TEAM_ID = "00000000-0000-0000-0000-000000000020";
const TEST_USER_ID = "00000000-0000-0000-0000-000000000030";
const TEST_ADMIN_ID = "00000000-0000-0000-0000-000000000031";
const TEST_KUDOS_IDS = [
  "00000000-0000-0000-0000-000000000040",
  "00000000-0000-0000-0000-000000000041",
  "00000000-0000-0000-0000-000000000042",
];
const TEST_BADGE_DEF_ID = "00000000-0000-0000-0000-000000000050";
const TEST_VALUE_TAG_ID = "00000000-0000-0000-0000-000000000060";

export async function seedTestTenant() {
  console.log("Seeding test tenant...");

  // Tenant
  await prisma.tenant.upsert({
    where: { id: TEST_TENANT_ID },
    update: {},
    create: { id: TEST_TENANT_ID, name: "Test Tenant CI", slug: "test-ci" },
  });

  // Team
  await prisma.team.upsert({
    where: { id: TEST_TEAM_ID },
    update: {},
    create: { id: TEST_TEAM_ID, tenant_id: TEST_TENANT_ID, name: "Test Team", slug: "test", kind: "organization" },
  });

  // Team settings
  await prisma.teamSettings.upsert({
    where: { tenant_id: TEST_TENANT_ID },
    update: {},
    create: { tenant_id: TEST_TENANT_ID },
  });

  // Icon preset (reuse global — no tenant_id)
  await prisma.iconPreset.upsert({
    where: { key: "book-default" },
    update: {},
    create: { key: "book-default", label: "Default Book", visual_asset: "/icons/book-default.svg" },
  });

  // Value tag
  await prisma.valueTag.upsert({
    where: { id: TEST_VALUE_TAG_ID },
    update: {},
    create: { id: TEST_VALUE_TAG_ID, tenant_id: TEST_TENANT_ID, key: "collaboration", label: "Collaboration" },
  });

  // Two team members
  await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: {},
    create: {
      id: TEST_USER_ID,
      tenant_id: TEST_TENANT_ID,
      email: "user@test-ci.example.com",
      first_name: "Test",
      last_name: "User",
      name: "Test User",
      role: "user",
    },
  });
  await prisma.user.upsert({
    where: { id: TEST_ADMIN_ID },
    update: {},
    create: {
      id: TEST_ADMIN_ID,
      tenant_id: TEST_TENANT_ID,
      email: "admin@test-ci.example.com",
      first_name: "Test",
      last_name: "Admin",
      name: "Test Admin",
      role: "admin",
    },
  });

  // Badge definition
  await prisma.badgeDefinition.upsert({
    where: { id: TEST_BADGE_DEF_ID },
    update: {},
    create: {
      id: TEST_BADGE_DEF_ID,
      tenant_id: TEST_TENANT_ID,
      key: "first_kudos_given",
      name: "First Kudos",
      description: "Gave their first kudos.",
      criteria: { event: "kudos_given", count: 1 },
    },
  });

  // 3 kudos (user→admin)
  const editWindow = new Date(Date.now() + 15 * 60 * 1000);
  for (let i = 0; i < TEST_KUDOS_IDS.length; i++) {
    await prisma.kudos.upsert({
      where: { id: TEST_KUDOS_IDS[i] },
      update: {},
      create: {
        id: TEST_KUDOS_IDS[i]!,
        tenant_id: TEST_TENANT_ID,
        giver_id: TEST_USER_ID,
        recipient_id: TEST_ADMIN_ID,
        message_text: `Test kudos message ${i + 1}`,
        edit_window_expires_at: editWindow,
      },
    });
  }

  // Badge award
  await prisma.badgeAward.upsert({
    where: {
      tenant_id_badge_id_awarded_to_awarded_at: {
        tenant_id: TEST_TENANT_ID,
        badge_id: TEST_BADGE_DEF_ID,
        awarded_to: TEST_USER_ID,
        awarded_at: new Date("2026-01-01T00:00:00Z"),
      },
    },
    update: {},
    create: {
      tenant_id: TEST_TENANT_ID,
      badge_id: TEST_BADGE_DEF_ID,
      awarded_to: TEST_USER_ID,
      awarded_at: new Date("2026-01-01T00:00:00Z"),
    },
  });

  console.log("Test tenant seed complete.");
}

async function main() {
  try {
    await seedTestTenant();
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
