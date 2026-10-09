import { sanitizeCampaign } from '@otrelink/core';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { handler, json, error, readJson } from '@/lib/http';

// Admin: edit a campaign (send the whole campaign) or turn it on/off ({ enabled }).
export const PATCH = handler(async (req, { params }) => {
  requireAdmin(req);
  const { id } = await params;
  const db = await getDb();
  const current = await db.referralCampaigns.findById(String(id));
  if (!current) return error(404, 'not_found');
  const c = sanitizeCampaign({ ...current, ...(await readJson(req)) });
  if (!c) return error(400, 'invalid_campaign');
  return json({ campaign: await db.referralCampaigns.update(current.id, c) });
});

// Delete a campaign. Referrals already rewarded keep their months; pending ones won't get a reward.
export const DELETE = handler(async (req, { params }) => {
  requireAdmin(req);
  const { id } = await params;
  const db = await getDb();
  if (!(await db.referralCampaigns.remove(String(id)))) return error(404, 'not_found');
  return json({ ok: true });
});
