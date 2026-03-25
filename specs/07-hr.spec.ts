import { test, expect } from "../fixtures/odoo";

test.describe("HR / Employees", () => {
  test.beforeEach(async ({ odoo }) => odoo.skipUnless(test, "hr"));

  test("employees list", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Employees");
    await odoo.waitForLoaded();
    await expect(page.locator(".o_kanban_view, .o_list_view")).toBeVisible();
    await odoo.checkpoint("employees-list");
  });

  test("open employee", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Employees");
    await odoo.waitForLoaded();
    const card = page.locator(".o_kanban_record").first();
    if (await card.isVisible()) {
      await card.click();
      await odoo.waitForLoaded();
      await expect(page.locator(".o_content")).toBeVisible();
      await odoo.checkpoint("employee-form");
    }
  });

  test("departments", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Employees");
    await odoo.waitForLoaded();
    const menu = page.locator(".o_menu_sections").getByRole("menuitem", { name: /Configuration/i });
    if (await menu.isVisible()) {
      await menu.click();
      const sub = page.getByRole("menuitem", { name: /Departments/i });
      if (await sub.isVisible()) await sub.click();
      await odoo.waitForLoaded();
    }
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("departments");
  });
});
