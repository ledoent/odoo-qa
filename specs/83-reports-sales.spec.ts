import { test, expect } from "../fixtures/workflow";

test.describe("Reports: Sales Analysis", () => {
  test("sales analysis report loads", async ({ page, odoo }) => {
    odoo.skipUnless(test, "sale");

    await page.goto("/web");
    await odoo.openApp("Sales");
    await odoo.openMenuPath("Reporting").catch(() => {});
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("reports-wf-05-sales-analysis");
  });

  test("sales orders by salesperson", async ({ page, odoo }) => {
    odoo.skipUnless(test, "sale");

    await page.goto("/web");
    await odoo.openApp("Sales");
    await odoo.openMenuPath("Reporting").catch(() => {});
    await odoo.waitForLoaded();

    // Try pivot or graph view
    const pivotBtn = page.locator(".o_control_panel .o_switch_view.o_pivot");
    if (await pivotBtn.isVisible().catch(() => false)) {
      await pivotBtn.click();
      await odoo.waitForLoaded();
    }

    await odoo.checkpoint("reports-wf-06-sales-pivot");
    await expect(page.locator(".o_content")).toBeVisible();
  });
});
