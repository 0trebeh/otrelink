// ─────────────────────────────────────────────────────────────
//  REFERRALS
//  Every user shares a link (…/register?ref=CODE). When someone signs up with
//  it and later pays for Pro (first real payment) or is moved to Business by
//  the admin, the referral is "qualified". If the sign-up happened during an
//  active campaign, the inviter is rewarded:
//    • Pro inviter  → `freeMonths` free months of their subscription
//                     (Stripe: account credit; PayPal: the next payments are refunded).
//    • Free inviter → `freeUserMonths` months of Pro for free (default 1).
//    • Business     → no automatic reward (their price is agreed by hand).
//  Campaigns are created in Otrelink-Admin.
//
//  campaign = { id, name, startsAt, endsAt, freeMonths, freeUserMonths, maxPerReferrer, enabled }
//  referral = { id, referrerId, refereeId, campaignId, status, months, appliedMonths,
//               reason, createdAt, qualifiedAt, qualifiedBy }
//  status: 'pending' (signed up) | 'rewarded' (free months earned)
//        | 'qualified' (subscribed, but no reward — see `reason`)
// ─────────────────────────────────────────────────────────────

/** Plans that see the referral program. */
export const REFERRAL_PLANS = ['free', 'pro', 'business'];
/** Plans whose users are rewarded: Pro (free months) and Free (months of Pro). */
export const REFERRAL_REWARD_PLANS = ['pro', 'free'];
export const MAX_FREE_MONTHS = 12;

export const REFERRAL_REASONS = {
  no_campaign: 'No campaign was active when they signed up.',
  campaign_off: 'The campaign was turned off.',
  not_pro: 'Business accounts don’t get automatic rewards.',
  limit: 'You reached this campaign’s limit of rewards.',
  banned: 'Account suspended.',
};

