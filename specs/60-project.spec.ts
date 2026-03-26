import { test, expect } from "../fixtures/workflow";

test.describe("Project: Task Workflow", () => {
  test("create project and task, verify in UI", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "project");
    const ts = Date.now();

    // Create project + task via RPC
    const projectId = await rpc.create("project.project", {
      name: `E2E Project ${ts}`,
    });
    const taskId = await rpc.create("project.task", {
      name: `E2E Task ${ts}`,
      project_id: projectId,
    });

    // Navigate to the project's task list
    await page.goto(`/odoo/project/${projectId}`);
    await odoo.waitForLoaded();
    await odoo.checkpoint("project-wf-01-tasks");

    // Verify project view loaded (kanban or list of tasks)
    await expect(page.locator(".o_content")).toBeVisible();

    // RPC verify
    const proj = await rpc.read("project.project", [projectId], ["name"]);
    expect(proj[0].name).toContain(`E2E Project ${ts}`);
    const task = await rpc.read("project.task", [taskId], ["name", "project_id"]);
    expect(task[0].name).toContain(`E2E Task ${ts}`);
  });
});
