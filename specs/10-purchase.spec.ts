import { test, expect } from "../fixtures/odoo";

test.describe("Purchase", () => {
  test.beforeEach(async ({ odoo }) => odoo.skipUnless(test, "purchase"));

  test("purchase dashboard", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Purchase");
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("purchase-dashboard");
  });

  test("purchase orders", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Purchase");
    await odoo.openMenuPath("Orders", "Purchase Orders").catch(() => {});
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("purchase-orders");
  });
});
