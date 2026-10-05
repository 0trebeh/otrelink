// Server helpers for the Reviews block.
import { findBlock, sanitizeBlock } from '@otrelink/core';

/** Load a published page + its enabled Reviews block. */
export async function loadReviewsBlock(db, pageId, blockId) {
  const page = await db.pages.findById(String(pageId || '').slice(0, 64));
  if (!page?.settings?.published) return null;
  const raw = findBlock(page.blocks || [], String(blockId || '').slice(0, 64));
  if (!raw || raw.type !== 'reviews' || !raw.enabled) return null;
  const block = sanitizeBlock(raw);
  return { page, block, data: block.data };
}

/** { count, average, dist } of the published reviews of a block. */
export async function reviewStats(db, pageId, blockId) {
  const dist = await db.reviews.stats({ pageId, blockId });
  const count = Object.values(dist).reduce((s, n) => s + n, 0);
  const average = count ? Object.entries(dist).reduce((s, [k, n]) => s + Number(k) * n, 0) / count : 0;
  return { count, average: Math.round(average * 10) / 10, dist };
}

/** What everybody can see. */
export const toPublicReview = (r) => ({ id: r.id, name: r.name || '', rating: r.rating, comment: r.comment || '', reply: r.reply || '', createdAt: r.createdAt });

/** What the owner sees in the dashboard. */
export const toOwnerReview = (r) => ({ ...toPublicReview(r), blockId: r.blockId, status: r.status, replyAt: r.replyAt || null, country: r.country || '' });
