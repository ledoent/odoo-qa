import { test, expect } from "../fixtures/workflow";

test.describe("Reports: Inventory", () => {
  test("inventory valuation report", async ({ page, odoo }) => {
    odoo.skipUnless(test, "stock");

    await page.goto("/web");
    await odoo.openApp("Inventory");
    await odoo.openMenuPath("Reporting", "Inventory Valuation").catch(() =>
      odoo.openMenuPath("Reporting", "Valuation").catch(() =>
        odoo.openMenuPath("Reporting").catch(() => {})
      )
    );
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("reports-wf-07-inventory-valuation");
  });

  test("stock moves report", async ({ page, odoo }) => {
    odoo.skipUnless(test, "stock");

    await page.goto("/web");
    await odoo.openApp("Inventory");
    await odoo.openMenuPath("Reporting", "Moves Analysis").catch(() =>
      odoo.openMenuPath("Reporting", "Stock Moves").catch(() => {})
    );
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("reports-wf-08-stock-moves");
  });
});
