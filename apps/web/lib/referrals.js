// Referral program (server side). Rules live in @otrelink/core (referrals.js).
//
//  1. Sign-up with …/register?ref=CODE → referral "pending" (the campaign active
//     at that moment is saved with it).
//  2. The new account's first real Pro payment (Stripe invoice.paid / PayPal
//     PAYMENT.SALE.COMPLETED), or the admin moving it to Business → qualified.
//     If the campaign allows it → "rewarded" (Business inviters: counted, no reward).
//  3. A Free inviter gets Pro for free right away (1 month by default; months
//     stack). The cron job puts them back on Free when it ends, unless they subscribed.
//     A Pro inviter's free months are given right away when possible:
//       Stripe subscriber → credit on their Stripe balance (N × Pro price).
//       PayPal subscriber → their next N payments are refunded as they arrive.
//       No subscription yet → they wait and are given when the inviter subscribes.
import {
  activeCampaign, cleanReferralCode, makeReferralCode, sameMailbox, rewardFor, allocateMonths, pendingMonths,
  REFERRAL_PLANS, maskEmail, extendProTrial,
} from '@otrelink/core';
import * as stripe from './billing/stripe.js';
import * as paypal from './billing/paypal.js';

const log = (...a) => console.log('[otrelink] referrals:', ...a);

/** The user's referral code (created the first time). */
export async function ensureReferralCode(db, user) {
  if (user.referralCode) return user.referralCode;
  for (let i = 0; i < 6; i++) {
    const code = makeReferralCode();
    if (!(await db.users.findByReferralCode(code))) {
      await db.users.update(user.id, { referralCode: code });
      return code;
    }
  }
  throw new Error('could not create a referral code');
}

export const canSeeReferrals = (publicUser) => REFERRAL_PLANS.includes(publicUser?.plan?.id);

/** A new account signed up with a referral code. Never fails the sign-up. */
export async function recordSignup(db, newUser, rawCode, now = new Date()) {
  try {
    const code = cleanReferralCode(rawCode);
    if (!code) return null;
    const referrer = await db.users.findByReferralCode(code);
    // Any plan can invite (accounts from before plans count as Pro).
    if (!referrer || referrer.id === newUser.id || referrer.banned || !REFERRAL_PLANS.includes(referrer.plan || 'pro')) return null;
    if (sameMailbox(referrer.email, newUser.email)) return null;
    const campaign = activeCampaign(await db.referralCampaigns.list(), now);
    const r = await db.referrals.create({ referrerId: referrer.id, refereeId: newUser.id, campaignId: campaign?.id || null, code });
    await db.users.update(newUser.id, { referredBy: referrer.id });
    return r;
  } catch (err) {
    console.error('[otrelink] referral sign-up failed:', err);
    return null;
  }
}

/**
 * The referred account paid for Pro or became Business. Gives the inviter their
 * free months (once). `by` = 'stripe' | 'paypal' | 'admin'.
 */
export async function qualifyReferral(db, refereeId, by, now = new Date()) {
  const ref = await db.referrals.findByReferee(refereeId);
  if (!ref || ref.status !== 'pending') return null;
  const referrer = await db.users.findById(ref.referrerId);
  const campaign = ref.campaignId ? await db.referralCampaigns.findById(ref.campaignId) : null;
  const rewardedInCampaign = campaign ? await db.referrals.countRewarded({ referrerId: ref.referrerId, campaignId: campaign.id }) : 0;
  // Someone on free Pro from an earlier referral is still a Free account for the rules.
  const asPlan = referrer && onProTrial(referrer, now) ? { ...referrer, plan: 'free' } : referrer;
  const result = rewardFor({ referrer: asPlan, campaign, rewardedInCampaign });
  const updated = await db.referrals.update(ref.id, {
    status: result.status, months: result.months, kind: result.kind || null, reason: result.reason || null,
    qualifiedAt: now.toISOString(), qualifiedBy: by,
  });
  log(`${ref.refereeId} qualified (${by}) → ${result.status}${result.months ? ` ${result.months} month(s) ${result.kind}` : ` (${result.reason})`}`);
  if (result.status === 'rewarded' && referrer) {
    if (result.kind === 'pro-trial') await grantProTrial(db, referrer, result.months, updated, now);
    else await applyStripeCredit(db, referrer).catch((err) => console.error('[otrelink] referral credit failed:', err));
  }
  return updated;
}

const PAYING = ['active', 'past_due'];

/** On Pro only because of a referral (not paying for it). */
export const onProTrial = (u, now = new Date()) => u?.plan === 'pro' && Boolean(u.proTrial?.until) && new Date(u.proTrial.until) > now
  && !PAYING.includes(u.billing?.status);

