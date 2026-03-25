import { test, expect } from "../fixtures/odoo";

test.describe("Accounting", () => {
  test.beforeEach(async ({ odoo }) => odoo.skipUnless(test, "account"));

  test("invoicing dashboard", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Invoicing");
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("invoicing-dashboard");
  });

  test("customer invoices", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Invoicing");
    await odoo.waitForLoaded();
    const menu = page.locator(".o_menu_sections").getByRole("menuitem", { name: /Customers/i });
    if (await menu.isVisible()) {
      await menu.click();
      const sub = page.getByRole("menuitem", { name: /^Invoices$/i });
      if (await sub.isVisible()) await sub.click();
      await odoo.waitForLoaded();
    }
    await expect(page.locator(".o_list_view, .o_kanban_view")).toBeVisible();
    await odoo.checkpoint("customer-invoices");
  });

  test("journal entries", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Invoicing");
    await odoo.waitForLoaded();
    const menu = page.locator(".o_menu_sections").getByRole("menuitem", { name: /Accounting/i });
    if (await menu.isVisible()) {
      await menu.click();
      const sub = page.getByRole("menuitem", { name: /Journal Entries/i });
      if (await sub.isVisible()) await sub.click();
      await odoo.waitForLoaded();
    }
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("journal-entries");
  });

  test("chart of accounts", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Invoicing");
    await odoo.waitForLoaded();
    const menu = page.locator(".o_menu_sections").getByRole("menuitem", { name: /Configuration/i });
    if (await menu.isVisible()) {
      await menu.click();
      const sub = page.getByRole("menuitem", { name: /Chart of Accounts/i });
      if (await sub.isVisible()) await sub.click();
      await odoo.waitForLoaded();
    }
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("chart-of-accounts");
  });
});
