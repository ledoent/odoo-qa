import { test, expect } from "../fixtures/workflow";

test.describe("HR: Employee Management", () => {
  test("create an employee", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "hr");
    const ts = Date.now();

    await page.goto("/web");
    await odoo.openApp("Employees");
    await odoo.clickNew();

    await odoo.fillField("name", `E2E Employee ${ts}`);

    // Fill job title if visible
    const jobTitle = page.locator(".o_field_widget[name='job_title'] input");
    if (await jobTitle.isVisible().catch(() => false)) {
      await jobTitle.fill("QA Tester");
    }

    await odoo.saveForm();
    const empId = await odoo.getCurrentRecordId();
    expect(empId).toBeGreaterThan(0);
    await odoo.checkpoint("hr-wf-01-employee-created");

    // RPC: verify
    const emp = await rpc.read("hr.employee", [empId], ["name"]);
    expect(emp[0].name).toContain(`E2E Employee ${ts}`);
  });
});
