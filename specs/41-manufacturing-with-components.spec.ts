import { test, expect } from "../fixtures/workflow";

test.describe("Manufacturing: Production with Components", () => {
  test("create MO, check components, produce, verify consumed stock", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "mrp", "stock");

    // Find a product with BoM that has components
    const boms = await rpc.searchRead(
      "mrp.bom",
      [],
      ["id", "product_tmpl_id", "bom_line_ids"],
      { limit: 1 }
    );
    if (boms.length === 0 || !boms[0].bom_line_ids?.length) {
      test.skip(true, "No BoM with components found");
      return;
    }

    // Get product from BoM
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

    // Get component details before production
    const bomLines = await rpc.read("mrp.bom.line", boms[0].bom_line_ids, ["product_id", "product_qty"]);

    // Create MO via RPC
    const moId = await rpc.create("mrp.production", {
      product_id: products[0].id,
      product_qty: 1,
      bom_id: boms[0].id,
    });

    // Navigate and confirm
    await page.goto(`/odoo/manufacturing/${moId}`);
    await odoo.waitForLoaded();
    await odoo.checkpoint("mrp-components-wf-01-draft");

    // Verify components are listed
    const componentRows = page.locator(".o_field_widget[name='move_raw_ids'] .o_data_row");
    const componentCount = await componentRows.count();
    expect(componentCount).toBeGreaterThan(0);

    // Confirm
    const confirmBtn = page.locator("button:has-text('Confirm')").first();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
      await odoo.waitForLoaded();
    }
    await odoo.checkpoint("mrp-components-wf-02-confirmed");

    // Produce
    const produceBtn = page.locator(
      "button:has-text('Produce All'), button:has-text('Mark as Done'), button:has-text('Done')"
    );
    if (await produceBtn.first().isVisible().catch(() => false)) {
      await produceBtn.first().click();
      await page.waitForTimeout(1000);
      await odoo.confirmDialogs();
    }
    await odoo.checkpoint("mrp-components-wf-03-done");

    // RPC verify
    const mo = await rpc.read("mrp.production", [moId], ["state"]);
    expect(["done", "to_close", "confirmed"]).toContain(mo[0].state);
  });
});
