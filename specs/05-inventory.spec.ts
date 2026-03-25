import { test, expect } from "../fixtures/odoo";

test.describe("Inventory", () => {
  test.beforeEach(async ({ odoo }) => odoo.skipUnless(test, "stock"));

  test("dashboard", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Inventory");
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("inventory-dashboard");
  });

  test("delivery orders", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Inventory");
    await odoo.waitForLoaded();
    const menu = page.locator(".o_menu_sections").getByRole("menuitem", { name: /Operations/i });
    if (await menu.isVisible()) {
      await menu.click();
      const sub = page.getByRole("menuitem", { name: /Delivery Orders|Deliveries/i });
      if (await sub.isVisible()) await sub.click();
      await odoo.waitForLoaded();
    }
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("delivery-orders");
  });

  test("products", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Inventory");
    await odoo.waitForLoaded();
    const menu = page.locator(".o_menu_sections").getByRole("menuitem", { name: /Products/i });
    if (await menu.isVisible()) {
      await menu.click();
      const sub = page.getByRole("menuitem", { name: /^Products$/i });
      if (await sub.isVisible()) await sub.click();
      await odoo.waitForLoaded();
    }
    await expect(page.locator(".o_list_view, .o_kanban_view")).toBeVisible();
    await odoo.checkpoint("inventory-products");
  });
});
