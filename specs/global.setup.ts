import { test as setup } from "@playwright/test";

const user = process.env.ODOO_USER || "admin";
const password = process.env.ODOO_PASSWORD || "admin";
let db = process.env.ODOO_DB || "";
const baseUrl = process.env.ODOO_URL || "http://localhost:8069";

setup("authenticate", async ({ page }) => {
  // Auto-detect DB if not set — query the database list via JSON-RPC
  if (!db) {
    try {
      const res = await page.request.post(`${baseUrl}/web/database/list`, {
        data: { jsonrpc: "2.0", id: 1, method: "call", params: {} },
      });
      const data = await res.json();
      const dbs = data?.result || [];
      if (dbs.length > 0) {
        // Pick the first non-baseonly database
        db = dbs.find((d: string) => !d.endsWith("-baseonly")) || dbs[0];
      }
    } catch { /* fall through to login page */ }
  }

  // Navigate to login with db param
  const loginUrl = db ? `/web/login?db=${db}` : "/web/login";
  await page.goto(loginUrl);

  // If we still see the DB selector (no login form), click first DB link
  const emailField = page.getByLabel("Email");
  if (!await emailField.isVisible({ timeout: 3_000 }).catch(() => false)) {
    const dbLink = page.locator(".o_database_list .list-group-item a").first();
    if (await dbLink.isVisible().catch(() => false)) {
      const href = await dbLink.getAttribute("href") || "";
      // Navigate to login for that DB
      const dbName = href.match(/db=([^&]+)/)?.[1] || "";
      await page.goto(dbName ? `/web/login?db=${dbName}` : href);
      await page.waitForTimeout(2_000);
    }
  }

  await page.getByLabel("Email").fill(user);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/(web|odoo)/, { timeout: 30_000 });
  await page.locator(".o_main_navbar").waitFor({ state: "visible", timeout: 30_000 });
  await page.context().storageState({ path: ".auth/session.json" });
});
