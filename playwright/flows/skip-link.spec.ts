/**
 * REB-83: Skip to Main Content link should only appear on keyboard focus,
 * not on programmatic focus from Next.js client-side navigation.
 *
 * Root cause: `focus:not-sr-only` triggers on any focus event (including
 * programmatic). Fix uses `focus-visible:not-sr-only` which only triggers
 * for keyboard-initiated focus.
 */
import { test, expect } from "@playwright/test";

// The skip link is sr-only when hidden. A clipped sr-only element has a bounding
// box of ~1x1px. When revealed (not-sr-only + padding), it is much wider/taller.
const SR_ONLY_MAX_PX = 5;

test.describe("Skip to Main Content link — public homepage", () => {
  test("does NOT appear after mouse navigation back from /terms", async ({ page }) => {
    await page.goto("/terms");
    await page.waitForLoadState("networkidle");

    // Click the breadcrumb link — this triggers Next.js client-side navigation
    // back to /, which programmatically focuses the first focusable element.
    await page.getByRole("link", { name: /The Kudos Library/ }).first().click();
    await page.waitForLoadState("networkidle");

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    const box = await skipLink.boundingBox();

    // If the bug is present, box.width >> SR_ONLY_MAX_PX (link is revealed).
    // With the fix, width stays at 1px (sr-only is still applied).
    expect(box?.width ?? 0).toBeLessThanOrEqual(SR_ONLY_MAX_PX);
  });

  test("does NOT appear after mouse navigation back from /privacy", async ({ page }) => {
    await page.goto("/privacy");
    await page.waitForLoadState("networkidle");

    await page.getByRole("link", { name: /The Kudos Library/ }).first().click();
    await page.waitForLoadState("networkidle");

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    const box = await skipLink.boundingBox();
    expect(box?.width ?? 0).toBeLessThanOrEqual(SR_ONLY_MAX_PX);
  });

  test("IS visible when Tab key is pressed from page start (keyboard a11y)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Tab from the body — first focusable element should be the skip link.
    await page.keyboard.press("Tab");

    const skipLink = page.getByRole("link", { name: "Skip to main content" });
    const box = await skipLink.boundingBox();

    // With focus-visible applied from Tab key, the link must be revealed.
    expect(box?.width ?? 0).toBeGreaterThan(SR_ONLY_MAX_PX);
  });
});