/** Give a Free account `months` of Pro (stacks on top of free Pro it already has). */
export async function grantProTrial(db, user, months, referral, now = new Date()) {
  const fresh = await db.users.findById(user.id);
  if (!fresh || fresh.plan === 'business') return null;
  const until = extendProTrial(fresh.proTrial?.until, months, now);
  await db.users.update(fresh.id, { plan: 'pro', proTrial: { until, planBefore: fresh.proTrial?.planBefore || 'free' } });
  if (referral) await db.referrals.update(referral.id, { appliedMonths: months, appliedVia: 'pro-trial' });
  log(`${fresh.id}: Pro for free until ${until}`);
  return until;
}

/** Cron: free Pro from referrals that has ended → back to Free (unless they now pay for Pro). */
export async function endProTrials(db, now = new Date()) {
  const users = await db.users.listProTrialEnded(now.toISOString());
  for (const u of users) {
    if (PAYING.includes(u.billing?.status)) await db.users.update(u.id, { proTrial: null });
    else await db.users.update(u.id, { plan: u.proTrial.planBefore || 'free', proTrial: null });
  }
  return users.length;
}

/**
 * Stripe subscribers: turn pending free months into credit on their Stripe
 * balance (it pays their next invoices). PayPal ones get refunds instead (below).
 */
export async function applyStripeCredit(db, user) {
  const b = user.billing;
  if (b?.provider !== 'stripe' || !b.customerId || !['active', 'past_due'].includes(b.status) || !stripe.stripeConfigured()) return 0;
  const refs = await db.referrals.listByReferrer(user.id);
  const months = pendingMonths(refs);
  if (!months) return 0;
  const price = await stripe.getProPrice();
  await stripe.addCustomerCredit(b.customerId, price.amount * months, price.currency, `Otrelink referral reward: ${months} free month${months === 1 ? '' : 's'}`);
  for (const a of allocateMonths(refs, months)) await db.referrals.update(a.id, { appliedMonths: a.appliedMonths, appliedVia: 'stripe-credit' });
  log(`${user.id}: ${months} month(s) credited on Stripe`);
  return months;
}

/**
 * PayPal subscribers: a payment just arrived. If the user has free months
 * waiting, refund this payment and count one month as given.
 */
export async function refundPaypalIfCredit(db, user, payment) {
  if (!payment || payment.refunded || !paypal.paypalConfigured()) return false;
  const refs = await db.referrals.listByReferrer(user.id);
  if (!pendingMonths(refs)) return false;
  await paypal.refundSale(payment.providerId, 'Otrelink referral reward: free month');
  const [a] = allocateMonths(refs, 1);
  if (a) await db.referrals.update(a.id, { appliedMonths: a.appliedMonths, appliedVia: 'paypal-refund' });
  await db.payments.update(payment.id, { refunded: true, refundReason: 'referral' });
  log(`${user.id}: PayPal payment ${payment.providerId} refunded (free month)`);
  return true;
}

/** What the dashboard shows the inviter. */
export async function referralOverview(db, publicUser, origin, now = new Date()) {
  const full = await db.users.findById(publicUser.id);
  const code = await ensureReferralCode(db, full);
  const [refs, campaigns] = await Promise.all([db.referrals.listByReferrer(publicUser.id), db.referralCampaigns.list()]);
  const campaign = activeCampaign(campaigns, now);
  const people = await Promise.all(refs.map(async (r) => ({ r, u: await db.users.findById(r.refereeId) })));
  return {
    code,
    link: `${origin}/register?ref=${code}`,
    campaign: campaign ? { name: campaign.name, freeMonths: campaign.freeMonths, freeUserMonths: campaign.freeUserMonths || 1, endsAt: campaign.endsAt, maxPerReferrer: campaign.maxPerReferrer } : null,
    // What a reward means for this account: free months of the subscription, months of Pro, or nothing (Business).
    rewardKind: (full.plan || 'pro') === 'business' ? 'none' : onProTrial(full, now) || full.plan === 'free' ? 'pro-trial' : 'credit',
    proTrialUntil: onProTrial(full, now) ? full.proTrial.until : null,
    referrals: people.filter((x) => x.u).map(({ r, u }) => ({
      id: r.id, email: maskEmail(u.email), createdAt: r.createdAt, status: r.status, months: r.months || 0,
      appliedMonths: r.appliedMonths || 0, kind: r.kind || null, reason: r.reason || null, qualifiedAt: r.qualifiedAt || null,
    })),
  };
}

