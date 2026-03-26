import { test, expect } from "../fixtures/workflow";

test.describe("Config: Email & Technical", () => {
  test("email servers page", async ({ page, odoo }) => {
    odoo.skipUnless(test, "mail");

    await page.goto("/odoo/settings");
    await odoo.waitForLoaded();

    // Try to navigate to email configuration
    const technicalMenu = page.locator("a, button").filter({ hasText: /Technical|Email/i });
    if (await technicalMenu.first().isVisible().catch(() => false)) {
      await technicalMenu.first().click();
      await odoo.waitForLoaded();
    }

    await odoo.checkpoint("config-wf-06-email");
    await expect(page.locator(".o_content")).toBeVisible();
  });
});
