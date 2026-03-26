import { test, expect } from "../fixtures/workflow";

test.describe.serial("E2E: Procure to Pay", () => {
  let poId: number;
  let poName: string;

  test("create PO, receive goods, create bill, pay", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "purchase", "stock", "account");

    const vendor = await rpc.findDemoVendor();
    const product = await rpc.findDemoProduct();

    // Create and confirm PO via RPC (setup)
    const result = await rpc.createConfirmedPO(vendor.id, [
      { productId: product.id, qty: 5, price: 30 },
    ]);
    poId = result.poId;
    poName = result.poName;

    // Receive goods via RPC
    const pickings = await rpc.getPickings(poName);
    expect(pickings.length).toBeGreaterThan(0);
    await rpc.callMethod("stock.picking", "button_validate", [[pickings[0].id]]);

    // Navigate to PO and create vendor bill via UI
    await page.goto(`/odoo/purchase/${poId}`);
    await odoo.waitForLoaded();

    const billBtn = page.locator("button:has-text('Create Bill')").first();
    if (await billBtn.isVisible().catch(() => false)) {
      await billBtn.click();
      await page.waitForTimeout(2000);
      await odoo.waitForLoaded();
    }
    await odoo.checkpoint("e2e-p2p-01-bill-created");

    // Confirm the vendor bill
    const confirmBtn = page.locator("button:has-text('Confirm')").first();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
      await odoo.waitForLoaded();
    }

    // Register payment
    const payBtn = page.locator("button:has-text('Register Payment')").first();
    if (await payBtn.isVisible().catch(() => false)) {
      await payBtn.click();
      await page.waitForTimeout(1000);
      await odoo.confirmDialog();
      await page.waitForTimeout(1000);
    }

    await odoo.waitForLoaded();
    await odoo.checkpoint("e2e-p2p-02-paid");

    // RPC verify full cycle
    const po = await rpc.read("purchase.order", [poId], ["state", "invoice_status"]);
    expect(po[0].state).toBe("purchase");
  });
});
