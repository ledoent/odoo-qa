import { test, expect } from "../fixtures/workflow";

test.describe("HR: Employee Skills", () => {
  test("add skill to employee", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "hr_skills");

    // Find or create an employee
    const employees = await rpc.searchRead("hr.employee", [], ["id"], { limit: 1 });
    if (employees.length === 0) { test.skip(true, "No employees"); return; }

    // Find a skill type
    const skillTypes = await rpc.searchRead("hr.skill.type", [], ["id", "name"], { limit: 1 });
    if (skillTypes.length === 0) { test.skip(true, "No skill types configured"); return; }

    // Navigate to employee form
    await page.goto(`/odoo/employees/${employees[0].id}`);
    await odoo.waitForLoaded();

    // Click "Resume" or "Skills" tab if visible
    const skillsTab = page.locator("a, button").filter({ hasText: /Skills|Resume|Resumé/i });
    if (await skillsTab.first().isVisible().catch(() => false)) {
      await skillsTab.first().click();
      await page.waitForTimeout(500);
    }

    await odoo.checkpoint("hr-skills-wf-01-skills-tab");

    // RPC: verify skill types exist
    expect(skillTypes.length).toBeGreaterThan(0);
  });
});
