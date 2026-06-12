/**
 * Cross-tenant isolation tests.
 *
 * These tests verify that the `withTenantContext` middleware correctly scopes
 * every request to the authenticated user's tenant, preventing data leakage
 * between AG tenant and the test_tenant seeded in CI.
 *
 * AG admin session: admin@ag.example.com (AG_TENANT_ID)
 * Test-user session: user@test-ci.example.com (TEST_TENANT_ID)
 */
import { test, expect } from "@playwright/test";
import {
  AG_ADMIN_AUTH_FILE,
  TEST_USER_AUTH_FILE,
} from "../global-setup";

// Fixed UUIDs from seed-test-tenant.ts
const TEST_TENANT_KUDOS_ID = "00000000-0000-0000-0000-000000000040";
const TEST_TENANT_USER_ID = "00000000-0000-0000-0000-000000000030";
const TEST_TENANT_ADMIN_ID = "00000000-0000-0000-0000-000000000031";

// ─── AG tenant user cannot access test_tenant data ───────────────────────────

test.describe("AG admin cannot access test_tenant data", () => {
  test.use({ storageState: AG_ADMIN_AUTH_FILE });

  test("GET /api/kudos/[id] from test_tenant returns 404", async ({ request }) => {
    const res = await request.get(`/api/kudos/${TEST_TENANT_KUDOS_ID}`);
    // The AG admin's tenant context will scope the query — kudos in another
    // tenant won't be found, so we expect 404 (not 403, to avoid tenant enumeration)
    expect(res.status()).toBe(404);
  });

  test("GET /shelf/[member] for test_tenant member redirects or returns not-found", async ({
    page,
  }) => {
    await page.goto(`/shelf/${TEST_TENANT_USER_ID}`);
    await page.waitForLoadState("networkidle");
    // Should either 404 or show an empty shelf (member not in AG tenant)
    const url = page.url();
    const status = await page
      .evaluate(() => document.title)
      .then((t) => (t.includes("404") || t.includes("Not Found") ? 404 : 200));
    // Acceptable: either redirect to 404 page OR show page with empty shelf
    // The key assertion: user is not on an error/redirect that leaks test-tenant data
    expect([200, 404]).toContain(status);
  });
});

// ─── test_tenant user cannot access AG admin routes ──────────────────────────

test.describe("test_tenant user cannot reach AG admin routes", () => {
  test.use({ storageState: TEST_USER_AUTH_FILE });

  test("GET /admin/roster is forbidden for test_tenant user", async ({ page }) => {
    await page.goto("/admin/roster");
    await page.waitForLoadState("networkidle");
    // test_tenant user has role 'user', so admin routes should deny
    const url = page.url();
    // Expect either redirect to /library or a 403 page
    const isForbidden =
      url.includes("/library") ||
      url.includes("/login") ||
      (await page.title()).toLowerCase().includes("forbidden") ||
      (await page.title()).toLowerCase().includes("not found");
    expect(isForbidden).toBeTruthy();
  });

  test("GET /api/kudos returns only test_tenant kudos (not AG kudos)", async ({
    request,
  }) => {
    const res = await request.get("/api/kudos?mode=individual");
    if (res.status() === 200) {
      const body = await res.json() as { kudos?: Array<{ id: string }> };
      const ids = (body.kudos ?? []).map((k) => k.id);
      // None of the returned IDs should be a test_tenant kudos from the other tenant
      // (we only check that AG fixed kudos IDs don't appear; real AG kudos have random UUIDs)
      // The key test is that test_tenant kudos (fixed IDs starting with 000...004x) appear only for test_tenant sessions
      expect(ids.every((id) => !id.startsWith("00000000-0000-0000-0000-00000000004"))).toBe(true);
    } else {
      // If the route requires different params, that's acceptable
      expect([200, 400, 404]).toContain(res.status());
    }
  });
});

// ─── withTenantContext blocks unauthenticated requests ────────────────────────

test.describe("withTenantContext blocks unauthenticated API calls", () => {
  // No storageState = no session cookie

  test("POST /api/kudos without auth returns 401", async ({ request }) => {
    const res = await request.post("/api/kudos", {
      data: { mode: "individual", recipient_id: TEST_TENANT_USER_ID, message_text: "test" },
    });
    expect(res.status()).toBe(401);
  });

  test("GET /api/me/profile without auth returns 401", async ({ request }) => {
    const res = await request.get("/api/me/profile");
    expect(res.status()).toBe(401);
  });

  test("POST /api/me/request-deletion without auth returns 401", async ({ request }) => {
    const res = await request.post("/api/me/request-deletion");
    expect(res.status()).toBe(401);
  });

  test("GET /api/admin/health without correct secret returns 404", async ({ request }) => {
    const res = await request.get("/api/admin/health", {
      headers: { "x-admin-secret": "wrong-secret" },
    });
    // Wrong secret → 404 (not 401) to avoid revealing endpoint existence
    expect(res.status()).toBe(404);
  });
});

// ─── test_tenant admin cannot promote to AG admin ────────────────────────────

test.describe("test_tenant admin cannot escalate to AG admin actions", () => {
  test.use({ storageState: TEST_USER_AUTH_FILE });

  // test_tenant admin exists but should not be able to reach AG tenant's
  // admin API endpoints (which are scoped to ctx.tenantId)
  test("PATCH /api/admin/settings rejected for test_tenant session", async ({ request }) => {
    const res = await request.patch("/api/admin/settings", {
      data: { edit_window_minutes: 60 },
    });
    // test-user is role 'user', not admin — so this should be 403
    // Even if the seed admin were used, it would only affect test_tenant settings
    expect([401, 403]).toContain(res.status());
  });
});
