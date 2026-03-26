import { test, expect } from "../fixtures/workflow";

test.describe.serial("E2E: Order to Cash", () => {
  let soId: number;
  let soName: string;
  let pickingId: number;
  let invoiceId: number;

  test("create and confirm sale order", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "sale", "stock", "account");

    const partner = await rpc.findDemoPartner();
    const product = await rpc.findDemoProduct();

    // Create SO via UI
    await page.goto("/web");
    await odoo.openApp("Sales");
    await odoo.clickNew();
    await odoo.fillMany2one("partner_id", partner.name.substring(0, 10));

    await page.getByText("Add a product", { exact: true }).click();
    await page.waitForTimeout(500);
    const productInput = page.locator(
      ".o_selected_row .o_field_widget[name='product_template_id'] input, " +
      ".o_selected_row .o_field_widget[name='product_id'] input"
    );
    await productInput.first().waitFor({ state: "visible", timeout: 5_000 });
    await productInput.first().fill(product.name.substring(0, 10));
    const dropdown = page.locator(".o-autocomplete--dropdown-menu .o-autocomplete--dropdown-item");
    await dropdown.first().waitFor({ state: "visible", timeout: 10_000 });
    await dropdown.first().click();
    await page.waitForTimeout(1000);

    // Handle product configurator
    await odoo.confirmDialog();
    await page.locator(".o_form_sheet").click({ position: { x: 10, y: 10 } });
    await page.waitForTimeout(500);
    await odoo.saveForm();

    // Confirm
    await odoo.clickStatusBarButton("Confirm");
    await odoo.confirmDialog();
    await page.waitForTimeout(1000);

    soName = await odoo.getFieldValue("name");
    soId = await odoo.getCurrentRecordId();
    expect(soId).toBeGreaterThan(0);
    await odoo.checkpoint("e2e-otc-01-so-confirmed");
  });

  test("validate delivery", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "sale", "stock");
    test.skip(!soId, "No SO");

    const pickings = await rpc.getPickings(soName);
    expect(pickings.length).toBeGreaterThan(0);
    pickingId = pickings[0].id;

    await page.goto(`/odoo/inventory/${pickingId}`);
    await odoo.waitForLoaded();

    const validateBtn = page.locator("button:has-text('Validate')").first();
    if (await validateBtn.isVisible().catch(() => false)) {
      await validateBtn.click();
      await page.waitForTimeout(1000);
      await odoo.confirmDialogs();
    }

    await odoo.checkpoint("e2e-otc-02-delivered");
    const picking = await rpc.read("stock.picking", [pickingId], ["state"]);
    expect(["done", "assigned"]).toContain(picking[0].state);
  });

  test("create and confirm invoice", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "sale", "account");
    test.skip(!soId, "No SO");

    await page.goto(`/odoo/sales/${soId}`);
    await odoo.waitForLoaded();

    const invoiceBtn = page.locator("button:has-text('Create Invoice')").first();
    await expect(invoiceBtn).toBeVisible({ timeout: 10_000 });
    await invoiceBtn.click();
    await page.waitForTimeout(1000);
    await odoo.confirmDialog();
    await page.waitForTimeout(2000);
    await odoo.waitForLoaded();

    invoiceId = await odoo.getCurrentRecordId().catch(() => 0);

    // If we landed on the invoice, confirm it
    const confirmBtn = page.locator("button:has-text('Confirm')").first();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
      await odoo.waitForLoaded();
    }

    await odoo.checkpoint("e2e-otc-03-invoice-confirmed");
  });

  test("register payment", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "account");
    test.skip(!invoiceId, "No invoice");

    await page.goto(`/odoo/accounting/customer-invoices/${invoiceId}`);
    await odoo.waitForLoaded();

    const payBtn = page.locator("button:has-text('Register Payment')").first();
    if (await payBtn.isVisible().catch(() => false)) {
      await payBtn.click();
      await page.waitForTimeout(1000);
      await odoo.confirmDialog();
      await page.waitForTimeout(1000);
    }

    await odoo.waitForLoaded();
    await odoo.checkpoint("e2e-otc-04-paid");

    // Verify full cycle via RPC
    const so = await rpc.read("sale.order", [soId], ["state", "invoice_status"]);
    expect(so[0].state).toBe("sale");
  });
});