const iso = (v) => {
  if (!v) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00.000Z` : v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
/** "YYYY-MM-DD" end dates include that whole day. */
const isoEnd = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? `${v}T23:59:59.999Z` : iso(v));

/** Clean a campaign coming from the admin. Returns null when it can't be used. */
export function sanitizeCampaign(input = {}) {
  const startsAt = iso(input.startsAt);
  const endsAt = isoEnd(input.endsAt);
  if (!startsAt || !endsAt || endsAt <= startsAt) return null;
  const months = Math.round(Number(input.freeMonths));
  const freeUser = Math.round(Number(input.freeUserMonths ?? 1));
  const max = Math.round(Number(input.maxPerReferrer));
  return {
    name: String(input.name || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 80) || 'Referral campaign',
    startsAt,
    endsAt,
    freeMonths: Number.isFinite(months) ? Math.min(MAX_FREE_MONTHS, Math.max(1, months)) : 1,
    freeUserMonths: Number.isFinite(freeUser) ? Math.min(MAX_FREE_MONTHS, Math.max(1, freeUser)) : 1,
    maxPerReferrer: Number.isFinite(max) && max > 0 ? Math.min(1000, max) : 0, // 0 = no limit
    enabled: input.enabled !== false,
  };
}

/** Whether a campaign runs at `now`. */
export const campaignActive = (c, now = new Date()) => {
  if (!c || c.enabled === false) return false;
  const t = new Date(now).toISOString();
  return c.startsAt <= t && t <= c.endsAt;
};

/** The campaign running at `now` (if several overlap: the one that gives most months, then the newest). */
export function activeCampaign(campaigns = [], now = new Date()) {
  return campaigns
    .filter((c) => campaignActive(c, now))
    .sort((a, b) => b.freeMonths - a.freeMonths || String(b.startsAt).localeCompare(String(a.startsAt)))[0] || null;
}

/** "AB7K2QXM": 8 characters without look-alikes (no 0/O, 1/I/L). */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function makeReferralCode(random = Math.random) {
  let s = '';
  for (let i = 0; i < 8; i++) s += ALPHABET[Math.floor(random() * ALPHABET.length)];
  return s;
}
export const cleanReferralCode = (v) => String(v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);

/** Same mailbox? (gmail ignores dots and +tags; others only +tags). Stops self-referrals. */
export function sameMailbox(a, b) {
  const n = (e) => {
    const [user = '', domain = ''] = String(e || '').toLowerCase().trim().split('@');
    let u = user.split('+')[0];
    const d = domain === 'googlemail.com' ? 'gmail.com' : domain;
    if (d === 'gmail.com') u = u.replace(/\./g, '');
    return `${u}@${d}`;
  };
  return Boolean(a && b) && n(a) === n(b);
}

/** "ju***@gmail.com" — what the inviter sees about the people they invited. */
export function maskEmail(email) {
  const [user = '', domain = ''] = String(email || '').split('@');
  if (!domain) return '***';
  return `${user.slice(0, Math.min(2, Math.max(1, user.length - 1)))}***@${domain}`;
}

/**
 * Decide the reward when a referral qualifies.
 * → { status: 'rewarded', months, kind: 'credit' | 'pro-trial' } or { status: 'qualified', months: 0, reason }
 *   credit    = free months of a Pro subscription
 *   pro-trial = months of Pro given to a Free account
 */
export function rewardFor({ referrer, campaign, rewardedInCampaign = 0 }) {
  if (!referrer || referrer.banned) return { status: 'qualified', months: 0, reason: 'banned' };
  if (!campaign) return { status: 'qualified', months: 0, reason: 'no_campaign' };
  if (campaign.enabled === false) return { status: 'qualified', months: 0, reason: 'campaign_off' };
  // Accounts from before plans (no plan field) are Pro.
  const plan = referrer.plan || 'pro';
  if (!REFERRAL_REWARD_PLANS.includes(plan)) return { status: 'qualified', months: 0, reason: 'not_pro' };
  if (campaign.maxPerReferrer && rewardedInCampaign >= campaign.maxPerReferrer) return { status: 'qualified', months: 0, reason: 'limit' };
  if (plan === 'free') return { status: 'rewarded', months: campaign.freeUserMonths || 1, kind: 'pro-trial' };
  return { status: 'rewarded', months: campaign.freeMonths, kind: 'credit' };
}

/** Free months earned but not given yet (Stripe credit not added / PayPal payments not refunded yet). */
export const pendingMonths = (referrals = []) => referrals
  .filter((r) => r.status === 'rewarded' && r.kind !== 'pro-trial')
  .reduce((n, r) => n + Math.max(0, (r.months || 0) - (r.appliedMonths || 0)), 0);

/** Totals for the dashboard. */
export function referralStats(referrals = []) {
  const rewarded = referrals.filter((r) => r.status === 'rewarded');
  return {
    signedUp: referrals.length,
    subscribed: referrals.filter((r) => r.status !== 'pending').length,
    monthsEarned: rewarded.reduce((n, r) => n + (r.months || 0), 0),
    monthsApplied: rewarded.reduce((n, r) => n + Math.min(r.months || 0, r.appliedMonths || 0), 0),
    monthsPending: pendingMonths(referrals),
  };
}

/**
 * Spread `months` over referrals with pending months, oldest first.
 * → [{ id, appliedMonths }] (the new appliedMonths of each one changed)
 */
export function allocateMonths(referrals = [], months = 1) {
  let left = months;
  const out = [];
  for (const r of [...referrals].filter((x) => x.status === 'rewarded' && x.kind !== 'pro-trial').sort((a, b) => String(a.qualifiedAt || a.createdAt).localeCompare(String(b.qualifiedAt || b.createdAt)))) {
    if (left <= 0) break;
    const free = (r.months || 0) - (r.appliedMonths || 0);
    if (free <= 0) continue;
    const take = Math.min(free, left);
    out.push({ id: r.id, appliedMonths: (r.appliedMonths || 0) + take });
    left -= take;
  }
  return out;
}

/** Pro given for free until `until` (ISO), counting from the later of now or the current end. */
export function extendProTrial(currentUntil, months, now = new Date()) {
  const from = currentUntil && new Date(currentUntil) > now ? new Date(currentUntil) : new Date(now);
  const d = new Date(from);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString();
}
