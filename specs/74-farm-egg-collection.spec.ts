import { test, expect } from "../fixtures/workflow";

/**
 * Daily egg collection — homestead operator workflow.
 *
 * The morning gather: farmer creates one farm.egg.collection per coop per
 * day with total, broken, and kept-home counts. Constraint forbids
 * subcounts exceeding the total. Coop's 7-day rolling total surfaces drops
 * in lay-rate.
 *
 * Module gate: farm_egg_production
 * Pack: ledoent/farm-pack
 */

test.describe("Farm: egg collection log", () => {
  test("create coop and log a collection round-trip via RPC", async ({
    odoo,
    rpc,
  }) => {
    odoo.skipUnless(test, "farm_egg_production");
    const ts = Date.now();

    const coopId = await rpc.create("farm.coop", {
      name: `E2E Coop ${ts}`,
      capacity: 15,
      active_bird_count: 12,
    });

    const collectionId = await rpc.create("farm.egg.collection", {
      coop_id: coopId,
      collection_date: new Date().toISOString().slice(0, 10),
      count_total: 11,
      count_broken: 1,
      count_kept_home: 2,
    });

    const records = await rpc.read(
      "farm.egg.collection",
      [collectionId],
      ["count_available", "name"],
    );
    expect(records[0].count_available).toBe(8); // 11 - 1 - 2

    // 7-day rolling total propagates back to the coop
    await rpc.write("farm.coop", [coopId], {}); // trigger compute refresh path
    const coop = await rpc.read("farm.coop", [coopId], [
      "eggs_last_7_days",
    ]);
    expect(coop[0].eggs_last_7_days).toBeGreaterThanOrEqual(11);
  });

  test("constraint rejects subcounts exceeding total", async ({
    odoo,
    rpc,
  }) => {
    odoo.skipUnless(test, "farm_egg_production");
    const ts = Date.now();
    const coopId = await rpc.create("farm.coop", {
      name: `Bad Coop ${ts}`,
      active_bird_count: 5,
    });
    let raised = false;
    try {
      await rpc.create("farm.egg.collection", {
        coop_id: coopId,
        collection_date: "2030-04-15",
        count_total: 5,
        count_broken: 4,
        count_kept_home: 3, // 4 + 3 > 5 — should reject
      });
    } catch (e) {
      raised = true;
    }
    expect(raised).toBe(true);
  });

  test("one collection per coop per day is enforced", async ({
    odoo,
    rpc,
  }) => {
    odoo.skipUnless(test, "farm_egg_production");
    const ts = Date.now();
    const coopId = await rpc.create("farm.coop", {
      name: `Unique Coop ${ts}`,
      active_bird_count: 5,
    });
    await rpc.create("farm.egg.collection", {
      coop_id: coopId,
      collection_date: "2030-05-01",
      count_total: 5,
    });
    let raised = false;
    try {
      await rpc.create("farm.egg.collection", {
        coop_id: coopId,
        collection_date: "2030-05-01",
        count_total: 6,
      });
    } catch (e) {
      raised = true;
    }
    expect(raised).toBe(true);
  });
});
