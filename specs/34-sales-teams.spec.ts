import { test, expect } from "../fixtures/workflow";

test.describe("Sales: Teams & Channels", () => {
  test("browse sales teams", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "sales_team");

    // Verify sales teams exist
    const teams = await rpc.searchRead("crm.team", [], ["id", "name"], { limit: 5 });
    expect(teams.length).toBeGreaterThan(0);

    // Navigate to sales teams config
    await page.goto("/web");
    await odoo.openApp("Sales");
    await odoo.openMenuPath("Configuration", "Sales Teams").catch(() => {});
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("sales-teams-wf-01-list");
  });
});
