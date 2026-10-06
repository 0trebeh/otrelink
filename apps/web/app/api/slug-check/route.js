import { sanitizeSlug } from '@otrelink/core';
import { getDb } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { handler, json, rateLimit } from '@/lib/http';

export const GET = handler(async (req) => {
  await rateLimit(req, 'slug', 120, 60 * 1000);
  const params = new URL(req.url).searchParams;
  const raw = params.get('slug') || '';
  const slug = sanitizeSlug(raw);
  if (!slug || slug !== raw.toLowerCase().replace(/^@/, '')) return json({ slug, available: false, reason: 'invalid' });
  const db = await getDb();
  const existing = await db.pages.findBySlug(slug) || await db.users.findByPendingSlug(slug);
  const user = await getUser();
  const mine = existing && user && existing.userId === user.id && existing.id === params.get('pageId');
  return json({ slug, available: !existing || Boolean(mine), reason: existing && !mine ? 'taken' : null });
});
