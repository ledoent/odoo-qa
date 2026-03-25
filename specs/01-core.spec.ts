import { test, expect } from "../fixtures/odoo";

test.describe("Core", () => {
  test("web client loads", async ({ page }) => {
    await page.goto("/odoo");
    await page.locator(".o_main_navbar").waitFor({ state: "visible", timeout: 15_000 });
    await expect(page.locator(".o_main_navbar")).toBeVisible();
  });

  test("app switcher opens", async ({ page, odoo }) => {
    await page.goto("/odoo");
    await page.locator(".o_main_navbar").waitFor({ state: "visible", timeout: 15_000 });
    await page.locator(".o_navbar_apps_menu button").click();
    await expect(page.locator("a.o_app").first()).toBeVisible();
    await odoo.checkpoint("app-switcher");
  });

  test("settings page loads", async ({ page, odoo }) => {
    await page.goto("/odoo/settings");
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("settings");
  });

  test("users list loads", async ({ page, odoo }) => {
    await page.goto("/odoo/settings/users");
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("users-list");
  });
});
