import { test, expect } from "../fixtures/workflow";

test.describe("Fleet: Vehicle Management", () => {
  test("create vehicle and log odometer", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "fleet");
    const ts = Date.now();

    // Find a vehicle model
    const models = await rpc.searchRead("fleet.vehicle.model", [], ["id", "name"], { limit: 1 });
    if (models.length === 0) { test.skip(true, "No vehicle models"); return; }

    // Create vehicle via RPC
    const vehicleId = await rpc.create("fleet.vehicle", {
      model_id: models[0].id,
      license_plate: `E2E-${ts}`,
    });

    await page.goto(`/odoo/fleet/${vehicleId}`);
    await odoo.waitForLoaded();
    await odoo.checkpoint("fleet-wf-01-vehicle");

    // Log odometer
    await rpc.create("fleet.vehicle.odometer", {
      vehicle_id: vehicleId,
      value: 15000,
    });

    // RPC verify
    const vehicle = await rpc.read("fleet.vehicle", [vehicleId], ["license_plate", "odometer"]);
    expect(vehicle[0].license_plate).toContain("E2E");
    expect(vehicle[0].odometer).toBe(15000);
  });
});
