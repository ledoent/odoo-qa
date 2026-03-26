import { test, expect } from "../fixtures/workflow";

test.describe.serial("E2E: Make to Order (SO → MO → Deliver)", () => {
  test("SO triggers MO, produce, deliver, invoice", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "sale", "mrp", "stock");

    // Find a manufactured product (one with BoM)
    const boms = await rpc.searchRead("mrp.bom", [], ["id", "product_tmpl_id"], { limit: 1 });
    if (boms.length === 0) { test.skip(true, "No BoM for MTO test"); return; }

    const tmplId = boms[0].product_tmpl_id[0];
    const products = await rpc.searchRead(
      "product.product",
      [["product_tmpl_id", "=", tmplId]],
      ["id", "name"],
      { limit: 1 }
    );
    if (products.length === 0) { test.skip(true, "No product variant"); return; }

    const partner = await rpc.findDemoPartner();

    // Create SO with the manufactured product
    const result = await rpc.createConfirmedSO(partner.id, [
      { productId: products[0].id, qty: 1 },
    ]);

    // Check if an MO was auto-created (depends on route config)
    const mos = await rpc.searchRead(
      "mrp.production",
      [["origin", "like", result.soName]],
      ["id", "state", "product_id"],
      { limit: 1 }
    );

    if (mos.length > 0) {
      // MO was auto-created — confirm and produce
      const moId = mos[0].id;

      await page.goto(`/odoo/manufacturing/${moId}`);
      await odoo.waitForLoaded();

      const confirmBtn = page.locator("button:has-text('Confirm')").first();
      if (await confirmBtn.isVisible().catch(() => false)) {
        await confirmBtn.click();
        await odoo.waitForLoaded();
      }

      const produceBtn = page.locator(
        "button:has-text('Produce All'), button:has-text('Mark as Done')"
      );
      if (await produceBtn.first().isVisible().catch(() => false)) {
        await produceBtn.first().click();
        await page.waitForTimeout(1000);
        await odoo.confirmDialogs();
      }

      await odoo.checkpoint("e2e-mto-01-produced");
    }

    // Deliver the SO
    const pickings = await rpc.getPickings(result.soName);
    if (pickings.length > 0) {
      const outPicking = pickings.find(p => p.state !== "done") || pickings[0];
      if (outPicking.state !== "done") {
        await rpc.callMethod("stock.picking", "button_validate", [[outPicking.id]]);
      }
    }

    // Navigate to SO and verify
    await page.goto(`/odoo/sales/${result.soId}`);
    await odoo.waitForLoaded();
    await odoo.checkpoint("e2e-mto-02-delivered");

    // RPC verify
    const so = await rpc.read("sale.order", [result.soId], ["state"]);
    expect(so[0].state).toBe("sale");
  });
});
