// Subscription state → plan. Shared by Stripe and PayPal.
//
// user.billing = {
//   provider: 'stripe' | 'paypal', customerId?, subscriptionId,
//   status: 'active' | 'past_due' | 'canceled' | 'pending',
//   currentPeriodEnd?, cancelAtPeriodEnd?, endsAt?,   // ISO dates
//   planBefore,  // plan to go back to when the subscription ends
// }
// Business accounts are managed by hand in the admin: payments never change them.

export const ACTIVE = ['active', 'past_due'];

/**
 * Patch for a user after a subscription change.
 * s = { provider, customerId?, subscriptionId, status, currentPeriodEnd?, cancelAtPeriodEnd?, endsAt? }
 */
export function billingPatch(user, s, now = new Date()) {
  const prev = user.billing || {};
  const sameSub = prev.subscriptionId && prev.subscriptionId === s.subscriptionId;
  const billing = {
    ...(sameSub ? prev : { planBefore: prev.planBefore }),
    provider: s.provider,
    subscriptionId: s.subscriptionId,
    status: s.status,
    updatedAt: now.toISOString(),
  };
  for (const k of ['customerId', 'currentPeriodEnd', 'cancelAtPeriodEnd', 'endsAt']) if (s[k] !== undefined) billing[k] = s[k];
  const patch = { billing };
  if (user.plan === 'business' || s.status === 'pending') return patch;

  if (ACTIVE.includes(s.status)) {
    // Remember the plan to come back to (accounts created before plans → Pro).
    if (!billing.planBefore) billing.planBefore = user.plan && user.plan !== 'pro' ? user.plan : user.plan ? 'free' : 'pro';
    billing.downgraded = false;
    patch.plan = 'pro';
  } else if (s.status === 'canceled') {
    const endsAt = s.endsAt ? new Date(s.endsAt) : now;
    if (endsAt <= now) {
      patch.plan = billing.planBefore || 'free';
      billing.downgraded = true;
    }
    // Otherwise Pro stays until endsAt; the cron job downgrades it then.
  }
  return patch;
}

/** Users whose cancelled subscription has reached its end (run from the cron job). */
export async function downgradeEnded(db, now = new Date()) {
  const users = await db.users.listBillingEnded(now.toISOString());
  for (const u of users) await db.users.update(u.id, { plan: u.billing.planBefore || 'free', billing: { ...u.billing, downgraded: true } });
  return users.length;
}
