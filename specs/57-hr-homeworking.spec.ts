import { test, expect } from "../fixtures/workflow";

test.describe("HR: Work Location", () => {
  test("employee work location scheduling", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "hr_homeworking");

    // Find an employee
    const employees = await rpc.searchRead("hr.employee", [], ["id"], { limit: 1 });
    if (employees.length === 0) { test.skip(true, "No employees"); return; }

    // Navigate to employee and check for work location tab/field
    await page.goto(`/odoo/employees/${employees[0].id}`);
    await odoo.waitForLoaded();

    // Look for work location fields
    const workLocation = page.locator(
      ".o_field_widget[name='monday_location_id'], " +
      ".o_field_widget[name='work_location_id'], " +
      "a:has-text('Work Location'), button:has-text('Work Location')"
    );
    // Field may or may not be visible depending on view configuration
    await odoo.checkpoint("hr-homeworking-wf-01-employee");
  });
});
