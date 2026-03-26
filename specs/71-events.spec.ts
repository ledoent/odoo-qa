import { test, expect } from "../fixtures/workflow";
import { OdooRPC } from "../fixtures/odoo-rpc";

test.describe("Events: Event Management", () => {
  test("create event", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "event");
    const ts = Date.now();

    // Create event via RPC
    const eventId = await rpc.create("event.event", {
      name: `E2E Event ${ts}`,
      date_begin: OdooRPC.odooDatetime(),
      date_end: OdooRPC.odooDatetime(new Date(Date.now() + 86400000)),
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
