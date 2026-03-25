import { test, expect } from "../fixtures/odoo";

const SLOW_THRESHOLD_MS = 10_000;

const pages: [string, string][] = [
  ["Contacts", "/odoo/contacts"],
  ["Sales", "/odoo/sales"],
  ["Invoicing", "/odoo/customer-invoices"],
  ["Inventory", "/odoo/inventory"],
  ["CRM", "/odoo/crm"],
  ["Employees", "/odoo/employees"],
  ["Project", "/odoo/project"],
  ["Settings", "/odoo/settings"],
];

for (const [name, url] of pages) {
  test(`perf: ${name} loads within ${SLOW_THRESHOLD_MS / 1000}s`, async ({ page, odoo }) => {
    const start = Date.now();
    await page.goto(url);
    await odoo.waitForLoaded();
    const elapsed = Date.now() - start;

    test.info().annotations.push({
      type: "perf_ms",
      description: `${name}: ${elapsed}ms`,
    });

    expect(elapsed, `${name} took ${elapsed}ms`).toBeLessThan(SLOW_THRESHOLD_MS);
    await odoo.checkpoint(`perf-${name.toLowerCase().replace(/\s+/g, "-")}`);
  });
}
