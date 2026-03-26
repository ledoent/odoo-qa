import { test, expect } from "../fixtures/workflow";

test.describe("HR: Org Chart", () => {
  test("org chart view loads", async ({ page, odoo }) => {
    odoo.skipUnless(test, "hr_org_chart");

    // Find an employee and check org chart
    await page.goto("/web");
    await odoo.openApp("Employees");
    await odoo.waitForLoaded();

    // Click first employee
    const card = page.locator(".o_kanban_record").first();
    if (await card.isVisible().catch(() => false)) {
      await card.click();
      await odoo.waitForLoaded();

      // Look for org chart tab or button
      const orgTab = page.locator("a, button").filter({ hasText: /Org Chart|Organization/i });
      if (await orgTab.first().isVisible().catch(() => false)) {
        await orgTab.first().click();
        await page.waitForTimeout(1000);
      }
    }

    await odoo.checkpoint("hr-org-chart-wf-01");
  });
});
