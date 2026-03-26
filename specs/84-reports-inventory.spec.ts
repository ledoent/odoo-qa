import { test, expect } from "../fixtures/workflow";

test.describe("Reports: Inventory", () => {
  test.beforeEach(async ({ odoo }) => odoo.skipUnless(test, "stock"));

  test("inventory valuation report", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Inventory");
    await odoo.openReport("Inventory Valuation").catch(() =>
      odoo.openMenuPath("Reporting").catch(() => {})
    );
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("reports-wf-07-inventory-valuation");
  });

  test("stock moves report", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Inventory");
    await odoo.openReport("Moves Analysis").catch(() =>
      odoo.openMenuPath("Reporting").catch(() => {})
    );
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("reports-wf-08-stock-moves");
  });
});
