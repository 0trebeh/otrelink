import { getDb } from '@/lib/db';
import { cancelSubscription, getSubscription, stateFromSubscription } from '@/lib/billing/paypal';
import { billingPatch } from '@/lib/billing';
import { handler, json, error, requireUser, provider } from '@/lib/http';

// Cancel the PayPal subscription. Pro stays until the end of the period already paid.
export const POST = handler(async () => {
  const user = await requireUser();
  const db = await getDb();
  const dbUser = await db.users.findById(user.id);
  const b = dbUser.billing;
  if (b?.provider !== 'paypal' || !b.subscriptionId) return error(404, 'no_subscription');
  await provider(() => cancelSubscription(b.subscriptionId));
  const sub = await getSubscription(b.subscriptionId).catch(() => ({ id: b.subscriptionId, status: 'CANCELLED', billing_info: { next_billing_time: b.currentPeriodEnd } }));
  const updated = await db.users.update(user.id, billingPatch(dbUser, stateFromSubscription({ ...sub, billing_info: { next_billing_time: b.currentPeriodEnd, ...sub.billing_info } })));
  return json({ billing: updated.billing });
});
