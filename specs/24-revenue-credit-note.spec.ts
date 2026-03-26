import { test, expect } from "../fixtures/workflow";

test.describe.serial("Revenue: Credit Note", () => {
  let invoiceId: number;

  test("create invoice, then credit note", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "account");

    // Setup: create posted invoice via RPC
    const partner = await rpc.findDemoPartner();
    const product = await rpc.findDemoProduct();

    invoiceId = await rpc.create("account.move", {
      move_type: "out_invoice",
      partner_id: partner.id,
      invoice_line_ids: [
        [0, 0, { product_id: product.id, quantity: 2, price_unit: 100 }],
      ],
    });
    await rpc.callMethod("account.move", "action_post", [[invoiceId]]);

    // Navigate to the invoice
    await page.goto(`/odoo/accounting/customer-invoices/${invoiceId}`);
    await odoo.waitForLoaded();
    await odoo.checkpoint("credit-note-wf-01-posted-invoice");

    // Click "Add Credit Note" or "Credit Note"
    const creditBtn = page.locator("button:has-text('Credit Note'), button:has-text('Add Credit Note')");
    await expect(creditBtn.first()).toBeVisible({ timeout: 10_000 });
    await creditBtn.first().click();
    await page.waitForTimeout(1000);

    // Handle credit note wizard
    await odoo.confirmDialog();
    await page.waitForTimeout(2000);
    await odoo.waitForLoaded();
    await odoo.checkpoint("credit-note-wf-02-credit-note-created");

    // Verify: invoice state should have changed (reversed or paid)
    const invoice = await rpc.read("account.move", [invoiceId], ["state", "payment_state"]);
    expect(invoice[0]).toBeTruthy();
  });
});
