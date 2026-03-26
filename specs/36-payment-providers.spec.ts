import { test, expect } from "../fixtures/workflow";

test.describe("Accounting: Payment Providers", () => {
  test("payment providers config page", async ({ page, odoo }) => {
    odoo.skipUnless(test, "payment");

    await page.goto("/web");
    await odoo.openApp("Invoicing");
    await odoo.openMenuPath("Configuration", "Payment Providers").catch(() =>
      odoo.openMenuPath("Configuration", "Payment Acquirers").catch(() => {})
    );
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("payment-wf-01-providers");
  });
});
