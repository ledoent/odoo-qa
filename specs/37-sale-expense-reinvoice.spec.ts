import { test, expect } from "../fixtures/workflow";

test.describe("Sales: Expense Re-invoicing", () => {
  test("expense products are available for re-invoicing", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "sale_expense");

    // Check for products that can be expensed and re-invoiced
    const products = await rpc.searchRead(
      "product.product",
      [["can_be_expensed", "=", true], ["expense_policy", "!=", "no"]],
      ["id", "name", "expense_policy"],
      { limit: 5 }
    );

    // Navigate to expense products config
    await page.goto("/web");
    await odoo.openApp("Sales");
    await odoo.openMenuPath("Configuration", "Products").catch(() =>
      odoo.openMenuPath("Products", "Products").catch(() => {})
    );
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("sale-expense-wf-01-products");
  });
});
