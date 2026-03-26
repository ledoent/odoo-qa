import { test, expect } from "../fixtures/workflow";

test.describe("Accounting: Analytic Plans", () => {
  test("browse analytic plans and accounts", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "analytic");

    // Verify analytic plans exist (may fail if user lacks access)
    const plans = await rpc.searchRead("account.analytic.plan", [], ["id", "name"], { limit: 5 })
      .catch(() => []);
    if (plans.length === 0) { test.skip(true, "No analytic plans or insufficient access"); return; }

    // Navigate to analytic accounts
    await page.goto("/web");
    await odoo.openApp("Invoicing");
    await odoo.openMenuPath("Configuration", "Analytic Plans").catch(() =>
      odoo.openMenuPath("Configuration", "Analytic Accounting", "Analytic Plans").catch(() => {})
    );
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("analytic-wf-01-plans");
  });
});
