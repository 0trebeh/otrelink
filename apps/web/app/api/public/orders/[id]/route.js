import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { toVisitorOrder, tokenMatches } from '@/lib/orders';
import { handler, corsHeaders, rateLimit } from '@/lib/http';

// Status of an order, for the browser that placed it (?token=…).
export const GET = handler(async (req, { params }) => {
  await rateLimit(req, 'orders-read', 240, 60 * 1000);
  const headers = { ...corsHeaders(req), 'Cache-Control': 'no-store' };
  const id = String((await params).id || '').slice(0, 64);
  const token = new URL(req.url).searchParams.get('token') || '';
  const db = await getDb();
  const order = await db.orders.findById(id);
  if (!order || !tokenMatches(order.token, token)) return NextResponse.json({ error: 'not_found' }, { status: 404, headers });
  return NextResponse.json({ order: toVisitorOrder(order) }, { headers });
});

export const OPTIONS = (req) => new Response(null, { status: 204, headers: corsHeaders(req) });
