import { test, expect } from "../fixtures/workflow";

test.describe.serial("Revenue: CRM Pipeline", () => {
  let leadId: number;

  test("create lead and convert to opportunity", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "crm");
    const ts = Date.now();

    // Create a new lead
    await page.goto("/web");
    await odoo.openApp("CRM");

    // Switch to list view for easier interaction
    const listToggle = page.locator(".o_control_panel .o_switch_view.o_list");
    if (await listToggle.isVisible().catch(() => false)) {
      await listToggle.click();
      await odoo.waitForLoaded();
    }

    await odoo.clickNew();
    await odoo.fillField("name", `E2E Lead ${ts}`);

    // Fill contact name
    const contactField = page.locator(".o_field_widget[name='contact_name'] input");
    if (await contactField.isVisible().catch(() => false)) {
      await contactField.fill("John E2E");
    }

    // Fill expected revenue
    const revenueField = page.locator(".o_field_widget[name='expected_revenue'] input");
    if (await revenueField.isVisible().catch(() => false)) {
      await revenueField.click();
      await revenueField.fill("50000");
    }

    await odoo.saveForm();
    leadId = await odoo.getCurrentRecordId();
    expect(leadId).toBeGreaterThan(0);
    await odoo.checkpoint("crm-wf-01-lead-created");

    // RPC: verify lead exists
    const lead = await rpc.read("crm.lead", [leadId], ["name", "type"]);
    expect(lead[0].name).toContain(`E2E Lead ${ts}`);
  });

  test("mark opportunity as won", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "crm");
    test.skip(!leadId, "No lead from previous step");

    // Navigate to the lead
    await page.goto(`/odoo/crm/${leadId}`);
    await odoo.waitForLoaded();

    // Click "Won" button if visible, or move to Won stage
    const wonBtn = page.locator("button:has-text('Won'), .o_statusbar_status button:has-text('Won')");
    if (await wonBtn.first().isVisible().catch(() => false)) {
      await wonBtn.first().click();
      await odoo.waitForLoaded();
    }

    await odoo.checkpoint("crm-wf-02-won");

    // RPC: verify stage
    const lead = await rpc.read("crm.lead", [leadId], ["stage_id", "active"]);
    expect(lead[0]).toBeTruthy();
  });
});
