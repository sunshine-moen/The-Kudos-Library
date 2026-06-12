import { seedAgTenant } from "./seed-ag-tenant";
import { seedTestTenant } from "./seed-test-tenant";

async function main() {
  const target = process.argv[2];
  if (target === "ag") {
    await seedAgTenant();
  } else if (target === "test") {
    await seedTestTenant();
  } else {
    // Default: seed both
    await seedAgTenant();
    if (process.env.NODE_ENV !== "production") {
      await seedTestTenant();
    }
  }
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
