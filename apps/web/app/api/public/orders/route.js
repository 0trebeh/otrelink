import { NextResponse } from 'next/server';
import { priceCart } from '@otrelink/core';
import { getDb } from '@/lib/db';
import { pushToUser } from '@/lib/notify';
import { loadCatalogBlock, nextOrderCode, toVisitorOrder, newToken, cleanOrderInput } from '@/lib/orders';
import { handler, corsHeaders, rateLimit, HttpError } from '@/lib/http';
import { ownerPlan } from '@/lib/plans';
import { formatMoney } from '@otrelink/core';

// A visitor places a pickup order. Prices are computed here from the block,
// never taken from the visitor.
export const POST = handler(async (req) => {
  await rateLimit(req, 'orders-write', 12, 60 * 60 * 1000);
  const headers = corsHeaders(req);
  const fail = (status, code, extra = {}) => NextResponse.json({ error: code, ...extra }, { status, headers });
  const raw = await req.text();
  if (raw.length > 20_000) return fail(413, 'too_large');
  let body;
  try { body = JSON.parse(raw); } catch { throw new HttpError(400, 'invalid_json'); }
  if (body.website) return fail(400, 'invalid'); // honeypot

  const db = await getDb();
  const ctx = await loadCatalogBlock(db, body.pageId, body.blockId);
  if (!ctx) return fail(404, 'not_found');
  const { page, block, data, today } = ctx;
  const plan = await ownerPlan(db, page);
  if (!plan) return fail(404, 'not_found');
  if (!plan.features?.orders || !plan.features?.catalog) return fail(403, 'plan_required');
  if (data.ordering !== 'pickup') return fail(403, 'closed');
  if (today.ordersPaused) return fail(403, 'paused');

  const input = cleanOrderInput(body, data);
  if (input.error) return fail(400, input.error);
  const cart = priceCart(data, Array.isArray(body.items) ? body.items.slice(0, 40) : [], { blockId: block.id, today });
  if (cart.error) return fail(400, cart.error, cart.product ? { product: cart.product } : {});

  const order = await db.orders.create({
    userId: page.userId, pageId: page.id, blockId: block.id,
    code: await nextOrderCode(db, page.id, data.timezone),
    status: 'new',
    ...input.fields,
    lines: cart.lines, total: cart.total,
    money: { currency: data.currency, currencyPosition: data.currencyPosition, numberFormat: data.numberFormat },
    token: newToken(),
    history: [{ status: 'new', at: new Date().toISOString() }],
  });

  const items = order.lines.reduce((s, l) => s + l.qty, 0);
  await pushToUser(page.userId, {
    title: `New order #${order.code} · ${formatMoney(order.total, data)}`,
    body: `${order.name} · ${items} item${items === 1 ? '' : 's'}: ${order.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}`.slice(0, 160),
    url: `/dashboard/${page.id}#orders`,
    tag: `order-${order.id}`,
  }).catch(() => {});

  return NextResponse.json({ order: toVisitorOrder(order), token: order.token }, { status: 201, headers });
});

export const OPTIONS = (req) => new Response(null, { status: 204, headers: corsHeaders(req) });
