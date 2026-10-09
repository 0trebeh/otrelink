import { sanitizeCampaign } from '@otrelink/core';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { handler, json, error, readJson } from '@/lib/http';

// Admin: new campaign { name, startsAt, endsAt, freeMonths, freeUserMonths, maxPerReferrer, enabled }.
export const POST = handler(async (req) => {
  requireAdmin(req);
  const c = sanitizeCampaign(await readJson(req));
  if (!c) return error(400, 'invalid_campaign');
  const db = await getDb();
  return json({ campaign: await db.referralCampaigns.create(c) }, { status: 201 });
});
