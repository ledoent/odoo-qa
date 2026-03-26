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
    await odoo.openMenuPath("Operations", "Deliveries").catch(() =>
      odoo.openMenuPath("Operations", "Delivery Orders").catch(() => {})
    );
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("delivery-orders");
  });

  test("products", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Inventory");
    await odoo.openMenuPath("Products", "Products").catch(() => {});
    await expect(page.locator(".o_list_view, .o_kanban_view")).toBeVisible();
    await odoo.checkpoint("inventory-products");
  });
});
