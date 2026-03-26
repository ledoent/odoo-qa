#!/usr/bin/env node
/**
 * Compare a baseline manifest against the current Odoo instance.
 * Reports which modules have changed (version or write_date).
 *
 * Usage:
 *   ODOO_URL=http://localhost:8019 node scripts/check-staleness.mjs --baseline=baseline-manifest.json
 *
 * Output: JSON report of stale/fresh modules
 */

import { readFileSync } from "fs";

const baselinePath = process.argv.find(a => a.startsWith("--baseline="))?.split("=")[1];
if (!baselinePath) {
  console.error("Usage: check-staleness.mjs --baseline=path/to/baseline-manifest.json");
  process.exit(1);
}

const url = process.env.ODOO_URL || "http://localhost:8069";
const db = process.env.ODOO_DB || "";
const user = process.env.ODOO_USER || "admin";
const password = process.env.ODOO_PASSWORD || "admin";

let cookie = "";

async function rpc(endpoint, params) {
  const headers = { "Content-Type": "application/json" };
  if (cookie) headers["Cookie"] = cookie;
  const res = await fetch(`${url}${endpoint}`, {
    method: "POST", headers, redirect: "manual",
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "call", params }),
  });
  const sc = res.headers.get("set-cookie");
  if (sc) { const m = sc.match(/session_id=[^;]+/); if (m) cookie = m[0]; }
  const data = await res.json();
  if (data.error) throw new Error(data.error.data?.message || JSON.stringify(data.error));
  return data.result;
}

async function main() {
  const baseline = JSON.parse(readFileSync(baselinePath, "utf-8"));

  // Auth to current instance
  let dbName = db;
  if (!dbName) {
    const list = await rpc("/web/database/list", {});
    if (list?.length === 1) dbName = list[0];
    else throw new Error("Multiple databases. Set ODOO_DB.");
  }
  const auth = await rpc("/web/session/authenticate", { db: dbName, login: user, password });
  if (!auth?.uid) throw new Error("Auth failed");

  // Get current modules
  const currentModules = await rpc("/web/dataset/call_kw", {
    model: "ir.module.module",
    method: "search_read",
    args: [[["state", "=", "installed"]]],
    kwargs: { fields: ["name", "installed_version", "write_date"], limit: 0 },
  });

  const currentMap = {};
  for (const mod of currentModules) {
    currentMap[mod.name] = { version: mod.installed_version, write_date: mod.write_date };
  }

  // Compare
  const report = {
    baseline_captured: baseline.captured_at,
    baseline_version: baseline.odoo_version,
    current_version: auth.server_version || "unknown",
    version_match: baseline.odoo_version === (auth.server_version || "unknown"),
    stale: [],
    fresh: [],
    new_modules: [],
    removed_modules: [],
  };

  for (const [name, base] of Object.entries(baseline.modules)) {
    const cur = currentMap[name];
    if (!cur) {
      report.removed_modules.push(name);
      continue;
    }

    const versionChanged = base.version !== cur.version;
    const dateChanged = base.write_date !== cur.write_date;

    if (versionChanged || dateChanged) {
      report.stale.push({
        module: name,
        baseline_version: base.version,
        current_version: cur.version,
        version_changed: versionChanged,
        date_changed: dateChanged,
      });
    } else {
      report.fresh.push(name);
    }
  }

  // New modules not in baseline
  for (const name of Object.keys(currentMap)) {
    if (!baseline.modules[name]) {
      report.new_modules.push(name);
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch(e => { console.error(e.message); process.exit(1); });
