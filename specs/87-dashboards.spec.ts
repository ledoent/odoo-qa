import { test, expect } from "../fixtures/workflow";

test.describe("Dashboards", () => {
  test("dashboards app loads", async ({ page, odoo }) => {
    odoo.skipUnless(test, "spreadsheet_dashboard");

    await page.goto("/web");
    await odoo.openApp("Dashboards");
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("dashboards-wf-01-list");
  });
});
