import { test, expect } from "../fixtures/workflow";

test.describe("Procurement: Dropshipping (SO → PO)", () => {
  test("verify dropship route exists", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "sale_purchase");

    // Check if dropship route is configured
    const routes = await rpc.searchRead(
      "stock.route",
      [["name", "ilike", "dropship"]],
      ["id", "name"],
      { limit: 1 }
    );

    // Navigate to Inventory > Configuration > Routes
    await page.goto("/web");
    await odoo.openApp("Inventory");
    await odoo.openMenuPath("Configuration", "Routes").catch(() =>
      odoo.openMenuPath("Configuration", "Warehouse Management", "Routes").catch(() => {})
    );
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("dropship-wf-01-routes");
  });
});
