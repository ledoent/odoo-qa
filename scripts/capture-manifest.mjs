#!/usr/bin/env node
/**
 * Capture a baseline manifest with module versions and view checksums.
 * Stored alongside baseline screenshots to detect staleness.
 *
 * Usage:
 *   ODOO_URL=http://localhost:8069 node scripts/capture-manifest.mjs > baseline-manifest.json
 *
 * Tracks:
 *   - Module installed_version (may not bump on every change)
 *   - Module write_date (updates on any ORM write)
 *   - View write_date max per module (detects XML/template changes without version bump)
 *   - Odoo server version string
 */

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
  // Detect DB
  let dbName = db;
  if (!dbName) {
    const list = await rpc("/web/database/list", {});
    if (list?.length === 1) dbName = list[0];
    else throw new Error(`Multiple databases. Set ODOO_DB.`);
  }

  // Auth
  const auth = await rpc("/web/session/authenticate", { db: dbName, login: user, password });
  if (!auth?.uid) throw new Error("Auth failed");

  // Get server version
  const serverVersion = auth.server_version || "unknown";

  // Get installed modules with versions and write dates
  const modules = await rpc("/web/dataset/call_kw", {
    model: "ir.module.module",
    method: "search_read",
    args: [[["state", "=", "installed"]]],
    kwargs: { fields: ["name", "installed_version", "write_date"], limit: 0 },
  });

  // Get max view write_date per module (detects view changes without version bump)
  const viewDates = {};
  const views = await rpc("/web/dataset/call_kw", {
    model: "ir.ui.view",
    method: "read_group",
    args: [[["active", "=", true]]],
    kwargs: {
      fields: ["write_date:max"],
      groupby: ["model"],
      limit: 0,
    },
  }).catch(() => []);

  for (const v of views) {
    if (v.model) viewDates[v.model] = v.write_date;
  }

  // Build manifest
  const manifest = {
    captured_at: new Date().toISOString(),
    odoo_version: serverVersion,
    database: dbName,
    instance_url: url,
    modules: {},
    total_modules: modules.length,
  };

  for (const mod of modules) {
    manifest.modules[mod.name] = {
      version: mod.installed_version || "0.0.0",
      write_date: mod.write_date,
    };
  }

  // Add view dates as a separate section for staleness checking
  manifest.view_dates = viewDates;

  console.log(JSON.stringify(manifest, null, 2));
}

main().catch(e => { console.error(e.message); process.exit(1); });
