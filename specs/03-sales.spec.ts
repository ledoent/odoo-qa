import { test, expect } from "../fixtures/odoo";

test.describe("Sales", () => {
  test.beforeEach(async ({ odoo }) => odoo.skipUnless(test, "sale"));

  test("browse quotations", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Sales");
    await odoo.waitForLoaded();
    await expect(page.locator(".o_list_view, .o_kanban_view")).toBeVisible();
    await odoo.checkpoint("sales-quotations");
  });

  test("open sale order", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Sales");
    await odoo.waitForLoaded();
    const rows = await page.locator(".o_data_row").count();
    if (rows > 0) {
      await odoo.openFirstRecord();
      await odoo.expectView("form");
      await odoo.checkpoint("sale-order-form");
    }
  });

  test("view products", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Sales");
    const menu = page.locator(".o_menu_sections").getByRole("menuitem", { name: /Products/i });
    if (await menu.isVisible()) {
      await menu.click();
      const sub = page.getByRole("menuitem", { name: /^Products$/i });
      if (await sub.isVisible()) await sub.click();
      await odoo.waitForLoaded();
    }
    await expect(page.locator(".o_list_view, .o_kanban_view")).toBeVisible();
    await odoo.checkpoint("products");
  });
});
