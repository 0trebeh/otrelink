import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { pushToUser } from '@/lib/notify';
import {
  loadReviewsBlock, reviewStats, toPublicReview, toAuthorReview, newEditToken, tokenMatches, cleanReviewInput,
} from '@/lib/reviews';
import { handler, corsHeaders, rateLimit, HttpError } from '@/lib/http';

// Public reviews of a Reviews block (newest first).
//   GET ?pageId=…&blockId=…&limit=5&before=<createdAt>[&mine=<id>~<token>]
//   `mine` returns the visitor's own review (any status) when the token matches.
export const GET = handler(async (req) => {
  rateLimit(req, 'reviews-read', 120, 60 * 1000);
  const headers = corsHeaders(req);
  const q = new URL(req.url).searchParams;
  const db = await getDb();
  const ctx = await loadReviewsBlock(db, q.get('pageId'), q.get('blockId'));
  if (!ctx) return NextResponse.json({ error: 'not_found' }, { status: 404, headers });
  const limit = Math.min(Math.max(Number(q.get('limit')) || 5, 1), 30);
  const before = /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(q.get('before') || '') ? q.get('before') : undefined;
  const list = await db.reviews.list({ pageId: ctx.page.id, blockId: ctx.block.id, statuses: ['published'], before, limit: limit + 1 });
  let mine;
  const [mineId, mineToken] = String(q.get('mine') || '').split('~');
  if (mineId && mineToken) {
    const r = await db.reviews.findById(mineId.slice(0, 64));
    mine = r && r.pageId === ctx.page.id && r.blockId === ctx.block.id && tokenMatches(r, mineToken) ? toAuthorReview(r) : null;
  }
  return NextResponse.json({
    ...(mine !== undefined ? { mine } : {}),
    stats: await reviewStats(db, ctx.page.id, ctx.block.id),
    reviews: list.slice(0, limit).map(toPublicReview),
    hasMore: list.length > limit,
  }, { headers: { ...headers, 'Cache-Control': 'no-store' } });
});

// A visitor writes a review.
export const POST = handler(async (req) => {
  rateLimit(req, 'reviews-write', 10, 60 * 60 * 1000);
  const headers = corsHeaders(req);
  const fail = (status, code) => NextResponse.json({ error: code }, { status, headers });
  const raw = await req.text();
  if (raw.length > 10_000) return fail(413, 'too_large');
  let body;
  try { body = JSON.parse(raw); } catch { throw new HttpError(400, 'invalid_json'); }
  if (body.website) return fail(400, 'invalid'); // honeypot

  const db = await getDb();
  const ctx = await loadReviewsBlock(db, body.pageId, body.blockId);
  if (!ctx) return fail(404, 'not_found');
  const { page, block, data } = ctx;
  if (!data.allowNew) return fail(403, 'closed');

  const input = cleanReviewInput(body, data);
  if (input.error) return fail(400, input.error);
  const { rating, comment, name } = input.fields;

  const review = await db.reviews.create({
    userId: page.userId, pageId: page.id, blockId: block.id, rating, comment, name,
    status: data.moderation === 'manual' ? 'pending' : 'published',
    editToken: newEditToken(),
    country: (req.headers.get('cf-ipcountry') || req.headers.get('x-vercel-ip-country') || '').slice(0, 2).toUpperCase(),
  });

  if (data.notify) {
    await pushToUser(page.userId, {
      title: review.status === 'pending' ? `New review to approve · ${'★'.repeat(rating)}` : `New review · ${'★'.repeat(rating)}`,
      body: `${name || 'Anonymous'}${comment ? `: ${comment}` : ''}`.slice(0, 140),
      url: `/dashboard/${page.id}#reviews`,
      tag: `review-${review.id}`,
    }).catch(() => {});
  }

  return NextResponse.json({
    review: toAuthorReview(review),
    token: review.editToken, // only sent here, to the browser that wrote it
    stats: review.status === 'published' ? await reviewStats(db, page.id, block.id) : undefined,
  }, { status: 201, headers });
});

export const OPTIONS = (req) => new Response(null, { status: 204, headers: corsHeaders(req) });
