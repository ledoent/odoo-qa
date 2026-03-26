#!/usr/bin/env node
/**
 * Resolve changed modules to spec files for targeted test runs.
 *
 * Usage:
 *   # From module names directly:
 *   node scripts/resolve-specs.mjs sale stock
 *
 *   # From changed file paths (pipe from git diff):
 *   git diff --name-only origin/main | node scripts/resolve-specs.mjs --from-paths
 *
 * Output (one per line):
 *   specs/03-sales.spec.ts
 *   specs/21-revenue-sales.spec.ts
 *   ...
 *
 * Or with --grep flag, outputs a Playwright grep pattern:
 *   --grep "03-sales|21-revenue-sales|05-inventory|22-revenue"
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const mapPath = resolve(__dirname, "../specs/module-map.json");
const moduleMap = JSON.parse(readFileSync(mapPath, "utf-8"));

// Odoo module dependency graph (common dependencies for reverse lookup)
// This covers the most important cross-module relationships.
// For full accuracy, query the Odoo instance via RPC.
const REVERSE_DEPS = {
  sale: ["sale_stock", "sale_management", "sale_crm", "sale_mrp", "sale_purchase", "sale_expense"],
  account: ["sale", "purchase", "stock_account", "mrp_account"],
  stock: ["sale_stock", "purchase_stock", "stock_account"],
  purchase: ["purchase_stock", "purchase_mrp"],
  crm: ["sale_crm"],
  hr: ["hr_expense", "hr_attendance", "hr_skills", "hr_homeworking"],
  project: ["project_todo"],
  mrp: ["sale_mrp", "purchase_mrp"],
};

function extractModulesFromPaths(paths) {
  const modules = new Set();
  for (const p of paths) {
    // OCA repo structure: module_name/models/foo.py or module_name/__manifest__.py
    const parts = p.split("/");
    if (parts.length >= 2) {
      const candidate = parts[0];
      // Skip common non-module directories
      if (![".", ".github", "setup", "requirements"].includes(candidate)) {
        modules.add(candidate);
      }
    }
  }
  return [...modules];
}

function resolveSpecs(moduleNames) {
  const specs = new Set();

  // Always include core specs
  for (const s of moduleMap._always || []) specs.add(s);

  // Direct module matches
  for (const mod of moduleNames) {
    const direct = moduleMap[mod];
    if (direct) direct.forEach((s) => specs.add(s));

    // Reverse dependencies: if 'stock' changed, also run 'sale_stock' specs
    const revDeps = REVERSE_DEPS[mod] || [];
    for (const dep of revDeps) {
      const depSpecs = moduleMap[dep];
      if (depSpecs) depSpecs.forEach((s) => specs.add(s));
    }
  }

  return [...specs].sort();
}

// --- CLI ---
const args = process.argv.slice(2);
const fromPaths = args.includes("--from-paths");
const asGrep = args.includes("--grep");

let moduleNames;

if (fromPaths) {
  // Read file paths from stdin
  const input = readFileSync("/dev/stdin", "utf-8").trim();
  const paths = input.split("\n").filter(Boolean);
  moduleNames = extractModulesFromPaths(paths);
} else {
  moduleNames = args.filter((a) => !a.startsWith("--"));
}

if (moduleNames.length === 0) {
  console.error("Usage: resolve-specs.mjs <module1> [module2...] | --from-paths");
  console.error("  Modules:", Object.keys(moduleMap).filter((k) => !k.startsWith("_")).join(", "));
  process.exit(1);
}

const specs = resolveSpecs(moduleNames);

if (asGrep) {
  // Output as Playwright --grep pattern
  console.log(specs.join("|"));
} else {
  // Output as file paths
  for (const s of specs) {
    console.log(`specs/${s}.spec.ts`);
  }
}
