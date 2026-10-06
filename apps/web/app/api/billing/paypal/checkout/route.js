import { getDb } from '@/lib/db';
import { createSubscription, paypalConfigured } from '@/lib/billing/paypal';
import { ACTIVE } from '@/lib/billing';
import { publicOrigin } from '@/lib/origin';
import { handler, json, error, requireVerifiedUser, rateLimit, provider } from '@/lib/http';

// Start paying for Pro with PayPal. The user approves it on PayPal and comes back to /api/billing/paypal/return.
export const POST = handler(async (req) => {
  await rateLimit(req, 'checkout', 20, 60 * 60 * 1000);
  const user = await requireVerifiedUser();
  if (!paypalConfigured()) return error(503, 'paypal_not_configured');
  const db = await getDb();
  const dbUser = await db.users.findById(user.id);
  if (ACTIVE.includes(dbUser.billing?.status)) return error(409, 'already_subscribed');
  const url = await provider(() => createSubscription({ user, origin: publicOrigin(req) }));
  if (!url) return error(502, 'paypal_error');
  return json({ url });
});
