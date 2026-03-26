import { test, expect } from "../fixtures/workflow";

test.describe("Digest: KPI Emails", () => {
  test("digest configuration exists", async ({ page, odoo, rpc }) => {
    odoo.skipUnless(test, "digest");

    // Verify digest records exist
    const digests = await rpc.searchRead("digest.digest", [], ["id", "name", "state"], { limit: 5 });
    expect(digests.length).toBeGreaterThan(0);

    // Navigate to Settings > Technical > Digest Emails (or via search)
    await page.goto("/odoo/settings");
    await odoo.waitForLoaded();
    await odoo.checkpoint("digest-wf-01-settings");
  });
});
