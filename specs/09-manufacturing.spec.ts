import { test, expect } from "../fixtures/odoo";

test.describe("Manufacturing", () => {
  test.beforeEach(async ({ odoo }) => odoo.skipUnless(test, "mrp"));

  test("MRP dashboard", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Manufacturing");
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("mrp-dashboard");
  });

  test("manufacturing orders", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Manufacturing");
    await odoo.openMenuPath("Operations", "Manufacturing Orders").catch(() => {});
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("manufacturing-orders");
  });

  test("bills of materials", async ({ page, odoo }) => {
    await page.goto("/web");
    await odoo.openApp("Manufacturing");
    await odoo.openMenuPath("Products", "Bills of Materials").catch(() => {});
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("bills-of-materials");
  });
});
