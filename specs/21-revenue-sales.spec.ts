import { test, expect } from "../fixtures/workflow";

test.describe.serial("Revenue: Sales Cycle", () => {
  let soId: number;
  let soName: string;

  test("create and confirm quotation", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "sale");

    // Create quotation
    await page.goto("/web");
    await odoo.openApp("Sales");
    await odoo.clickNew();
    await odoo.fillMany2one("partner_id", "Azure Interior");
    await odoo.checkpoint("sales-wf-01-new-quote");

    // Click "Add a product"
    await page.getByText("Add a product", { exact: true }).click();
    await page.waitForTimeout(500);

    // Fill product in the new editable row
    const productInput = page.locator(
      ".o_selected_row .o_field_widget[name='product_template_id'] input, " +
      ".o_selected_row .o_field_widget[name='product_id'] input"
    );
    await productInput.first().waitFor({ state: "visible", timeout: 5_000 });
    await productInput.first().fill("Customizable Desk");

    const dropdownItem = page.locator(
      ".o-autocomplete--dropdown-menu .o-autocomplete--dropdown-item"
    );
    await dropdownItem.first().waitFor({ state: "visible", timeout: 10_000 });
    await dropdownItem.first().click();
    await page.waitForTimeout(1000);

    // Handle product configurator modal if it appears
    const modal = page.locator(".modal-dialog");
    if (await modal.isVisible().catch(() => false)) {
      await modal.locator("button:has-text('Confirm')").click();
      await page.waitForTimeout(1000);
    }

    // Click outside to deselect row, then save
    await page.locator(".o_form_sheet").click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);
    await odoo.saveForm();

    // Verify we have at least one order line
    const lineCount = await page.locator(
      ".o_field_widget[name='order_line'] .o_data_row"
    ).count();
    expect(lineCount).toBeGreaterThanOrEqual(1);
    await odoo.checkpoint("sales-wf-02-with-lines");

    // Confirm the SO
    await odoo.clickStatusBarButton("Confirm");
    await odoo.confirmDialog();
    await page.waitForTimeout(1000);

    // Get SO details
    soName = await odoo.getFieldValue("name");
    soId = await odoo.getCurrentRecordId();
    expect(soName).toBeTruthy();
    expect(soId).toBeGreaterThan(0);
    await odoo.checkpoint("sales-wf-03-confirmed");

    // RPC: verify state
    const so = await rpc.read("sale.order", [soId], ["state"]);
    expect(so[0].state).toBe("sale");
  });

  test("verify delivery order created", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "sale", "stock");
    test.skip(!soId, "No SO from previous step");

    await page.goto(`/odoo/sales/${soId}`);
    await odoo.waitForLoaded();

    // Check delivery smart button (Odoo 19 may use different class names)
    const deliveryBtn = page.locator("button, .oe_stat_button, a")
      .filter({ hasText: /Delivery|Shipment|Transfer/i });
    await expect(deliveryBtn.first()).toBeVisible({ timeout: 10_000 });
    await deliveryBtn.first().click();
    await odoo.waitForLoaded();
    await odoo.checkpoint("sales-wf-04-delivery");

    // RPC: verify picking exists
    const so = await rpc.read("sale.order", [soId], ["name"]);
    const pickings = await rpc.searchRead(
      "stock.picking",
      [["origin", "=", so[0].name]],
      ["id", "state"]
    );
    expect(pickings.length).toBeGreaterThan(0);
  });
});
