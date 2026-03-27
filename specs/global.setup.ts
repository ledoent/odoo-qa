import { test as setup } from "@playwright/test";

const user = process.env.ODOO_USER || "admin";
const password = process.env.ODOO_PASSWORD || "admin";
const db = process.env.ODOO_DB || "";

setup("authenticate", async ({ page }) => {
  // Use db param to bypass database selector on multi-DB instances
  const loginUrl = db ? `/web/login?db=${db}` : "/web/login";
  await page.goto(loginUrl);

  // If we still land on the DB selector, click the first database link
  const dbLink = page.locator(".o_database_list .list-group-item a").first();
  if (await dbLink.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await dbLink.click();
    await page.waitForTimeout(2_000);
  }

  await page.getByLabel("Email").fill(user);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/(web|odoo)/, { timeout: 30_000 });
  await page.locator(".o_main_navbar").waitFor({ state: "visible", timeout: 30_000 });
  await page.context().storageState({ path: ".auth/session.json" });
});
