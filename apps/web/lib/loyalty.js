// Server helpers for loyalty cards (Loyalty card block).
import crypto from 'node:crypto';
import { findBlock, sanitizeBlock, flattenBlocks } from '@otrelink/core';

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I/L
export const newCardCode = () => Array.from(crypto.randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join('');

/** A published page + its enabled Loyalty block. */
export async function loadLoyaltyBlock(db, pageId, blockId, { published = true } = {}) {
  const page = await db.pages.findById(String(pageId || '').slice(0, 64));
  if (!page || (published && !page.settings?.published)) return null;
  const raw = findBlock(page.blocks || [], String(blockId || '').slice(0, 64));
  if (!raw || raw.type !== 'loyalty' || (published && !raw.enabled)) return null;
  const block = sanitizeBlock(raw);
  return { page, block, data: block.data };
}

/** Loyalty blocks of a page (for the dashboard). */
export const loyaltyBlocks = (page) => flattenBlocks(page.blocks || []).filter((b) => b.type === 'loyalty').map((b) => sanitizeBlock(b));

/** What the card holder sees. */
export const toVisitorCard = (c) => ({ id: c.id, code: c.code, name: c.name || '', stamps: c.stamps || 0, rewards: c.rewards || 0, updatedAt: c.updatedAt });

/** What the owner sees. */
export const toOwnerCard = (c) => ({
  ...toVisitorCard(c), blockId: c.blockId, createdAt: c.createdAt, lastStampAt: c.lastStampAt || null,
  history: (c.history || []).slice(-15).reverse(),
});
