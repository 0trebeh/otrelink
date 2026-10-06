import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { pushToUser } from '@/lib/notify';
import { loadReviewsBlock, reviewStats, toAuthorReview, tokenMatches, cleanReviewInput } from '@/lib/reviews';
import { handler, corsHeaders, rateLimit, HttpError } from '@/lib/http';

// The author edits or deletes their own review from the public page.
// Body: { action: 'update' | 'delete', pageId, blockId, id, token, rating?, comment?, name? }
// The token was given only to the browser that wrote the review.
export const POST = handler(async (req) => {
  await rateLimit(req, 'reviews-edit', 30, 60 * 60 * 1000);
  const headers = corsHeaders(req);
  const fail = (status, code) => NextResponse.json({ error: code }, { status, headers });
  const raw = await req.text();
  if (raw.length > 10_000) return fail(413, 'too_large');
  let body;
  try { body = JSON.parse(raw); } catch { throw new HttpError(400, 'invalid_json'); }

  const db = await getDb();
  const review = await db.reviews.findById(String(body.id || '').slice(0, 64));
  if (!review || review.pageId !== String(body.pageId || '') || review.blockId !== String(body.blockId || '') || !tokenMatches(review, body.token)) {
    return fail(404, 'not_found');
  }

  if (body.action === 'delete') {
    await db.reviews.remove(review.id);
    return NextResponse.json({ ok: true, stats: await reviewStats(db, review.pageId, review.blockId) }, { headers });
  }
  if (body.action !== 'update') return fail(400, 'invalid_action');

  const ctx = await loadReviewsBlock(db, review.pageId, review.blockId);
  if (!ctx) return fail(404, 'not_found');
  const input = cleanReviewInput(body, ctx.data);
  if (input.error) return fail(400, input.error);

  // With "I approve each one", an edited review waits for approval again.
  // A review hidden by the owner stays hidden.
  const status = review.status === 'hidden' ? 'hidden' : ctx.data.moderation === 'manual' ? 'pending' : 'published';
  const updated = await db.reviews.update(review.id, { ...input.fields, status, editedAt: new Date().toISOString() });

  if (ctx.data.notify) {
    await pushToUser(ctx.page.userId, {
      title: `Review edited · ${'★'.repeat(updated.rating)}`,
      body: `${updated.name || 'Anonymous'}${updated.comment ? `: ${updated.comment}` : ''}`.slice(0, 140),
      url: `/dashboard/${ctx.page.id}#reviews`,
      tag: `review-${updated.id}`,
    }).catch(() => {});
  }
  return NextResponse.json({ review: toAuthorReview(updated), stats: await reviewStats(db, review.pageId, review.blockId) }, { headers });
});

export const OPTIONS = (req) => new Response(null, { status: 204, headers: corsHeaders(req) });
