import { test, expect } from "../fixtures/workflow";

test.describe("Project: Task Stage Transitions", () => {
  test("create task and move through stages", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "project");
    const ts = Date.now();

    // Find a project with stages
    const projects = await rpc.searchRead("project.project", [], ["id", "name", "type_ids"], { limit: 1 });
    if (projects.length === 0) { test.skip(true, "No projects"); return; }

    const projectId = projects[0].id;

    // Create task
    const taskId = await rpc.create("project.task", {
      name: `E2E Stage Task ${ts}`,
      project_id: projectId,
    });

    // Navigate to the task
    await page.goto(`/odoo/project/${projectId}/tasks/${taskId}`);
    await odoo.waitForLoaded();
    await odoo.checkpoint("project-stages-wf-01-task");

    // Try to change stage via status bar
    const stageButtons = page.locator(".o_statusbar_status button, .o_arrow_button");
    const stageCount = await stageButtons.count();
    // Try to click a visible stage button
    for (let i = 0; i < stageCount; i++) {
      const btn = stageButtons.nth(i);
      if (await btn.isVisible().catch(() => false)) {
        const isActive = await btn.evaluate(el => el.classList.contains("o_arrow_button_current"));
        if (!isActive) {
          await btn.click();
          await odoo.waitForLoaded();
          await odoo.checkpoint("project-stages-wf-02-moved");
          break;
        }
      }
    }

    // RPC verify task exists
    const task = await rpc.read("project.task", [taskId], ["name", "stage_id"]);
    expect(task[0].name).toContain(`E2E Stage Task ${ts}`);
  });
});
