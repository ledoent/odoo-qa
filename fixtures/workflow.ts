/**
 * Extended test fixture for workflow E2E tests.
 * Adds form interaction helpers and RPC backend access.
 */

import { test as base, expect, Page } from "@playwright/test";
import { OdooPage } from "./odoo";
import { OdooRPC } from "./odoo-rpc";

export class WorkflowPage extends OdooPage {
  constructor(page: Page) {
    super(page);
  }

  /** Fill a char/text field in the current form */
  async fillField(fieldName: string, value: string) {
    const field = this.page.locator(
      `.o_field_widget[name="${fieldName}"] input, .o_field_widget[name="${fieldName}"] textarea`
    );
    await field.first().click();
    await field.first().fill(value);
  }

  /** Fill a many2one field — types value and selects from autocomplete dropdown */
  async fillMany2one(fieldName: string, value: string) {
    const input = this.page.locator(`.o_field_widget[name="${fieldName}"] input`);
    await input.click();
    await input.fill(value);
    // Wait for autocomplete dropdown
    const dropdown = this.page.locator(
      `.o_field_widget[name="${fieldName}"] .o-autocomplete--dropdown-menu a, ` +
      `.o_field_widget[name="${fieldName}"] .dropdown-menu a, ` +
      `.o-autocomplete--dropdown-menu .o-autocomplete--dropdown-item`
    );
    await dropdown.first().waitFor({ state: "visible", timeout: 10_000 });
    await dropdown.first().click();
    await this.page.waitForTimeout(300);
  }

  /** Fill a numeric field */
  async fillNumericField(fieldName: string, value: number) {
    const input = this.page.locator(`.o_field_widget[name="${fieldName}"] input`);
    await input.click();
    await input.fill(String(value));
  }

  /** Click "Add a line" in a one2many/many2many field */
  async addOne2manyLine(fieldName: string) {
    const addLine = this.page.locator(
      `.o_field_widget[name="${fieldName}"] .o_field_x2many_list_row_add a, ` +
      `.o_field_widget[name="${fieldName}"] a:has-text("Add a line")`
    );
    await addLine.first().click();
    await this.page.waitForTimeout(300);
  }

  /** Click a status bar button (Confirm, Validate, etc.) */
  async clickStatusBarButton(name: string) {
    await this.page
      .locator(`.o_statusbar_buttons button:has-text("${name}")`)
      .first()
      .click();
    await this.waitForLoaded();
  }

  /** Click a smart button (stat button) by text */
  async clickSmartButton(name: string | RegExp) {
    const btn = typeof name === "string"
      ? this.page.locator(`.oe_button_box .oe_stat_button`).filter({ hasText: name })
      : this.page.locator(`.oe_button_box .oe_stat_button`).filter({ hasText: name });
    await btn.first().click();
    await this.waitForLoaded();
  }

  /** Read a field value from the current form */
  async getFieldValue(fieldName: string): Promise<string> {
    const widget = this.page.locator(`.o_field_widget[name="${fieldName}"]`);
    // Try input first, then span/div content
    const input = widget.locator("input");
    if (await input.count() > 0 && await input.first().isVisible()) {
      return (await input.first().inputValue()) || "";
    }
    return (await widget.first().textContent()) || "";
  }

  /** Get the current record ID from the URL */
  async getCurrentRecordId(): Promise<number> {
    const url = this.page.url();
    // Odoo 19 URL pattern: /odoo/sales/123 or /odoo/model/123
    const match = url.match(/\/(\d+)(?:\?|$|#)/);
    if (match) return parseInt(match[1]);
    // Fallback: try hash fragment #id=123
    const hashMatch = url.match(/[#&]id=(\d+)/);
    if (hashMatch) return parseInt(hashMatch[1]);
    throw new Error(`Could not parse record ID from URL: ${url}`);
  }

  /** Handle a confirmation dialog — clicks the primary/confirm button */
  async confirmDialog() {
    const dialog = this.page.locator(".modal-dialog");
    await dialog.waitFor({ state: "visible", timeout: 5_000 }).catch(() => {});
    if (await dialog.isVisible()) {
      const btn = dialog.locator(
        ".modal-footer .btn-primary, .modal-footer button:has-text('Ok'), .modal-footer button:has-text('Apply')"
      );
      await btn.first().click();
      await this.waitForLoaded();
    }
  }

  /** Save the current form (click Save button or trigger autosave) */
  async saveForm() {
    const saveBtn = this.page.locator(
      ".o_form_button_save, .o_control_panel button:has-text('Save')"
    );
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await this.waitForLoaded();
    }
    // Odoo 19 may autosave — wait for any pending saves
    await this.page.waitForTimeout(500);
  }

  /** Click the "New" button in control panel */
  async clickNew() {
    await this.page
      .locator(".o_control_panel button:has-text('New'), .o_control_panel .o_list_button_add")
      .first()
      .click();
    await this.waitForLoaded();
  }
}

// --- Test fixture ---

let _rpcInstance: OdooRPC | null = null;

export const test = base.extend<{ odoo: WorkflowPage; rpc: OdooRPC }>({
  odoo: async ({ page }, use) => {
    await use(new WorkflowPage(page));
  },
  rpc: async ({}, use) => {
    if (!_rpcInstance) {
      _rpcInstance = new OdooRPC(
        process.env.ODOO_URL || "http://localhost:8069",
        process.env.ODOO_DB || "",
        process.env.ODOO_USER || "admin",
        process.env.ODOO_PASSWORD || "admin"
      );
      await _rpcInstance.authenticate();
    }
    await use(_rpcInstance);
  },
});

export { expect };
