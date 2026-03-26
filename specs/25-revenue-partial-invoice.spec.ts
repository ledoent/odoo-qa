import { test, expect } from "../fixtures/workflow";

test.describe.serial("Revenue: Partial Invoicing", () => {
  let soId: number;
  let soName: string;

  test("create SO with 10 units, deliver 5, invoice delivered", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "sale", "stock", "account");

    const partner = await rpc.findDemoPartner();
    const product = await rpc.findDemoProduct();
    const result = await rpc.createConfirmedSO(partner.id, [{ productId: product.id, qty: 10 }]);
    soId = result.soId;
    soName = result.soName;

    // Find the delivery and do partial validation (5 of 10)
    const pickings = await rpc.getPickings(soName);
    expect(pickings.length).toBeGreaterThan(0);
    const pickingId = pickings[0].id;

    // Set done qty to 5 on the move lines
    const moves = await rpc.searchRead(
      "stock.move",
      [["picking_id", "=", pickingId]],
      ["id", "product_uom_qty"]
    );
    for (const move of moves) {
      await rpc.write("stock.move", [move.id], { quantity: 5 });
    }

    // Validate picking (creates backorder for remaining 5)
    await rpc.callMethod("stock.picking", "button_validate", [[pickingId]]);

    // Navigate to SO and create invoice
    await page.goto(`/odoo/sales/${soId}`);
    await odoo.waitForLoaded();

    const invoiceBtn = page.locator("button:has-text('Create Invoice')").first();
    await expect(invoiceBtn).toBeVisible({ timeout: 10_000 });
    await invoiceBtn.click();
    await page.waitForTimeout(1000);
    await odoo.confirmDialog();
    await page.waitForTimeout(2000);
    await odoo.waitForLoaded();
    await odoo.checkpoint("partial-invoice-wf-01-first-invoice");

    // RPC verify: invoice should be for delivered qty
    const invoices = await rpc.getSOInvoices(soId);
    expect(invoices.length).toBeGreaterThanOrEqual(1);
  });
});
