import { test, expect } from "../fixtures/workflow";

test.describe("Project: Personal To-Do", () => {
  test("create and complete to-do", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "project_todo");
    const ts = Date.now();

    await page.goto("/web");
    await odoo.openApp("To-do");
    await odoo.waitForLoaded();
    await odoo.checkpoint("todo-wf-01-list");

    // RPC: create a to-do task
    const todoId = await rpc.create("project.task", {
      name: `E2E Todo ${ts}`,
    });

    // Refresh the view
    await page.reload();
    await odoo.waitForLoaded();
    await odoo.checkpoint("todo-wf-02-created");

    // RPC verify
    const todo = await rpc.read("project.task", [todoId], ["name"]);
    expect(todo[0].name).toContain(`E2E Todo ${ts}`);
  });
});
