import { test, expect } from "../fixtures/workflow";

test.describe("Maintenance: Request Workflow", () => {
  test("create maintenance request", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "maintenance");
    const ts = Date.now();

    // Create request via RPC
    const requestId = await rpc.create("maintenance.request", {
      name: `E2E Maintenance ${ts}`,
    });

    await page.goto("/web");
    await odoo.openApp("Maintenance");
    await odoo.waitForLoaded();

    // Switch to list view to find our request
    await odoo.switchToListView();
    await odoo.checkpoint("maintenance-wf-01-list");

    // RPC verify
    const req = await rpc.read("maintenance.request", [requestId], ["name", "stage_id"]);
    expect(req[0].name).toContain(`E2E Maintenance ${ts}`);
  });
});
