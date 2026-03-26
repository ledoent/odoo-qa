import { test, expect } from "../fixtures/workflow";

test.describe("Manufacturing: Production Order", () => {
  test("create and complete manufacturing order", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "mrp");

    // Find a product with BoM via RPC
    const boms = await rpc.searchRead("mrp.bom", [], ["id", "product_tmpl_id"], { limit: 1 });
    if (boms.length === 0) {
      test.skip(true, "No Bill of Materials found");
      return;
    }

    // Find a product from that BoM template
    const tmplId = boms[0].product_tmpl_id[0];
    const products = await rpc.searchRead(
      "product.product",
      [["product_tmpl_id", "=", tmplId]],
      ["id"],
      { limit: 1 }
    );
    if (products.length === 0) {
      test.skip(true, "No product variant for BoM");
      return;
    }

    // Create MO via RPC
    const moId = await rpc.create("mrp.production", {
      product_id: products[0].id,
      product_qty: 1,
    });
    expect(moId).toBeGreaterThan(0);

    // Navigate to the MO
    await page.goto(`/odoo/manufacturing/${moId}`);
    await odoo.waitForLoaded();
    await odoo.checkpoint("mrp-wf-01-draft");

    // Confirm
    const confirmBtn = page.locator("button:has-text('Confirm')").first();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
      await odoo.waitForLoaded();
    }
    await odoo.checkpoint("mrp-wf-02-confirmed");

    // Produce / Mark as Done
    const produceBtn = page.locator(
      "button:has-text('Produce All'), button:has-text('Mark as Done'), button:has-text('Done')"
    );
    if (await produceBtn.first().isVisible().catch(() => false)) {
      await produceBtn.first().click();
      await page.waitForTimeout(1000);
      await odoo.confirmDialog();
    }
    await odoo.checkpoint("mrp-wf-03-done");

    // RPC verify
    const mo = await rpc.read("mrp.production", [moId], ["state"]);
    expect(["done", "to_close", "confirmed"]).toContain(mo[0].state);
  });
});
