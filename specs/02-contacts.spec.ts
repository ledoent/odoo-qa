import { test, expect } from "../fixtures/odoo";

test.describe("Contacts", () => {
  test.beforeEach(async ({ odoo }) => odoo.skipUnless(test, "contacts"));

  test("browse contacts list", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Contacts");
    await odoo.expectView("list");
    await odoo.expectMinRecords(1);
    await odoo.checkpoint("contacts-list");
  });

  test("open a contact form", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Contacts");
    await odoo.openFirstRecord();
    await odoo.expectView("form");
    await odoo.checkpoint("contact-form");
  });

  test("search contacts", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Contacts");
    await page.locator(".o_searchview_input").fill("admin");
    await page.keyboard.press("Enter");
    await odoo.waitForLoaded();
    await odoo.expectMinRecords(1);
  });
});
