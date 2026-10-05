import { getDb } from '@/lib/db';
import { toOwnerReview } from '@/lib/reviews';
import { handler, json, error, readJson, requireUser } from '@/lib/http';

async function ownReview(params) {
  const user = await requireUser();
  const db = await getDb();
  const review = await db.reviews.findById((await params).id);
  return { db, review: review && review.userId === user.id ? review : null };
}

// Owner: publish / hide a review, or reply to it publicly.
//   { status: 'published' | 'hidden' }   or   { reply: '…' } ('' removes the reply)
export const PATCH = handler(async (req, { params }) => {
  const { db, review } = await ownReview(params);
  if (!review) return error(404, 'not_found');
  const body = await readJson(req);
  const patch = {};
  if (['published', 'hidden'].includes(body.status)) patch.status = body.status;
  if (typeof body.reply === 'string') {
    patch.reply = body.reply.replace(/\r\n/g, '\n').trim().slice(0, 1000);
    patch.replyAt = patch.reply ? new Date().toISOString() : null;
  }
  if (!Object.keys(patch).length) return error(400, 'nothing_to_change');
  return json({ review: toOwnerReview(await db.reviews.update(review.id, patch)) });
});

export const DELETE = handler(async (_req, { params }) => {
  const { db, review } = await ownReview(params);
  if (!review) return error(404, 'not_found');
  await db.reviews.remove(review.id);
  return json({ ok: true });
});
