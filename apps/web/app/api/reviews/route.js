import { getDb } from '@/lib/db';
import { reviewStats, toOwnerReview } from '@/lib/reviews';
import { handler, json, requireOwnedPage } from '@/lib/http';

// Owner: reviews of a page.
//   ?pageId=…&count=1                        → { pending }
//   ?pageId=…&blockId=…&status=all|pending|published|hidden → { reviews, counts, stats }
export const GET = handler(async (req) => {
  const q = new URL(req.url).searchParams;
  const { page } = await requireOwnedPage(q.get('pageId'));
  const db = await getDb();
  if (q.get('count')) return json({ pending: await db.reviews.count({ pageId: page.id, status: 'pending' }) });

  const blockId = q.get('blockId') || undefined;
  const status = q.get('status');
  const statuses = ['pending', 'published', 'hidden'].includes(status) ? [status] : undefined;
  const [list, pending, published, hidden, stats] = await Promise.all([
    db.reviews.list({ pageId: page.id, blockId, statuses, limit: 500 }),
    db.reviews.count({ pageId: page.id, blockId, status: 'pending' }),
    db.reviews.count({ pageId: page.id, blockId, status: 'published' }),
    db.reviews.count({ pageId: page.id, blockId, status: 'hidden' }),
    blockId ? reviewStats(db, page.id, blockId) : null,
  ]);
  return json({ reviews: list.map(toOwnerReview), counts: { pending, published, hidden, all: pending + published + hidden }, stats });
});
