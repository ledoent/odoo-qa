import { test, expect } from "../fixtures/odoo";

test.describe("Manufacturing", () => {
  test.beforeEach(async ({ odoo }) => odoo.skipUnless(test, "mrp"));

  test("MRP dashboard", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Manufacturing");
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("mrp-dashboard");
  });

  test("manufacturing orders", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Manufacturing");
    await odoo.waitForLoaded();
    const menu = page.locator(".o_menu_sections").getByRole("menuitem", { name: /Operations/i });
    if (await menu.isVisible()) {
      await menu.click();
      const sub = page.getByRole("menuitem", { name: /Manufacturing Orders/i });
      if (await sub.isVisible()) await sub.click();
      await odoo.waitForLoaded();
    }
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("manufacturing-orders");
  });

  test("bills of materials", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Manufacturing");
    await odoo.waitForLoaded();
    const menu = page.locator(".o_menu_sections").getByRole("menuitem", { name: /Products/i });
    if (await menu.isVisible()) {
      await menu.click();
      const sub = page.getByRole("menuitem", { name: /Bills of Materials/i });
      if (await sub.isVisible()) await sub.click();
      await odoo.waitForLoaded();
    }
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("bills-of-materials");
  });
});
