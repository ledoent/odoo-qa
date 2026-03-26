import { test, expect } from "../fixtures/workflow";
import { OdooRPC } from "../fixtures/odoo-rpc";

test.describe("Calendar: Event Scheduling", () => {
  test("create calendar event", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "calendar");
    const ts = Date.now();

    // Create calendar event via RPC
    const eventId = await rpc.create("calendar.event", {
      name: `E2E Meeting ${ts}`,
      start: OdooRPC.odooDatetime(),
      stop: OdooRPC.odooDatetime(new Date(Date.now() + 3600000)),
    });

    await page.goto("/web");
    await odoo.openApp("Calendar");
    await odoo.waitForLoaded();
    await odoo.checkpoint("calendar-wf-01-view");

    // RPC verify
    const event = await rpc.read("calendar.event", [eventId], ["name"]);
    expect(event[0].name).toContain(`E2E Meeting ${ts}`);
  });
});
