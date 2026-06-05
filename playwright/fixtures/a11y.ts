import { test as base, type Page } from "@playwright/test";
import { injectAxe, checkA11y } from "axe-playwright";

/**
 * Runs an axe accessibility scan on the current page.
 * Throws if any violations are found (WCAG 2.1 AA).
 */
export async function scanA11y(page: Page, context?: string): Promise<void> {
  await injectAxe(page);
  await checkA11y(page, context, {
    axeOptions: {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"],
      },
    },
  });
}

/**
 * Extended Playwright test fixture that includes the `scanA11y` helper.
 */
export const test = base.extend<{ scanA11y: typeof scanA11y }>({
  // eslint-disable-next-line no-empty-pattern
  scanA11y: async ({}, use) => {
    await use(scanA11y);
  },
});

export { expect } from "@playwright/test";
