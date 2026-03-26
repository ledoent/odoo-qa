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
    if (await card.isVisible().catch(() => false)) {
      await card.click();
      await odoo.waitForLoaded();
      await expect(page.locator(".o_content")).toBeVisible();
      await odoo.checkpoint("employee-form");
    }
  });

  test("departments", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Employees");
    await odoo.openMenuPath("Configuration", "Departments").catch(() => {});
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("departments");
  });
});
