// Server helpers for the Reviews block.
import crypto from 'node:crypto';
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
export const toPublicReview = (r) => ({
  id: r.id, name: r.name || '', rating: r.rating, comment: r.comment || '', reply: r.reply || '', createdAt: r.createdAt, editedAt: r.editedAt || null,
});

/** What the author sees about their own review (includes its status). */
export const toAuthorReview = (r) => ({ ...toPublicReview(r), status: r.status });

/** Secret handed only to the browser that wrote the review (lets it edit or delete it). */
export const newEditToken = () => crypto.randomBytes(24).toString('hex');
export function tokenMatches(r, token) {
  if (!r?.editToken || typeof token !== 'string' || token.length !== r.editToken.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(r.editToken));
}

/** Validate what a visitor sends. → { fields } or { error } */
export function cleanReviewInput(body, data) {
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: 'invalid_rating' };
  const comment = String(body.comment ?? '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim().slice(0, 1000);
  if (data.requireComment && !comment) return { error: 'comment_required' };
  const name = String(body.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 60);
  return { fields: { rating, comment, name } };
}

/** What the owner sees in the dashboard. */
export const toOwnerReview = (r) => ({ ...toPublicReview(r), blockId: r.blockId, status: r.status, replyAt: r.replyAt || null, country: r.country || '' });
