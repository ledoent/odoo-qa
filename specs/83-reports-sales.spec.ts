import { test, expect } from "../fixtures/workflow";

test.describe("Reports: Sales Analysis", () => {
  test.beforeEach(async ({ odoo }) => odoo.skipUnless(test, "sale"));

  test("sales analysis report loads", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Sales");
    await odoo.openReport("Sales").catch(() =>
      odoo.openMenuPath("Reporting").catch(() => {})
    );
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("reports-wf-05-sales-analysis");
  });

  test("pivot view", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Sales");
    await odoo.openReport("Sales").catch(() =>
      odoo.openMenuPath("Reporting").catch(() => {})
    );
    await odoo.waitForLoaded();
    const pivotBtn = page.locator(".o_control_panel .o_switch_view.o_pivot");
    if (await pivotBtn.isVisible().catch(() => false)) {
      await pivotBtn.click();
      await odoo.waitForLoaded();
    }
    await odoo.checkpoint("reports-wf-06-sales-pivot");
  });
});
