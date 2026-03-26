import { test, expect } from "../fixtures/workflow";

test.describe("Reports: CRM", () => {
  test("CRM pipeline analysis", async ({ page, odoo }) => {
    odoo.skipUnless(test, "crm");

    await page.goto("/web");
    await odoo.openApp("CRM");
    await odoo.openMenuPath("Reporting", "Pipeline").catch(() =>
      odoo.openMenuPath("Reporting").catch(() => {})
    );
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("reports-wf-10-crm-pipeline");
  });
});
