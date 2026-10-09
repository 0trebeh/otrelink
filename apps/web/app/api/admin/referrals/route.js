import { campaignActive } from '@otrelink/core';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/admin';
import { handler, json } from '@/lib/http';

// Admin: campaigns (with their numbers) and the latest referrals.
export const GET = handler(async (req) => {
  requireAdmin(req);
  const db = await getDb();
  const [campaigns, referrals] = await Promise.all([db.referralCampaigns.list(), db.referrals.list({ limit: 300 })]);
  const emails = new Map();
  const email = async (id) => {
    if (!emails.has(id)) emails.set(id, (await db.users.findById(id))?.email || '(deleted)');
    return emails.get(id);
  };
  const now = new Date();
  return json({
    campaigns: campaigns.map((c) => {
      const mine = referrals.filter((r) => r.campaignId === c.id);
      return {
        ...c, active: campaignActive(c, now),
        signups: mine.length,
        rewarded: mine.filter((r) => r.status === 'rewarded').length,
        months: mine.reduce((n, r) => n + (r.status === 'rewarded' ? r.months || 0 : 0), 0),
      };
    }),
    referrals: await Promise.all(referrals.map(async (r) => ({
      ...r, referrerEmail: await email(r.referrerId), refereeEmail: await email(r.refereeId),
    }))),
  });
});
