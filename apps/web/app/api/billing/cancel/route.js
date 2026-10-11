import { getDb } from '@/lib/db';
import * as stripe from '@/lib/billing/stripe';
import * as paypal from '@/lib/billing/paypal';
import { billingPatch, ACTIVE } from '@/lib/billing';
import { handler, json, error, requireUser, provider } from '@/lib/http';

// The user goes back to Free: stop renewing the subscription (card or PayPal).
// Nothing is refunded; Pro stays until the end of the period already paid and
// then the account moves to Free (Stripe tells us when it ends; for PayPal the cron job does it).
export const POST = handler(async () => {
  const user = await requireUser();
  const db = await getDb();
  const dbUser = await db.users.findById(user.id);
  const b = dbUser.billing;
  if (!b?.subscriptionId || !ACTIVE.includes(b.status)) return error(404, 'no_subscription');
  if (b.cancelAtPeriodEnd) return json({ billing: b });

  let state;
  if (b.provider === 'stripe') {
    const sub = await provider(() => stripe.cancelAtPeriodEnd(b.subscriptionId));
    state = stripe.stateFromSubscription(sub);
  } else if (b.provider === 'paypal') {
    await provider(() => paypal.cancelSubscription(b.subscriptionId));
    const sub = await paypal.getSubscription(b.subscriptionId).catch(() => ({ id: b.subscriptionId, status: 'CANCELLED' }));
    state = paypal.stateFromSubscription({ ...sub, billing_info: { next_billing_time: b.currentPeriodEnd, ...sub.billing_info } });
  } else return error(404, 'no_subscription');

  const updated = await db.users.update(user.id, billingPatch(dbUser, state));
  return json({ billing: updated.billing, plan: updated.plan });
});
