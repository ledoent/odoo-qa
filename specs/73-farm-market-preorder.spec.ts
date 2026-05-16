import { test, expect } from "../fixtures/workflow";
import { OdooRPC } from "../fixtures/odoo-rpc";

/**
 * End-to-end use case for the farm market preorder flow.
 *
 * A homestead farm publishes a Saturday market with product offerings; a
 * customer visits the public site, picks the event, preorders eggs for
 * pickup, lands in the cart with the carrier set, and the backend SO
 * resolves to the right event via the carrier compute.
 *
 * Module gate: farm_market_event_website
 * Pack: ledoent/farm-pack
 */

test.describe("Farm market preorder (public site)", () => {
  test("customer can browse the markets list and submit a preorder", async ({
    page,
    odoo,
    rpc,
  }) => {
    odoo.skipUnless(test, "farm_market_event_website");
    const ts = Date.now();

    // -- setup: shipping product + carrier (market series) -----------------
    const deliveryProductId = await rpc.create("product.product", {
      name: `Market Pickup Service ${ts}`,
      type: "service",
    });
    const carrierId = await rpc.create("delivery.carrier", {
      name: `Market Pickup ${ts}`,
      delivery_type: "fixed",
      product_id: deliveryProductId,
      is_farm_market_pickup: true,
      fixed_price: 0,
    });

    // -- event a week out, preorders open ---------------------------------
    const future = new Date(Date.now() + 7 * 86400000);
    const eventId = await rpc.create("event.event", {
      name: `E2E Market ${ts}`,
      date_begin: OdooRPC.odooDatetime(future),
      date_end: OdooRPC.odooDatetime(
        new Date(future.getTime() + 4 * 3600000),
      ),
      is_farm_market: true,
      farm_market_state: "preorder_open",
      farm_market_carrier_id: carrierId,
    });

    // -- offering: eggs dozen, $6, 30 available ---------------------------
    const eggsId = await rpc.create("product.product", {
      name: `E2E Eggs Dozen ${ts}`,
      type: "consu",
      list_price: 6.0,
      sale_ok: true,
      is_published: true,
    });
    const offeringId = await rpc.create("farm.market.offering", {
      event_id: eventId,
      product_id: eggsId,
      max_qty: 30,
      list_price: 6.0,
    });

    // -- visit the public list page ---------------------------------------
    await page.goto("/market");
    await expect(page.locator("h1")).toContainText("Upcoming Farmers Markets");
    await expect(page.locator("body")).toContainText(`E2E Market ${ts}`);

    // -- click into the event detail page ---------------------------------
    await page.click(`a:has-text("E2E Market ${ts}")`);
    await expect(page.locator("h1")).toContainText(`E2E Market ${ts}`);
    await expect(page.locator("body")).toContainText("What's Available");
    await expect(page.locator("body")).toContainText(`E2E Eggs Dozen ${ts}`);
    await expect(page.locator(".badge.bg-success")).toContainText(
      "Preorders Open",
    );

    // -- submit the preorder form ----------------------------------------
    const form = page.locator(`form[action="/market/${eventId}/preorder"]`);
    await form.locator('input[name="quantity"]').fill("3");
    await form.locator('button:has-text("Preorder")').click();

    // Should land on /shop/cart
    await expect(page).toHaveURL(/\/shop\/cart/);
    await expect(page.locator("body")).toContainText(`E2E Eggs Dozen ${ts}`);

    // -- RPC verify: most recent SO has carrier_id + computed event_id ---
    const orders = await rpc.search_read(
      "sale.order",
      [["carrier_id", "=", carrierId]],
      ["id", "carrier_id", "farm_market_event_id", "amount_total"],
      { order: "id desc", limit: 1 },
    );
    expect(orders.length).toBe(1);
    expect(orders[0].farm_market_event_id[0]).toBe(eventId);
    expect(orders[0].amount_total).toBeGreaterThanOrEqual(18); // 3 × $6 eggs

    // -- back-office check: offering's preorder_qty rolls up the 3 dozen --
    const offerings = await rpc.read(
      "farm.market.offering",
      [offeringId],
      ["preorder_qty", "available_qty"],
    );
    expect(offerings[0].preorder_qty).toBe(3);
    expect(offerings[0].available_qty).toBe(27);
  });

  test("closed-preorder event does not surface a preorder form", async ({
    page,
    odoo,
    rpc,
  }) => {
    odoo.skipUnless(test, "farm_market_event_website");
    const ts = Date.now();

    const deliveryProductId = await rpc.create("product.product", {
      name: `Closed Pickup ${ts}`,
      type: "service",
    });
    const carrierId = await rpc.create("delivery.carrier", {
      name: `Closed Market Pickup ${ts}`,
      delivery_type: "fixed",
      product_id: deliveryProductId,
      is_farm_market_pickup: true,
    });
    const future = new Date(Date.now() + 7 * 86400000);
    const eventId = await rpc.create("event.event", {
      name: `Closed Market ${ts}`,
      date_begin: OdooRPC.odooDatetime(future),
      date_end: OdooRPC.odooDatetime(
        new Date(future.getTime() + 4 * 3600000),
      ),
      is_farm_market: true,
      farm_market_state: "preorder_closed",
      farm_market_carrier_id: carrierId,
    });

    await page.goto(`/market/${eventId}`);
    // Event detail page renders…
    await expect(page.locator("h1")).toContainText(`Closed Market ${ts}`);
    // …but no preorder form is rendered when state ≠ preorder_open
    await expect(
      page.locator(`form[action="/market/${eventId}/preorder"]`),
    ).toHaveCount(0);
  });
});
