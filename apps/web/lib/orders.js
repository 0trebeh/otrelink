// Server helpers for pickup orders (Catalog block in "Pickup orders" mode).
import crypto from 'node:crypto';
import { findBlock, sanitizeBlock, sanitizeToday, zonedDateStr, zonedToUtc, isValidTimeZone } from '@otrelink/core';

export const ORDER_STATUSES = ['new', 'preparing', 'ready', 'done', 'cancelled'];
export const ACTIVE_ORDER_STATUSES = ['new', 'preparing', 'ready'];

/** A published page + its enabled Catalog block. */
export async function loadCatalogBlock(db, pageId, blockId) {
  const page = await db.pages.findById(String(pageId || '').slice(0, 64));
  if (!page?.settings?.published) return null;
  const raw = findBlock(page.blocks || [], String(blockId || '').slice(0, 64));
  if (!raw || raw.type !== 'catalog' || !raw.enabled) return null;
  const block = sanitizeBlock(raw);
  return { page, block, data: block.data, today: sanitizeToday(page.today) };
}

/** Order number of the day: 1, 2, 3… (restarts at midnight in the block's time zone). */
export async function nextOrderCode(db, pageId, tz) {
  const zone = isValidTimeZone(tz) ? tz : 'UTC';
  const since = zonedToUtc(zonedDateStr(new Date(), zone), 0, zone).toISOString();
  return String((await db.orders.count({ pageId, since })) + 1);
}

/** What the visitor who ordered sees. */
export const toVisitorOrder = (o) => ({
  id: o.id, code: o.code, status: o.status, lines: o.lines, total: o.total, pickup: o.pickup, name: o.name, note: o.note || '', createdAt: o.createdAt, updatedAt: o.updatedAt || o.createdAt,
});

/** What the owner sees. */
export const toOwnerOrder = (o) => ({ ...toVisitorOrder(o), blockId: o.blockId, phone: o.phone || '', money: o.money, history: o.history || [] });

export const newToken = () => crypto.randomBytes(24).toString('hex');
export function tokenMatches(saved, token) {
  if (!saved || typeof token !== 'string' || token.length !== saved.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(saved));
}

const line = (v, max) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);

/** Check what a visitor sends. → { fields } or { error } */
export function cleanOrderInput(body, data) {
  const name = line(body.name, 60);
  const phone = String(body.phone ?? '').replace(/[^\d+()\-\s]/g, '').trim().slice(0, 32);
  if (!name) return { error: 'missing_name' };
  if (data.askPhone && phone.replace(/\D/g, '').length < 6) return { error: 'missing_phone' };
  const pickup = body.pickup === 'asap' || !data.pickupLater ? 'asap' : /^([01]\d|2[0-3]):[0-5]\d$/.test(body.pickup || '') ? body.pickup : null;
  if (!pickup) return { error: 'invalid_pickup' };
  const note = data.allowNotes ? String(body.note ?? '').replace(/\r\n/g, '\n').trim().slice(0, 300) : '';
  return { fields: { name, phone, pickup, note } };
}
