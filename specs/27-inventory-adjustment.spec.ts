import { test, expect } from "../fixtures/workflow";

test.describe("Inventory: Stock Adjustment", () => {
  test("create inventory adjustment", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "stock");

    // Find a storable product (not consumable — quants can't be created for consumables)
    const storableProducts = await rpc.searchRead(
      "product.product",
      [["type", "=", "product"]],
      ["id", "name"],
      { limit: 1 }
    );
    if (storableProducts.length === 0) {
      test.skip(true, "No storable product found for inventory adjustment");
      return;
    }
    const product = storableProducts[0];

    // Find default stock location
    const locations = await rpc.searchRead(
      "stock.warehouse", [], ["lot_stock_id"], { limit: 1 }
    );
    const stockLocationId = locations[0]?.lot_stock_id?.[0] || 8;

    const quantId = await rpc.create("stock.quant", {
      product_id: product.id,
      location_id: stockLocationId,
      inventory_quantity: 100,
    });

    await rpc.callMethod("stock.quant", "action_apply_inventory", [[quantId]]);

    // Navigate to inventory adjustments in Inventory app
    await page.goto("/web");
    await odoo.openApp("Inventory");
    await odoo.openMenuPath("Operations", "Physical Inventory").catch(() =>
      odoo.openMenuPath("Operations", "Inventory Adjustments").catch(() => {})
    );
    await odoo.waitForLoaded();
    await odoo.checkpoint("adjustment-wf-01-list");

    // RPC verify: quant was updated
    const quant = await rpc.read("stock.quant", [quantId], ["quantity"]);
    expect(quant[0].quantity).toBe(100);
  });
});
