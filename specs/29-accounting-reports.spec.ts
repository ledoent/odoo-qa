import { test, expect } from "../fixtures/workflow";

test.describe("Accounting: Financial Reports", () => {
  test.beforeEach(async ({ odoo }) => odoo.skipUnless(test, "account"));

  test("profit and loss report", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Invoicing");
    await odoo.openMenuPath("Reporting", "Profit and Loss").catch(() =>
      odoo.openMenuPath("Reporting", "P&L").catch(() => {})
    );
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("reports-wf-01-pnl");
  });

  test("balance sheet report", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Invoicing");
    await odoo.openMenuPath("Reporting", "Balance Sheet").catch(() => {});
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("reports-wf-02-balance-sheet");
  });

  test("general ledger", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Invoicing");
    await odoo.openMenuPath("Reporting", "General Ledger").catch(() => {});
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("reports-wf-03-general-ledger");
  });

  test("aged receivable", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Invoicing");
    await odoo.openMenuPath("Reporting", "Aged Receivable").catch(() =>
      odoo.openMenuPath("Reporting", "Partner Reports", "Aged Receivable").catch(() => {})
    );
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("reports-wf-04-aged-receivable");
  });
});
