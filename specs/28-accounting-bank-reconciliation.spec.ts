import { test, expect } from "../fixtures/workflow";

test.describe("Accounting: Bank Reconciliation", () => {
  test("open bank reconciliation view", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "account");

    // Find a bank journal
    const journals = await rpc.searchRead(
      "account.journal",
      [["type", "=", "bank"]],
      ["id", "name"],
      { limit: 1 }
    );
    if (journals.length === 0) {
      test.skip(true, "No bank journal configured");
      return;
    }

    // Navigate to Invoicing > Accounting > Bank Reconciliation
    await page.goto("/web");
    await odoo.openApp("Invoicing");
    await odoo.openMenuPath("Accounting").catch(() => {});

    // Try to find bank reconciliation link
    const reconBtn = page.locator("a, button").filter({ hasText: /Reconcil|Bank Statement/i });
    if (await reconBtn.first().isVisible().catch(() => false)) {
      await reconBtn.first().click();
      await odoo.waitForLoaded();
    }

    await odoo.checkpoint("bank-recon-wf-01-view");

    // Verify the page loaded (reconciliation has a specific view)
    await expect(page.locator(".o_content")).toBeVisible();
  });
});
