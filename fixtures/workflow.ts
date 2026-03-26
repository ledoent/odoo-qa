/**
 * Extended test fixture for workflow E2E tests.
 * Adds form interaction helpers and RPC backend access.
 */

import { test as base, expect, Page } from "@playwright/test";
import { OdooPage } from "./odoo";
import { OdooRPC } from "./odoo-rpc";

// Odoo-specific selectors extracted for reuse
const S = {
  field: (name: string) =>
    `.o_field_widget[name="${name}"]`,
  fieldInput: (name: string) =>
    `.o_field_widget[name="${name}"] input, .o_field_widget[name="${name}"] textarea`,
  autocompleteItem:
    ".o-autocomplete--dropdown-menu .o-autocomplete--dropdown-item, .o_m2o_dropdown_option",
  statusBarButton: (text: string) =>
    `.o_statusbar_buttons button:has-text("${text}")`,
  modal: ".modal-dialog",
  modalPrimary:
    ".modal-footer .btn-primary, .modal-footer button:has-text('Ok'), .modal-footer button:has-text('Apply'), .modal-footer button:has-text('Confirm')",
};

export class WorkflowPage extends OdooPage {
  constructor(page: Page) {
    super(page);
  }

  /** Fill a char/text field in the current form */
  async fillField(fieldName: string, value: string) {
    const field = this.page.locator(S.fieldInput(fieldName));
    await field.first().waitFor({ state: "visible", timeout: 5_000 });
    await field.first().click();
    await field.first().fill(value);
  }

  /** Fill a many2one field — types value and selects first autocomplete result */
  async fillMany2one(fieldName: string, value: string) {
    const input = this.page.locator(S.fieldInput(fieldName));
    await input.first().waitFor({ state: "visible", timeout: 5_000 });
    await input.first().click();
    await input.first().fill(value);
    const item = this.page.locator(S.autocompleteItem).first();
    await item.waitFor({ state: "visible", timeout: 10_000 });
    await item.click();
    await this.page.waitForTimeout(300);
  }

  /** Fill a numeric field */
  async fillNumericField(fieldName: string, value: number) {
    const input = this.page.locator(S.fieldInput(fieldName));
    await input.first().waitFor({ state: "visible", timeout: 5_000 });
    await input.first().click();
    await input.first().fill(String(value));
  }

  /** Click "Add a line" in a one2many field */
  async addOne2manyLine(fieldName: string) {
    await this.page.locator(
      `${S.field(fieldName)} .o_field_x2many_list_row_add a, ${S.field(fieldName)} a:has-text("Add a line")`
    ).first().click();
    await this.page.waitForTimeout(300);
  }

  /** Click a status bar button (Confirm, Validate, etc.) */
  async clickStatusBarButton(name: string) {
    await this.page.locator(S.statusBarButton(name)).first().click();
    await this.waitForLoaded();
  }

  /** Click a smart/stat button by text */
  async clickSmartButton(name: string | RegExp) {
    const btn = this.page.locator(".oe_button_box .oe_stat_button, button, a")
      .filter({ hasText: name });
    await btn.first().click();
    await this.waitForLoaded();
  }

  /** Read a field value from the current form */
  async getFieldValue(fieldName: string): Promise<string> {
    const widget = this.page.locator(S.field(fieldName));
    const input = widget.locator("input");
    if (await input.count() > 0 && await input.first().isVisible()) {
      return (await input.first().inputValue()) || "";
    }
    return (await widget.first().textContent()) || "";
  }

  /** Get the current record ID from the URL (saves first if still on /new) */
  async getCurrentRecordId(): Promise<number> {
    let url = this.page.url();
    if (url.includes("/new")) {
      await this.saveForm();
      await this.page.waitForTimeout(1000);
      url = this.page.url();
    }
    // /odoo/sales/123 pattern
    let match = url.match(/\/(\d+)(?:\?|$|#)/);
    if (match) return parseInt(match[1]);
    // #id=123 pattern
    match = url.match(/[#&]id=(\d+)/);
    if (match) return parseInt(match[1]);
    // DOM fallback
    const domId = await this.page.evaluate(
      () => document.querySelector(".o_form_view")?.getAttribute("data-res-id")
    ).catch(() => null);
    if (domId && domId !== "null") return parseInt(domId);
    throw new Error(`Could not parse record ID from URL: ${url}`);
  }

  /** Dismiss a modal dialog by clicking its primary/confirm button. No-op if no modal visible. */
  async confirmDialog() {
    const modal = this.page.locator(S.modal);
    if (!await modal.isVisible().catch(() => false)) return;
    await modal.locator(S.modalPrimary).first().click();
    await this.waitForLoaded();
  }

  /** Dismiss up to N modal dialogs in sequence (e.g. Immediate Transfer + backorder) */
  async confirmDialogs(maxCount = 3) {
    for (let i = 0; i < maxCount; i++) {
      const modal = this.page.locator(S.modal);
      if (!await modal.isVisible().catch(() => false)) break;
      await modal.locator(S.modalPrimary).first().click();
      await this.page.waitForTimeout(1000);
    }
    await this.waitForLoaded();
  }

  /** Save the current form */
  async saveForm() {
    const saveBtn = this.page.locator(
      ".o_form_button_save, .o_control_panel button:has-text('Save')"
    );
    if (await saveBtn.isVisible().catch(() => false)) {
      await saveBtn.click();
      await this.waitForLoaded();
    }
    await this.page.waitForTimeout(500);
  }

  /** Switch to list view */
  async switchToListView() {
    const btn = this.page.locator(".o_control_panel .o_switch_view.o_list");
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      await this.waitForLoaded();
    }
  }

  /** Navigate to a report from the Reporting menu */
  async openReport(reportName: string) {
    await this.openMenuPath("Reporting", reportName);
  }

  /** Click the "New" button in control panel */
  async clickNew() {
    await this.page.locator(
      ".o_control_panel button:has-text('New'), .o_control_panel .o_list_button_add"
    ).first().click();
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
