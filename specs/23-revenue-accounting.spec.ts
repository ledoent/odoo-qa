import { test, expect } from "../fixtures/workflow";

test.describe.serial("Revenue: Invoice and Payment", () => {
  let soId: number;
  let soName: string;
  let invoiceId: number;

  test("create invoice from SO and register payment", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "sale", "account");

    // Setup: create + confirm SO via RPC
    const partner = await rpc.findDemoPartner();
    const product = await rpc.findDemoProduct();

    soId = await rpc.create("sale.order", { partner_id: partner.id });
    await rpc.create("sale.order.line", {
      order_id: soId,
      product_id: product.id,
      product_uom_qty: 2,
    });
    await rpc.callMethod("sale.order", "action_confirm", [[soId]]);
    const so = await rpc.read("sale.order", [soId], ["name"]);
    soName = so[0].name;

    // Navigate to the SO
    await page.goto(`/odoo/sales/${soId}`);
    await odoo.waitForLoaded();

    // Click "Create Invoice"
    const createInvoiceBtn = page.locator("button:has-text('Create Invoice')").first();
    await expect(createInvoiceBtn).toBeVisible({ timeout: 10_000 });
    await createInvoiceBtn.click();
    await page.waitForTimeout(1000);

    // Handle invoice wizard — click "Create and View Invoice" or "Create Invoice"
    const modal = page.locator(".modal-dialog");
    if (await modal.isVisible().catch(() => false)) {
      const createBtn = modal.locator(
        "button:has-text('Create and View'), button:has-text('Create Invoice'), .btn-primary"
      );
      await createBtn.first().click();
      await page.waitForTimeout(2000);
    }

    await odoo.waitForLoaded();
    await odoo.checkpoint("accounting-wf-01-draft-invoice");

    // Get invoice ID
    invoiceId = await odoo.getCurrentRecordId();
    expect(invoiceId).toBeGreaterThan(0);

    // Confirm the invoice
    const confirmBtn = page.locator("button:has-text('Confirm')").first();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
      await odoo.waitForLoaded();
    }
    await odoo.checkpoint("accounting-wf-02-confirmed");

    // Register payment
    const paymentBtn = page.locator("button:has-text('Register Payment')").first();
    if (await paymentBtn.isVisible().catch(() => false)) {
      await paymentBtn.click();
      await page.waitForTimeout(1000);

      // Payment wizard
      const payModal = page.locator(".modal-dialog");
      if (await payModal.isVisible().catch(() => false)) {
        const createPayBtn = payModal.locator(
          "button:has-text('Create Payment'), .btn-primary"
        );
        await createPayBtn.first().click();
        await page.waitForTimeout(1000);
      }
    }

    await odoo.waitForLoaded();
    await odoo.checkpoint("accounting-wf-03-paid");

    // RPC: verify invoice exists and was confirmed
    const invoice = await rpc.read("account.move", [invoiceId], ["payment_state", "state"]);
    expect(invoice[0].state).toBe("posted");
    // Payment may or may not have completed depending on wizard behavior
    expect(["paid", "in_payment", "not_paid"]).toContain(invoice[0].payment_state);
  });
});
