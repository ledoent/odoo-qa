import { test, expect } from "../fixtures/workflow";

/**
 * QuickBooks Online import — three-phase commit (pull → review → commit)
 * with stub fallback when intuit-oauth/python-quickbooks aren't installed
 * (typical CI base image).
 *
 * Module gate: farm_quickbooks_io
 * Pack: ledoent/farm-pack
 */

test.describe("Farm: QuickBooks import", () => {
  test("stub-mode pull creates mappings; commit creates accounts; rollback reverses", async ({
    odoo,
    rpc,
  }) => {
    odoo.skipUnless(test, "farm_quickbooks_io");
    const ts = Date.now();

    const connectionId = await rpc.create("farm.qbo.connection", {
      environment: "sandbox",
      realm_id: `STUB_${ts}`,
    });

    const importId = await rpc.create("farm.qbo.import", {
      connection_id: connectionId,
      include_coa: true,
      include_partners: false,
      include_products: false,
    });

    await rpc.call("farm.qbo.import", "action_run_pull", [[importId]]);

    const after = await rpc.read("farm.qbo.import", [importId], [
      "state",
      "mapping_count",
    ]);
    expect(after[0].state).toBe("review");
    expect(after[0].mapping_count).toBeGreaterThan(0);

    const accountCountBefore = await rpc.search_count("account.account", []);
    await rpc.call("farm.qbo.import", "action_commit", [[importId]]);
    const accountCountAfter = await rpc.search_count("account.account", []);
    expect(accountCountAfter).toBeGreaterThan(accountCountBefore);

    const committed = await rpc.read("farm.qbo.import", [importId], ["state"]);
    expect(committed[0].state).toBe("committed");

    // Roll back
    await rpc.call("farm.qbo.import", "action_rollback", [[importId]]);
    const rolledBack = await rpc.read("farm.qbo.import", [importId], [
      "state",
    ]);
    expect(rolledBack[0].state).toBe("rolled_back");
  });

  test("wizard kicks off an import and lands on the review screen", async ({
    odoo,
    rpc,
  }) => {
    odoo.skipUnless(test, "farm_quickbooks_io");
    const ts = Date.now();
    const connectionId = await rpc.create("farm.qbo.connection", {
      environment: "sandbox",
      realm_id: `WIZ_${ts}`,
    });
    const wizardId = await rpc.create("farm.qbo.import.wizard", {
      connection_id: connectionId,
      lookback_months: "3",
      include_partners: false,
      include_products: false,
      include_transactions: false,
    });
    const action = await rpc.call(
      "farm.qbo.import.wizard",
      "action_start",
      [[wizardId]],
    );
    const importRec = await rpc.read("farm.qbo.import", [action.res_id], [
      "state",
      "lookback_months",
    ]);
    expect(importRec[0].state).toBe("review");
    expect(importRec[0].lookback_months).toBe("3");
  });
});
