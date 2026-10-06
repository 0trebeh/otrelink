import { getDb } from '@/lib/db';
import { createPortal, stripeConfigured } from '@/lib/billing/stripe';
import { publicOrigin } from '@/lib/origin';
import { handler, json, error, requireUser, provider } from '@/lib/http';

// Manage the Stripe subscription (card, invoices, cancel).
export const POST = handler(async (req) => {
  const user = await requireUser();
  if (!stripeConfigured()) return error(503, 'stripe_not_configured');
  const db = await getDb();
  const dbUser = await db.users.findById(user.id);
  if (dbUser.billing?.provider !== 'stripe' || !dbUser.billing.customerId) return error(404, 'no_subscription');
  return json({ url: await provider(() => createPortal({ customerId: dbUser.billing.customerId, origin: publicOrigin(req) })) });
});
