import { test, expect } from "../fixtures/workflow";

test.describe("Events: Event Management", () => {
  test("create event", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "event");
    const ts = Date.now();

    // Create event via RPC
    const eventId = await rpc.create("event.event", {
      name: `E2E Event ${ts}`,
      date_begin: new Date().toISOString().replace("T", " ").slice(0, 19),
      date_end: new Date(Date.now() + 86400000).toISOString().replace("T", " ").slice(0, 19),
    });

    await page.goto("/web");
    await odoo.openApp("Events");
    await odoo.waitForLoaded();
    await odoo.checkpoint("events-wf-01-list");

    // Navigate to the event
    await odoo.switchToListView();
    await odoo.checkpoint("events-wf-02-event");

    // RPC verify
    const event = await rpc.read("event.event", [eventId], ["name"]);
    expect(event[0].name).toContain(`E2E Event ${ts}`);
  });
});
