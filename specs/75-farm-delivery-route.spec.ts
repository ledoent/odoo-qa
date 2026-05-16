import { test, expect } from "../fixtures/workflow";

/**
 * Weekly delivery route — groups confirmed SO pickings into a
 * stock.picking.batch via the Build Weekly Route wizard, scoped by date
 * and zone.
 *
 * Module gate: farm_delivery_route_orders
 * Pack: ledoent/farm-pack
 */

test.describe("Farm: weekly delivery route batching", () => {
  test("wizard groups sale.order pickings by date + zone into a batch", async ({
    odoo,
    rpc,
  }) => {
    odoo.skipUnless(test, "farm_delivery_route_orders");
    const ts = Date.now();

    // Two zones
    const northId = await rpc.create("farm.delivery.zone", {
      name: `North ${ts}`,
      code: "N",
      sequence: 1,
    });
    const southId = await rpc.create("farm.delivery.zone", {
      name: `South ${ts}`,
      code: "S",
      sequence: 2,
    });

    // Two customers
    const northPartnerId = await rpc.create("res.partner", {
      name: `North Customer ${ts}`,
    });
    const southPartnerId = await rpc.create("res.partner", {
      name: `South Customer ${ts}`,
    });

    // One product
    const productId = await rpc.create("product.product", {
      name: `Eggs Dozen ${ts}`,
      type: "consu",
      list_price: 6.0,
    });

    // Two SOs on the same delivery date but different zones
    const deliveryDate = "2030-06-12";
    const soNorth = await rpc.create("sale.order", {
      partner_id: northPartnerId,
      farm_delivery_date: deliveryDate,
      farm_delivery_zone_id: northId,
      order_line: [[0, 0, {
        product_id: productId,
        product_uom_qty: 2,
        price_unit: 6.0,
      }]],
    });
    const soSouth = await rpc.create("sale.order", {
      partner_id: southPartnerId,
      farm_delivery_date: deliveryDate,
      farm_delivery_zone_id: southId,
      order_line: [[0, 0, {
        product_id: productId,
        product_uom_qty: 1,
        price_unit: 6.0,
      }]],
    });
    await rpc.call("sale.order", "action_confirm", [[soNorth]]);
    await rpc.call("sale.order", "action_confirm", [[soSouth]]);

    // Build a route via the wizard — North only
    const wizardId = await rpc.create("farm.weekly.route.wizard", {
      delivery_date: deliveryDate,
      delivery_zone_id: northId,
    });
    const action = await rpc.call(
      "farm.weekly.route.wizard",
      "action_build_route",
      [[wizardId]],
    );
    expect(action.res_id).toBeGreaterThan(0);

    // Batch should contain only the North SO's picking
    const batch = await rpc.read(
      "stock.picking.batch",
      [action.res_id],
      ["picking_ids", "farm_delivery_date", "farm_delivery_zone_id"],
    );
    expect(batch[0].picking_ids.length).toBe(1);
    expect(batch[0].farm_delivery_zone_id[0]).toBe(northId);

    // South SO's picking is still unbatched
    const southPickings = await rpc.search_read(
      "stock.picking",
      [
        ["sale_id", "=", soSouth],
        ["picking_type_code", "=", "outgoing"],
      ],
      ["batch_id"],
    );
    expect(southPickings[0].batch_id).toBe(false);
  });

  test("wizard with no matching pickings raises", async ({ odoo, rpc }) => {
    odoo.skipUnless(test, "farm_delivery_route_orders");
    const wizardId = await rpc.create("farm.weekly.route.wizard", {
      delivery_date: "2099-01-01",
    });
    let raised = false;
    try {
      await rpc.call(
        "farm.weekly.route.wizard",
        "action_build_route",
        [[wizardId]],
      );
    } catch (e) {
      raised = true;
    }
    expect(raised).toBe(true);
  });
});
