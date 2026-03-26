import { defineConfig } from "@playwright/test";

/**
 * Odoo QA — browser smoke tests for any Odoo 18/19+ instance.
 *
 * Configure via environment variables:
 *   ODOO_URL      — base URL (default: http://localhost:8069)
 *   ODOO_USER     — login (default: admin)
 *   ODOO_PASSWORD — password (default: admin)
 *   ODOO_DB       — database name (optional, auto-selected if single DB)
 */
export default defineConfig({
  testDir: "./specs",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ["html", { open: "never", outputFolder: "test-results/report" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["list"],
  ],
  use: {
    baseURL: process.env.ODOO_URL || "http://localhost:8069",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  outputDir: "test-results/artifacts",
  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "smoke",
      testMatch: /(0[1-9]|1[0-2])-.*\.spec\.ts/,
      use: { storageState: ".auth/session.json" },
      dependencies: ["setup"],
    },
    {
      name: "workflow",
      testMatch: /[2-9]\d-.*\.spec\.ts/,
      use: { storageState: ".auth/session.json" },
      dependencies: ["setup"],
      timeout: 120_000,
    },
  ],
});
