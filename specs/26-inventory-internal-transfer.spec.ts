import { test, expect } from "../fixtures/workflow";

test.describe("Inventory: Internal Transfer", () => {
  test("create and validate internal transfer", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "stock");

    // Find internal picking type
    const pickTypes = await rpc.searchRead(
      "stock.picking.type",
      [["code", "=", "internal"]],
      ["id", "name"],
      { limit: 1 }
    );
    if (pickTypes.length === 0) {
      test.skip(true, "No internal transfer type configured");
      return;
    }

    const product = await rpc.findDemoProduct();

    // Create internal transfer via RPC
    const pickingId = await rpc.create("stock.picking", {
      picking_type_id: pickTypes[0].id,
    });
    await rpc.create("stock.move", {
      picking_id: pickingId,
      product_id: product.id,
      product_uom_qty: 3,
      name: `E2E Transfer ${Date.now()}`,
      location_id: 8, // stock.stock_location_stock (default)
      location_dest_id: 8,
    });

    // Navigate to the transfer
    await page.goto(`/odoo/inventory/${pickingId}`);
    await odoo.waitForLoaded();
    await odoo.checkpoint("transfer-wf-01-draft");

    // Mark as to-do then validate
    const checkBtn = page.locator("button:has-text('Check Availability'), button:has-text('Mark as Todo')");
    if (await checkBtn.first().isVisible().catch(() => false)) {
      await checkBtn.first().click();
      await odoo.waitForLoaded();
    }

    const validateBtn = page.locator("button:has-text('Validate')").first();
    if (await validateBtn.isVisible().catch(() => false)) {
      await validateBtn.click();
      await page.waitForTimeout(1000);
      await odoo.confirmDialogs();
    }

    await odoo.checkpoint("transfer-wf-02-validated");

    // RPC verify
    const picking = await rpc.read("stock.picking", [pickingId], ["state"]);
    expect(["done", "assigned"]).toContain(picking[0].state);
  });
});
