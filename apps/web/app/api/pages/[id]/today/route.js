import { sanitizeToday } from '@otrelink/core';
import { handler, json, readJson, requireOwnedPage } from '@/lib/http';

// "Today" state of a page: live location, open/closed override, sold-out
// products and paused orders. Saved right away, apart from the page draft.
export const GET = handler(async (_req, { params }) => {
  const { page } = await requireOwnedPage((await params).id);
  return json({ today: sanitizeToday(page.today) });
});

// Send only what changes, e.g. { status: 'closed' } or { soldOut: [...] }.
export const PATCH = handler(async (req, { params }) => {
  const { db, page } = await requireOwnedPage((await params).id);
  const body = await readJson(req);
  const current = sanitizeToday(page.today);
  const next = { ...current, ...(body && typeof body === 'object' ? body : {}), updatedAt: new Date().toISOString() };
  // A new location starts its day now (the Location block hides it after midnight).
  const moved = ['place', 'address', 'lat', 'lon'].some((k) => k in (body || {}) && body[k] !== current[k]);
  if (moved) next.placeAt = new Date().toISOString();
  const today = sanitizeToday(next);
  await db.pages.update(page.id, { today });
  return json({ today });
});
