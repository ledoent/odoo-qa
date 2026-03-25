import { test, expect } from "../fixtures/odoo";

test.describe("Website", () => {
  test.beforeEach(async ({ odoo }) => odoo.skipUnless(test, "website"));

  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    expect(await page.evaluate(() => document.readyState)).toBe("complete");
  });

  test("contact page", async ({ page, odoo }) => {
    await page.goto("/contactus");
    await expect(page.locator("body")).toBeVisible();
    await odoo.checkpoint("website-contact");
  });
});
