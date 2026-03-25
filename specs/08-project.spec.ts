import { test, expect } from "../fixtures/odoo";

test.describe("Project", () => {
  test.beforeEach(async ({ odoo }) => odoo.skipUnless(test, "project"));

  test("project kanban", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Project");
    await odoo.waitForLoaded();
    await expect(page.locator(".o_kanban_view, .o_list_view")).toBeVisible();
    await odoo.checkpoint("project-kanban");
  });

  test("open a project", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Project");
    await odoo.waitForLoaded();
    const card = page.locator(".o_kanban_record").first();
    if (await card.isVisible()) {
      await card.click();
      await odoo.waitForLoaded();
      await expect(page.locator(".o_content")).toBeVisible();
      await odoo.checkpoint("project-tasks");
    }
  });

  test("all tasks", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Project");
    await odoo.waitForLoaded();
    const menu = page.locator(".o_menu_sections").getByRole("menuitem", { name: /All Tasks|My Tasks/i });
    if (await menu.isVisible()) {
      await menu.click();
      await odoo.waitForLoaded();
    }
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("all-tasks");
  });
});
