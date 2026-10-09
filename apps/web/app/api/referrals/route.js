import { getDb } from '@/lib/db';
import { handler, json, requireVerifiedUser } from '@/lib/http';
import { publicOrigin } from '@/lib/origin';
import { referralOverview } from '@/lib/referrals';

// My referral link, the running campaign, and the people I invited.
export const GET = handler(async (req) => {
  const user = await requireVerifiedUser();
  const db = await getDb();
  return json(await referralOverview(db, user, publicOrigin(req)), { headers: { 'Cache-Control': 'no-store' } });
});
