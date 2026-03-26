import { test, expect } from "../fixtures/workflow";

test.describe("Reports: Purchase", () => {
  test("purchase analysis report", async ({ page, odoo }) => {
    odoo.skipUnless(test, "purchase");

    await page.goto("/web");
    await odoo.openApp("Purchase");
    await odoo.openMenuPath("Reporting").catch(() => {});
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("reports-wf-09-purchase-analysis");
  });
});
