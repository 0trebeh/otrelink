import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { toVisitorCard } from '@/lib/loyalty';
import { tokenMatches } from '@/lib/orders';
import { handler, corsHeaders, rateLimit } from '@/lib/http';

// A card, for the browser that holds it (?token=…).
export const GET = handler(async (req, { params }) => {
  await rateLimit(req, 'loyalty-read', 240, 60 * 1000);
  const headers = { ...corsHeaders(req), 'Cache-Control': 'no-store' };
  const id = String((await params).id || '').slice(0, 64);
  const token = new URL(req.url).searchParams.get('token') || '';
  const db = await getDb();
  const card = await db.cards.findById(id);
  if (!card || !tokenMatches(card.token, token)) return NextResponse.json({ error: 'not_found' }, { status: 404, headers });
  return NextResponse.json({ card: toVisitorCard(card) }, { headers });
});

export const OPTIONS = (req) => new Response(null, { status: 204, headers: corsHeaders(req) });
