import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { loadLoyaltyBlock, newCardCode, toVisitorCard } from '@/lib/loyalty';
import { newToken } from '@/lib/orders';
import { handler, corsHeaders, rateLimit, HttpError } from '@/lib/http';
import { ownerPlan } from '@/lib/plans';
import { allowsBlock } from '@otrelink/core';

// A visitor gets a new loyalty card.
export const POST = handler(async (req) => {
  await rateLimit(req, 'loyalty-new', 6, 60 * 60 * 1000);
  const headers = corsHeaders(req);
  const fail = (status, code) => NextResponse.json({ error: code }, { status, headers });
  const raw = await req.text();
  if (raw.length > 5_000) return fail(413, 'too_large');
  let body;
  try { body = JSON.parse(raw); } catch { throw new HttpError(400, 'invalid_json'); }
  if (body.website) return fail(400, 'invalid'); // honeypot

  const db = await getDb();
  const ctx = await loadLoyaltyBlock(db, body.pageId, body.blockId);
  if (!ctx) return fail(404, 'not_found');
  const plan = await ownerPlan(db, ctx.page);
  if (!plan) return fail(404, 'not_found');
  if (!allowsBlock(plan, 'loyalty')) return fail(403, 'plan_required');

  const name = ctx.data.askName ? String(body.name ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, 60) : '';
  const token = newToken();
  let card = null;
  for (let i = 0; i < 5 && !card; i++) {
    try {
      card = await db.cards.create({ userId: ctx.page.userId, pageId: ctx.page.id, blockId: ctx.block.id, code: newCardCode(), token, name, stamps: 0, rewards: 0, history: [] });
    } catch (err) { if (err.code !== 'code_taken') throw err; }
  }
  if (!card) throw new Error('could not create a card code');
  return NextResponse.json({ card: toVisitorCard(card), token }, { status: 201, headers });
});

export const OPTIONS = (req) => new Response(null, { status: 204, headers: corsHeaders(req) });
