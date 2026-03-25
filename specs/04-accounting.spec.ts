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
    await odoo.openMenuPath("Customers", "Invoices").catch(() => {});
    await expect(page.locator(".o_list_view, .o_kanban_view")).toBeVisible();
    await odoo.checkpoint("customer-invoices");
  });

  test("journal entries", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Invoicing");
    await odoo.openMenuPath("Accounting", "Journal Entries").catch(() => {});
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("journal-entries");
  });

  test("chart of accounts", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Invoicing");
    await odoo.openMenuPath("Configuration", "Chart of Accounts").catch(() => {});
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("chart-of-accounts");
  });
});
