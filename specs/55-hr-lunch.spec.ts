import { test, expect } from "../fixtures/workflow";

test.describe("Lunch: Menu Browsing", () => {
  test("browse lunch menu", async ({ page, odoo }) => {
    odoo.skipUnless(test, "lunch");

    await page.goto("/web");
    await odoo.openApp("Lunch");
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("lunch-wf-01-menu");
  });
});
