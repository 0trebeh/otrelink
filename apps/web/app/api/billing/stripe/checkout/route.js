import { getDb } from '@/lib/db';
import { createCheckout, stripeConfigured } from '@/lib/billing/stripe';
import { ACTIVE } from '@/lib/billing';
import { publicOrigin } from '@/lib/origin';
import { handler, json, error, requireUser, rateLimit, provider } from '@/lib/http';

// Start paying for Pro with a card (Stripe Checkout).
export const POST = handler(async (req) => {
  await rateLimit(req, 'checkout', 20, 60 * 60 * 1000);
  const user = await requireUser();
  if (!stripeConfigured()) return error(503, 'stripe_not_configured');
  const db = await getDb();
  const dbUser = await db.users.findById(user.id);
  if (ACTIVE.includes(dbUser.billing?.status)) return error(409, 'already_subscribed');
  return json({ url: await provider(() => createCheckout({ user, dbUser, origin: publicOrigin(req) })) });
});
