import { sanitizeSlug } from '@otrelink/core';
import { getDb } from '@/lib/db';
import { toPublicPage } from '@/lib/pages';
import { ownerPlan } from '@/lib/plans';
import { handler, corsHeaders, rateLimit } from '@/lib/http';
import { NextResponse } from 'next/server';

// Public page data for the link page app. No auth.
export const GET = handler(async (req, { params }) => {
  await rateLimit(req, 'public', 300, 60 * 1000);
  const headers = corsHeaders(req);
  const slug = sanitizeSlug((await params).slug);
  const db = await getDb();
  const page = slug ? await db.pages.findBySlug(slug) : null;
  // Pages of banned accounts are not shown.
  const plan = page?.settings?.published ? await ownerPlan(db, page) : null;
  if (!page || !page.settings?.published || !plan) {
    return NextResponse.json({ error: 'not_found' }, { status: 404, headers });
  }
  return NextResponse.json(
    { page: toPublicPage(page, plan) },
    { headers: { ...headers, 'Cache-Control': 'public, max-age=10, stale-while-revalidate=60' } },
  );
});

export const OPTIONS = (req) => new Response(null, { status: 204, headers: corsHeaders(req) });
