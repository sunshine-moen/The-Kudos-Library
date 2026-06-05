/**
 * Accessibility gate for Phase B screens.
 * Every test runs an axe WCAG 2.1 AA scan; any violation fails the build.
 *
 * Auth setup: AG admin session for AG-tenant pages; test-user session for
 * test-tenant shelf/book pages (fixed-UUID seed data).
 */
import path from "path";
import fs from "fs";
import { test, scanA11y } from "../fixtures/a11y";
import {
  AG_ADMIN_AUTH_FILE,
  TEST_USER_AUTH_FILE,
} from "../global-setup";

// ─── AG admin tests ──────────────────────────────────────────────────────────

test.describe("Phase B screens — AG admin", () => {
  test.use({ storageState: AG_ADMIN_AUTH_FILE });

  test("/library has no a11y violations", async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    await scanA11y(page);
  });

  test("NavHeader and Footer have no a11y violations", async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");
    // Scan header and footer landmarks specifically
    await scanA11y(page, "header");
    await scanA11y(page, "footer");
  });

  test("/team/bb has no a11y violations", async ({ page }) => {
    await page.goto("/team/bb");
    await page.waitForLoadState("networkidle");
    await scanA11y(page);
  });

  test("/team/if has no a11y violations", async ({ page }) => {
    await page.goto("/team/if");
    await page.waitForLoadState("networkidle");
    await scanA11y(page);
  });

  test("/admin/roster has no a11y violations", async ({ page }) => {
    await page.goto("/admin/roster");
    await page.waitForLoadState("networkidle");
    await scanA11y(page);
  });

  test("/celebrate has no a11y violations", async ({ page }) => {
    await page.goto("/celebrate");
    await page.waitForLoadState("networkidle");
    await scanA11y(page);
  });
});

// ─── Test-tenant user tests ───────────────────────────────────────────────────

test.describe("Phase B screens — test-tenant user", () => {
  test.use({ storageState: TEST_USER_AUTH_FILE });

  // Fixed UUID from seed-test-tenant.ts
  const TEST_USER_ID = "00000000-0000-0000-0000-000000000030";

  test("/shelf/[member] has no a11y violations", async ({ page }) => {
    await page.goto(`/shelf/${TEST_USER_ID}`);
    await page.waitForLoadState("networkidle");
    await scanA11y(page);
  });

  test("/team/test has no a11y violations", async ({ page }) => {
    await page.goto("/team/test");
    await page.waitForLoadState("networkidle");
    await scanA11y(page);
  });

  test("/book/[id] has no a11y violations", async ({ page }) => {
    // Test data written by global-setup (first kudos from test tenant)
    const dataFile = path.join(__dirname, "..", ".auth", "test-data.json");
    if (!fs.existsSync(dataFile)) {
      test.skip(true, "test-data.json not found — seed the test tenant first");
      return;
    }
    const { firstKudosId } = JSON.parse(fs.readFileSync(dataFile, "utf-8")) as {
      firstKudosId: string | null;
    };
    if (!firstKudosId) {
      test.skip(true, "No kudos found in test tenant — seed the test tenant first");
      return;
    }
    await page.goto(`/book/${firstKudosId}`);
    await page.waitForLoadState("networkidle");
    await scanA11y(page);
  });
});

// ─── Public pages (no auth required) ─────────────────────────────────────────

test.describe("Public pages", () => {
  test("/login has no a11y violations", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await scanA11y(page);
  });
});
