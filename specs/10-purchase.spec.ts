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
    await odoo.waitForLoaded();
    const menu = page.locator(".o_menu_sections").getByRole("menuitem", { name: /Orders/i });
    if (await menu.isVisible()) {
      await menu.click();
      const sub = page.getByRole("menuitem", { name: /Purchase Orders/i });
      if (await sub.isVisible()) await sub.click();
      await odoo.waitForLoaded();
    }
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("purchase-orders");
  });
});
