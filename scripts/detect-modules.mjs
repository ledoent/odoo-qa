#!/usr/bin/env node
/**
 * Detect installed Odoo modules via JSON-RPC.
 * Outputs JSON: { "sale": true, "purchase": true, ... }
 *
 * Env vars: ODOO_URL, ODOO_USER, ODOO_PASSWORD, ODOO_DB
 */

const url = process.env.ODOO_URL || "http://localhost:8069";
let db = process.env.ODOO_DB || "";
const user = process.env.ODOO_USER || "admin";
const password = process.env.ODOO_PASSWORD || "admin";

let sessionCookie = "";

async function jsonrpc(endpoint, params) {
  const headers = { "Content-Type": "application/json" };
  if (sessionCookie) headers["Cookie"] = sessionCookie;

  const res = await fetch(`${url}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "call", params }),
    redirect: "manual",
  });

  // Capture session cookie
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const match = setCookie.match(/session_id=[^;]+/);
    if (match) sessionCookie = match[0];
  }

  const data = await res.json();
  if (data.error) throw new Error(data.error.data?.message || JSON.stringify(data.error));
  return data.result;
}

async function detectDb() {
  if (db) return db;
  try {
    const list = await jsonrpc("/web/database/list", {});
    if (list && list.length === 1) return list[0];
    if (list && list.length > 1) {
      console.error(`Multiple databases: ${list.join(", ")}. Set ODOO_DB.`);
      process.exit(1);
    }
  } catch { /* fall through */ }
  console.error("Could not detect database. Set ODOO_DB.");
  process.exit(1);
}

async function main() {
  db = await detectDb();

  const auth = await jsonrpc("/web/session/authenticate", { db, login: user, password });
  if (!auth.uid) {
    console.error("Authentication failed");
    process.exit(1);
  }

  const modules = await jsonrpc("/web/dataset/call_kw", {
    model: "ir.module.module",
    method: "search_read",
    args: [[["state", "=", "installed"]]],
    kwargs: { fields: ["name"], limit: 0 },
  });

  const installed = {};
  for (const mod of modules) installed[mod.name] = true;
  console.log(JSON.stringify(installed, null, 2));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
