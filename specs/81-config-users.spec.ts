import { test, expect } from "../fixtures/workflow";

test.describe("Config: Users & Access", () => {
  test("users list loads", async ({ page, odoo }) => {
    await page.goto("/odoo/settings/users");
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.expectMinRecords(1);
    await odoo.checkpoint("config-wf-03-users-list");
  });

  test("open user form", async ({ page, odoo }) => {
    await page.goto("/odoo/settings/users");
    await odoo.waitForLoaded();
    await odoo.openFirstRecord();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("config-wf-04-user-form");
  });

  test("apps/modules list loads", async ({ page, odoo }) => {
    await page.goto("/odoo/apps");
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("config-wf-05-apps");
  });
});
