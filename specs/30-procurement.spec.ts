import { test, expect } from "../fixtures/workflow";

test.describe.serial("Procurement: Purchase Cycle", () => {
  let poId: number;
  let poName: string;

  test("create and confirm purchase order", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "purchase");

    await page.goto("/web");
    await odoo.openApp("Purchase");
    await odoo.clickNew();

    // Fill vendor
    await odoo.fillMany2one("partner_id", "Wood Corner");
    await page.waitForTimeout(500);

    // Add product line
    await page.getByText("Add a product", { exact: true }).click();
    await page.waitForTimeout(500);

    const productInput = page.locator(
      ".o_selected_row .o_field_widget[name='product_id'] input"
    );
    await productInput.first().waitFor({ state: "visible", timeout: 5_000 });
    await productInput.first().fill("Desk");
    const dropdownItem = page.locator(
      ".o-autocomplete--dropdown-menu .o-autocomplete--dropdown-item"
    );
    await dropdownItem.first().waitFor({ state: "visible", timeout: 10_000 });
    await dropdownItem.first().click();
    await page.waitForTimeout(500);

    // Handle product configurator if it appears
    const modal = page.locator(".modal-dialog");
    if (await modal.isVisible().catch(() => false)) {
      await modal.locator("button:has-text('Confirm'), .btn-primary").first().click();
      await page.waitForTimeout(1000);
    }

    await page.locator(".o_form_sheet").click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(300);
    await odoo.saveForm();
    await odoo.checkpoint("purchase-wf-01-rfq");

    // Confirm order
    await odoo.clickStatusBarButton("Confirm Order");
    await odoo.confirmDialog();
    await page.waitForTimeout(1000);

    poId = await odoo.getCurrentRecordId();
    poName = await odoo.getFieldValue("name");
    expect(poId).toBeGreaterThan(0);
    await odoo.checkpoint("purchase-wf-02-confirmed");

    // RPC: verify
    const po = await rpc.read("purchase.order", [poId], ["state"]);
    expect(po[0].state).toBe("purchase");
  });

  test("receive goods", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "purchase", "stock");
    test.skip(!poId, "No PO from previous step");

    await page.goto(`/odoo/purchase/${poId}`);
    await odoo.waitForLoaded();

    // Click "Receive Products" button
    const receiveBtn = page.locator("button, a")
      .filter({ hasText: /Receive|Receipt/i });
    if (await receiveBtn.first().isVisible().catch(() => false)) {
      await receiveBtn.first().click();
      await odoo.waitForLoaded();
      await page.waitForTimeout(1000);

      // Validate the receipt
      const validateBtn = page.locator("button:has-text('Validate')").first();
      if (await validateBtn.isVisible().catch(() => false)) {
        await validateBtn.click();
        await page.waitForTimeout(1000);
        await odoo.confirmDialog(); // Immediate transfer
        await odoo.confirmDialog(); // Any additional confirmation
      }
    }

    await odoo.checkpoint("purchase-wf-03-received");
  });
});
