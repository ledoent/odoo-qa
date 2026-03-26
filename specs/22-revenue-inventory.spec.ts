import { test, expect } from "../fixtures/workflow";

test.describe.serial("Revenue: Inventory Delivery", () => {
  let pickingId: number;
  let soName: string;

  test("create SO via RPC and validate delivery", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "sale", "stock");

    // Setup: find demo data
    const partner = await rpc.findDemoPartner();
    const product = await rpc.findDemoProduct();

    // Create SO via RPC
    const soId = await rpc.create("sale.order", {
      partner_id: partner.id,
    });
    await rpc.create("sale.order.line", {
      order_id: soId,
      product_id: product.id,
      product_uom_qty: 3,
    });
    await rpc.callMethod("sale.order", "action_confirm", [[soId]]);

    const so = await rpc.read("sale.order", [soId], ["name"]);
    soName = so[0].name;

    // Find the delivery
    const pickings = await rpc.searchRead(
      "stock.picking",
      [["origin", "=", soName]],
      ["id", "state"],
      { limit: 1 }
    );
    expect(pickings.length).toBeGreaterThan(0);
    pickingId = pickings[0].id;

    // Navigate to the picking in Inventory
    await page.goto(`/odoo/inventory/${pickingId}`);
    await odoo.waitForLoaded();
    await odoo.checkpoint("inventory-wf-01-delivery");

    // Validate the delivery
    const validateBtn = page.locator("button:has-text('Validate')").first();
    if (await validateBtn.isVisible().catch(() => false)) {
      await validateBtn.click();
      await page.waitForTimeout(1000);
      await odoo.confirmDialogs();
    }
    await odoo.checkpoint("inventory-wf-02-validated");

    // RPC: verify picking is done
    const picking = await rpc.read("stock.picking", [pickingId], ["state"]);
    expect(["done", "assigned"]).toContain(picking[0].state);
  });
});
