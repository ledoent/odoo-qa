import { test as base, expect, Page } from "@playwright/test";
import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve } from "path";

// --- Module detection cache ---

const CACHE_PATH = resolve(__dirname, "../.cache/modules.json");

function getInstalledModules(): Record<string, boolean> {
  if (existsSync(CACHE_PATH)) {
    return JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
  }
  try {
    const out = execSync("node scripts/detect-modules.mjs", {
      cwd: resolve(__dirname, ".."),
      env: process.env,
      encoding: "utf-8",
      timeout: 30_000,
    });
    const modules = JSON.parse(out);
    mkdirSync(resolve(__dirname, "../.cache"), { recursive: true });
    writeFileSync(CACHE_PATH, JSON.stringify(modules));
    return modules;
  } catch {
    return {};
  }
}

let _modules: Record<string, boolean> | null = null;

function modules(): Record<string, boolean> {
  if (!_modules) _modules = getInstalledModules();
  return _modules;
}

// --- Odoo page helper ---

export class OdooPage {
  constructor(protected page: Page) {}

  /** Skip the current test if any of the given modules are not installed */
  skipUnless(test: typeof base, ...moduleNames: string[]) {
    const mods = modules();
    if (Object.keys(mods).length === 0) return;
    for (const mod of moduleNames) {
      if (!mods[mod]) {
        test.skip(true, `Module '${mod}' not installed`);
        return;
      }
    }
  }

  /** Navigate to an Odoo app by its display name */
  async openApp(name: string) {
    await this.page.locator(".o_navbar_apps_menu button").click();
    const app = this.page.locator("a.o_app").filter({
      hasText: new RegExp(`^${name}$`, "i"),
    });
    await app.first().waitFor({ state: "visible" });
    await app.first().click();
    await this.waitForLoaded();
  }

  /** Navigate through a menu path (e.g. openMenuPath("Orders", "Orders")) */
  async openMenuPath(...itemNames: string[]) {
    for (const name of itemNames) {
      const item = this.page
        .locator(".o_menu_sections")
        .getByRole("menuitem", { name: new RegExp(name, "i") })
        .first();
      await item.click();
    }
    await this.waitForLoaded();
  }

  /** Wait for Odoo views to finish loading */
  async waitForLoaded() {
    await this.page
      .locator(".o_loading")
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => {});
    await this.page
      .locator(".o_content, .o_action")
      .first()
      .waitFor({ state: "visible", timeout: 15_000 });
    await this.page.waitForTimeout(500);
  }

  /** Click a button in the control panel or form */
  async clickButton(name: string) {
    await this.page
      .locator(".o_control_panel, .o_form_view, .modal-dialog")
      .getByRole("button", { name })
      .first()
      .click();
    await this.waitForLoaded();
  }

  /** Open the first record in a list view */
  async openFirstRecord() {
    await this.page.locator(".o_data_row").first().click();
    await this.waitForLoaded();
  }

  /** Assert the current view type */
  async expectView(type: "list" | "form" | "kanban") {
    await expect(this.page.locator(`.o_${type}_view`)).toBeVisible();
  }

  /** Count records visible in list/kanban */
  async recordCount(): Promise<number> {
    return this.page.locator(".o_data_row").count();
  }

  /** Assert at least N records visible */
  async expectMinRecords(n: number) {
    expect(await this.recordCount()).toBeGreaterThanOrEqual(n);
  }

  /** Take a named checkpoint screenshot */
  async checkpoint(name: string) {
    await this.page.screenshot({
      path: `test-results/checkpoints/${name}.png`,
      fullPage: true,
    });
  }
}

export const test = base.extend<{ odoo: OdooPage }>({
  odoo: async ({ page }, use) => {
    await use(new OdooPage(page));
  },
});

export { expect };
