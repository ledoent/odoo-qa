import { test, expect } from "../fixtures/odoo";

test.describe("CRM", () => {
  test.beforeEach(async ({ odoo }) => odoo.skipUnless(test, "crm"));

  test("pipeline", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("CRM");
    await odoo.waitForLoaded();
    await expect(page.locator(".o_kanban_view, .o_list_view")).toBeVisible();
    await odoo.checkpoint("crm-pipeline");
  });

  test("leads list", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("CRM");
    await odoo.waitForLoaded();
    const listToggle = page.locator(".o_control_panel .o_switch_view.o_list");
    if (await listToggle.isVisible()) {
      await listToggle.click();
      await odoo.waitForLoaded();
    }
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("crm-leads");
  });

  test("open opportunity", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("CRM");
    await odoo.waitForLoaded();
    const listToggle = page.locator(".o_control_panel .o_switch_view.o_list");
    if (await listToggle.isVisible()) {
      await listToggle.click();
      await odoo.waitForLoaded();
    }
    const rows = await page.locator(".o_data_row").count();
    if (rows > 0) {
      await odoo.openFirstRecord();
      await odoo.expectView("form");
      await odoo.checkpoint("crm-opportunity");
    } else {
      const card = page.locator(".o_kanban_record").first();
      if (await card.isVisible()) {
        await card.click();
        await odoo.waitForLoaded();
        await odoo.checkpoint("crm-opportunity");
      }
    }
  });
});
