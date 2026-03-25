import { test as setup } from "@playwright/test";

const user = process.env.ODOO_USER || "admin";
const password = process.env.ODOO_PASSWORD || "admin";

setup("authenticate", async ({ page }) => {
  await page.goto("/web/login");
  await page.getByLabel("Email").fill(user);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/(web|odoo)/, { timeout: 30_000 });
  await page.locator(".o_main_navbar").waitFor({ state: "visible", timeout: 30_000 });
  await page.context().storageState({ path: ".auth/session.json" });
});
