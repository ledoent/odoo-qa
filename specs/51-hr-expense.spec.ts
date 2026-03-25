import { test, expect } from "../fixtures/workflow";

test.describe("HR: Expense Workflow", () => {
  test("create and submit expense", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "hr_expense");
    const ts = Date.now();

    // Find expense product/category
    const products = await rpc.searchRead(
      "product.product",
      [["can_be_expensed", "=", true]],
      ["id", "name"],
      { limit: 1 }
    );

    // Create expense via RPC
    const expenseId = await rpc.create("hr.expense", {
      name: `E2E Expense ${ts}`,
      total_amount_currency: 150,
      product_id: products.length > 0 ? products[0].id : false,
    });
    expect(expenseId).toBeGreaterThan(0);

    // Navigate to the expense
    await page.goto(`/odoo/expenses/${expenseId}`);
    await odoo.waitForLoaded();
    await odoo.checkpoint("expense-wf-01-created");

    // Submit
    const submitBtn = page.locator(
      "button:has-text('Submit'), button:has-text('Create Report')"
    );
    if (await submitBtn.first().isVisible().catch(() => false)) {
      await submitBtn.first().click();
      await odoo.waitForLoaded();
      await odoo.confirmDialog();
    }
    await odoo.checkpoint("expense-wf-02-submitted");

    // RPC verify
    const expense = await rpc.read("hr.expense", [expenseId], ["name", "state"]);
    expect(expense[0].name).toContain(`E2E Expense ${ts}`);
  });
});
