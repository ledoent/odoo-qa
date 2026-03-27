/**
 * Odoo JSON-RPC client for backend operations in E2E tests.
 * Used for: setup (create records), verification (assert state), cleanup (unlink).
 */

export class OdooRPC {
  private sessionCookie = "";
  private uid = 0;
  private db: string;

  constructor(
    private baseUrl: string,
    db: string,
    private login: string,
    private password: string
  ) {
    this.db = db;
  }

  private async jsonrpc(endpoint: string, params: Record<string, any>): Promise<any> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (this.sessionCookie) headers["Cookie"] = this.sessionCookie;

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "call", params }),
      redirect: "manual",
    });

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/session_id=[^;]+/);
      if (match) this.sessionCookie = match[0];
    }

    const data = await res.json();
    if (data.error) {
      const msg = data.error.data?.message || JSON.stringify(data.error);
      throw new Error(`RPC error: ${msg}`);
    }
    return data.result;
  }

  async authenticate(): Promise<void> {
    // Auto-detect DB if not provided
    if (!this.db) {
      const list = await this.jsonrpc("/web/database/list", {});
      if (list?.length >= 1) {
        // Pick the first non-baseonly database (runboat convention)
        this.db = list.find((d: string) => !d.endsWith("-baseonly")) || list[0];
      } else {
        throw new Error("No databases found.");
      }
    }

    const result = await this.jsonrpc("/web/session/authenticate", {
      db: this.db,
      login: this.login,
      password: this.password,
    });

    if (!result?.uid) throw new Error("Authentication failed");
    this.uid = result.uid;
  }

  private async callKw(
    model: string,
    method: string,
    args: any[],
    kwargs: Record<string, any> = {}
  ): Promise<any> {
    return this.jsonrpc("/web/dataset/call_kw", {
      model,
      method,
      args,
      kwargs: { context: {}, ...kwargs },
    });
  }

  async searchRead(
    model: string,
    domain: any[],
    fields: string[],
    opts: { limit?: number; order?: string } = {}
  ): Promise<any[]> {
    return this.callKw(model, "search_read", [domain], {
      fields,
      limit: opts.limit || 0,
      order: opts.order || "",
    });
  }

  async search(model: string, domain: any[]): Promise<number[]> {
    return this.callKw(model, "search", [domain]);
  }

  async read(model: string, ids: number[], fields: string[]): Promise<any[]> {
    return this.callKw(model, "read", [ids], { fields });
  }

  async create(model: string, values: Record<string, any>): Promise<number> {
    return this.callKw(model, "create", [values]);
  }

  async write(model: string, ids: number[], values: Record<string, any>): Promise<boolean> {
    return this.callKw(model, "write", [ids, values]);
  }

  async unlink(model: string, ids: number[]): Promise<boolean> {
    return this.callKw(model, "unlink", [ids]);
  }

  /** Call any model method (e.g. action_confirm on sale.order) */
  async callMethod(
    model: string,
    method: string,
    args: any[],
    kwargs: Record<string, any> = {}
  ): Promise<any> {
    return this.callKw(model, method, args, kwargs);
  }

  /** Find a demo partner (customer) to use in tests */
  async findDemoPartner(): Promise<{ id: number; name: string }> {
    const partners = await this.searchRead(
      "res.partner",
      [["customer_rank", ">", 0], ["is_company", "=", true]],
      ["id", "name"],
      { limit: 1 }
    );
    if (partners.length > 0) return partners[0];
    // Fallback: any company partner
    const fallback = await this.searchRead(
      "res.partner",
      [["is_company", "=", true], ["id", ">", 1]],
      ["id", "name"],
      { limit: 1 }
    );
    if (fallback.length > 0) return fallback[0];
    throw new Error("No demo partner found");
  }

  /** Find a demo product (storable) to use in tests */
  async findDemoProduct(): Promise<{ id: number; name: string }> {
    const products = await this.searchRead(
      "product.product",
      [["type", "=", "consu"], ["sale_ok", "=", true]],
      ["id", "name"],
      { limit: 1 }
    );
    if (products.length > 0) return products[0];
    // Fallback: any saleable product
    const fallback = await this.searchRead(
      "product.product",
      [["sale_ok", "=", true]],
      ["id", "name"],
      { limit: 1 }
    );
    if (fallback.length > 0) return fallback[0];
    throw new Error("No demo product found");
  }

  /** Find a demo vendor */
  async findDemoVendor(): Promise<{ id: number; name: string }> {
    const vendors = await this.searchRead(
      "res.partner",
      [["supplier_rank", ">", 0], ["is_company", "=", true]],
      ["id", "name"],
      { limit: 1 }
    );
    if (vendors.length > 0) return vendors[0];
    const fallback = await this.searchRead(
      "res.partner",
      [["is_company", "=", true], ["id", ">", 1]],
      ["id", "name"],
      { limit: 1, order: "id desc" }
    );
    if (fallback.length > 0) return fallback[0];
    throw new Error("No demo vendor found");
  }

  /** Format a JS Date to Odoo's expected 'YYYY-MM-DD HH:MM:SS' format */
  static odooDatetime(date: Date = new Date()): string {
    return date.toISOString().replace("T", " ").slice(0, 19);
  }

  // --- Workflow convenience methods ---

  /** Create a confirmed sale order with lines. Returns { soId, soName, pickingIds }. */
  async createConfirmedSO(
    partnerId: number,
    lines: { productId: number; qty: number }[]
  ): Promise<{ soId: number; soName: string }> {
    const soId = await this.create("sale.order", { partner_id: partnerId });
    for (const line of lines) {
      await this.create("sale.order.line", {
        order_id: soId,
        product_id: line.productId,
        product_uom_qty: line.qty,
      });
    }
    await this.callMethod("sale.order", "action_confirm", [[soId]]);
    const so = await this.read("sale.order", [soId], ["name"]);
    return { soId, soName: so[0].name };
  }

  /** Create a confirmed purchase order with lines. Returns { poId, poName }. */
  async createConfirmedPO(
    vendorId: number,
    lines: { productId: number; qty: number; price?: number }[]
  ): Promise<{ poId: number; poName: string }> {
    const poId = await this.create("purchase.order", { partner_id: vendorId });
    for (const line of lines) {
      await this.create("purchase.order.line", {
        order_id: poId,
        product_id: line.productId,
        product_qty: line.qty,
        price_unit: line.price || 10,
      });
    }
    await this.callMethod("purchase.order", "button_confirm", [[poId]]);
    const po = await this.read("purchase.order", [poId], ["name"]);
    return { poId, poName: po[0].name };
  }

  /** Get stock pickings for an origin (SO or PO name) */
  async getPickings(origin: string): Promise<{ id: number; state: string }[]> {
    return this.searchRead("stock.picking", [["origin", "=", origin]], ["id", "state"]);
  }

  /** Get invoices linked to a sale order */
  async getSOInvoices(soId: number): Promise<{ id: number; state: string; payment_state: string }[]> {
    const so = await this.read("sale.order", [soId], ["invoice_ids"]);
    if (!so[0].invoice_ids?.length) return [];
    return this.read("account.move", so[0].invoice_ids, ["id", "state", "payment_state"]);
  }
}
