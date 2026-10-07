import { createDefaultPage, sanitizePage, sanitizeSlug, buildTemplatePage } from '@otrelink/core';
import { getDb } from '@/lib/db';
import { toDashboardPage } from '@/lib/pages';
import { handler, json, error, readJson, requireVerifiedUser } from '@/lib/http';

// List my pages
export const GET = handler(async () => {
  const user = await requireVerifiedUser();
  const db = await getDb();
  const pages = await db.pages.listByUser(user.id);
  return json({ pages: pages.map(toDashboardPage) });
});

// Create a page
export const POST = handler(async (req) => {
  const user = await requireVerifiedUser();
  const body = await readJson(req);
  const slug = sanitizeSlug(body.slug);
  if (!slug) return error(400, 'invalid_slug');
  const db = await getDb();
  // Pages allowed by the plan (Free: 1, Pro: 10, Business: set by the admin).
  if ((await db.pages.countByUser(user.id)) >= user.plan.maxPages) return error(403, 'page_limit', { limit: user.plan.maxPages, plan: user.plan.id });
  try {
    // Optional template (dashboard → New page → template).
    const content = (body.template && buildTemplatePage(String(body.template))) || sanitizePage(createDefaultPage({ slug, title: body.title }));
    const page = await db.pages.create({ userId: user.id, slug, ...content });
    return json({ page: toDashboardPage(page) }, { status: 201 });
  } catch (err) {
    if (err.code === 'slug_taken') return error(409, 'slug_taken');
    throw err;
  }
});
