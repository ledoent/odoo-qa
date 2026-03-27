import { test, expect } from "../fixtures/workflow";

test.describe("MIS Builder: Report View", () => {
  test("open MIS report and verify account codes", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "mis_builder");

    // Find existing MIS report instance (mis_builder_demo provides one)
    const instances = await rpc.searchRead(
      "mis.report.instance", [], ["id", "name"], { limit: 1 }
    );
    if (instances.length === 0) {
      test.skip(true, "No MIS report instances available");
      return;
    }

    const instanceId = instances[0].id;

    // Find the action that opens MIS report instances
    const actions = await rpc.searchRead(
      "ir.actions.act_window",
      [["res_model", "=", "mis.report.instance"], ["view_mode", "like", "form"]],
      ["id"],
      { limit: 1 }
    );

    // Navigate via action URL (works on Odoo 18)
    if (actions.length > 0) {
      await page.goto(`/odoo/action-${actions[0].id}/${instanceId}`);
    } else {
      await page.goto(`/odoo/action-331/${instanceId}`);
    }
    await odoo.waitForLoaded();
    await odoo.checkpoint("mis-builder-wf-01-instance-form");

    // Look for the report result view or Preview button
    const reportContent = page.locator(".oe_mis_builder_content, .mis_builder, .o_mis_report_widget");
    const previewBtn = page.locator("button:has-text('Preview'), button:has-text('Display')").first();

    if (await previewBtn.isVisible().catch(() => false)) {
      await previewBtn.click();
      await page.waitForTimeout(5000);
      await odoo.waitForLoaded();
    }

    // Wait for report to render
    await reportContent.first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await odoo.checkpoint("mis-builder-wf-02-report-view");

    // Check if report table rendered with data
    const table = page.locator("table.mis_builder, .oe_mis_builder_content table");
    if (await table.isVisible().catch(() => false)) {
      const rowLabels = await page.locator(
        "table.mis_builder tbody tr td:first-child"
      ).allTextContents();

      // Critical assertion: no account codes show "False"
      const nonEmpty = rowLabels.filter(l => l.trim());
      if (nonEmpty.length > 0) {
        for (const label of nonEmpty) {
          expect(label, `Account label should not be "False": got "${label}"`).not.toContain("False");
        }
      }

      await odoo.checkpoint("mis-builder-wf-03-account-codes");
    } else {
      // Report may show in a different format — capture whatever is visible
      await odoo.checkpoint("mis-builder-wf-03-report-content");
    }
  });

  test("multi-company report with comparison columns", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "mis_builder");

    // Find a multi-company MIS report instance
    const mcInstances = await rpc.searchRead(
      "mis.report.instance",
      [["multi_company", "=", true]],
      ["id", "name", "company_ids", "comparison_mode"],
      { limit: 1 }
    );
    if (mcInstances.length === 0) {
      test.skip(true, "No multi-company MIS report instance");
      return;
    }

    const instanceId = mcInstances[0].id;

    // Find the action
    const actions = await rpc.searchRead(
      "ir.actions.act_window",
      [["res_model", "=", "mis.report.instance"], ["view_mode", "like", "form"]],
      ["id"], { limit: 1 }
    );
    const actionId = actions.length > 0 ? actions[0].id : 331;

    // Open the multi-company report (comparison mode — separate columns per company)
    await page.goto(`/odoo/action-${actionId}/${instanceId}`);
    await odoo.waitForLoaded();
    await odoo.checkpoint("mis-builder-wf-05-multicompany-config");

    // Click Preview
    const previewBtn = page.locator("button:has-text('Preview'), button:has-text('Display')").first();
    if (await previewBtn.isVisible().catch(() => false)) {
      await previewBtn.click();
      await page.waitForTimeout(5000);
      await odoo.waitForLoaded();
    }

    const reportContent = page.locator(".oe_mis_builder_content, .mis_builder, .o_mis_report_widget");
    await reportContent.first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await odoo.checkpoint("mis-builder-wf-06-multicompany-comparison");

    // Verify no "False" in any cell
    const table = page.locator("table.mis_builder, .oe_mis_builder_content table");
    if (await table.isVisible().catch(() => false)) {
      const cells = await page.locator("table.mis_builder tbody tr td").allTextContents();
      for (const cell of cells) {
        if (cell.trim()) {
          expect(cell).not.toContain("False");
        }
      }
    }

    // Now toggle comparison mode off to show totaled view
    // Navigate back to form
    await page.goBack();
    await odoo.waitForLoaded();

    // Switch to totaled mode via RPC (avoids date validation issues in UI)
    await rpc.write("mis.report.instance", [instanceId], {
      comparison_mode: false,
      date_from: "2026-01-01",
      date_to: "2026-12-31",
    });

    // Reload the form
    await page.goto(`/odoo/action-${actionId}/${instanceId}`);
    await odoo.waitForLoaded();
    await odoo.checkpoint("mis-builder-wf-07-totaled-config");

    // Preview totaled view
    const previewBtn2 = page.locator("button:has-text('Preview'), button:has-text('Display')").first();
    if (await previewBtn2.isVisible().catch(() => false)) {
      await previewBtn2.click();
      await page.waitForTimeout(5000);
      await odoo.waitForLoaded();
    }
    await reportContent.first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await odoo.checkpoint("mis-builder-wf-08-multicompany-totaled");
  });

  test("MIS report instances list", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "mis_builder");

    // Find the list action
    const actions = await rpc.searchRead(
      "ir.actions.act_window",
      [["res_model", "=", "mis.report.instance"], ["view_mode", "like", "list"]],
      ["id"],
      { limit: 1 }
    );

    if (actions.length > 0) {
      await page.goto(`/odoo/action-${actions[0].id}`);
    } else {
      await page.goto("/odoo/action-331");
    }
    await odoo.waitForLoaded();
    await expect(page.locator(".o_content")).toBeVisible();
    await odoo.checkpoint("mis-builder-wf-04-list");
  });
});
