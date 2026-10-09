// Stripe (REST API, no SDK). Docs: https://docs.stripe.com/api
import crypto from 'node:crypto';
import { config } from '../config.js';

export const stripeConfigured = () => Boolean(config.stripeSecretKey && config.stripePriceId);

/** Encode nested params the way Stripe expects (a[b][0][c]=…). */
function encode(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === 'object') encode(v, key, out);
    else out.append(key, String(v));
  }
  return out;
}

async function stripe(path, params = null, method = 'POST') {
  const res = await fetch(`${config.stripeApiBase}/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${config.stripeSecretKey}`, ...(params ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
    body: params ? encode(params) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json.error?.message || `Stripe ${res.status}`), { status: res.status });
  return json;
}

/** Checkout page for the monthly Pro subscription. → URL */
export async function createCheckout({ user, dbUser, origin }) {
  const session = await stripe('/checkout/sessions', {
    mode: 'subscription',
    line_items: [{ price: config.stripePriceId, quantity: 1 }],
    client_reference_id: user.id,
    ...(dbUser.billing?.provider === 'stripe' && dbUser.billing.customerId ? { customer: dbUser.billing.customerId } : { customer_email: user.email }),
    metadata: { userId: user.id },
    subscription_data: { metadata: { userId: user.id } },
    allow_promotion_codes: 'true',
    success_url: `${origin}/dashboard/plan?paid=stripe`,
    cancel_url: `${origin}/dashboard/plan`,
  });
  return session.url;
}

/** Stripe's customer portal (change card, see invoices, cancel). → URL */
export async function createPortal({ customerId, origin }) {
  const session = await stripe('/billing_portal/sessions', { customer: customerId, return_url: `${origin}/dashboard/plan` });
  return session.url;
}

export const getSubscription = (id) => stripe(`/subscriptions/${encodeURIComponent(id)}`, null, 'GET');

// The Pro price (amount and currency), read once.
let priceCache = null;
export async function getProPrice() {
  if (priceCache && priceCache.id === config.stripePriceId) return priceCache;
  const p = await stripe(`/prices/${encodeURIComponent(config.stripePriceId)}`, null, 'GET');
  priceCache = { id: p.id, amount: p.unit_amount, currency: p.currency };
  return priceCache;
}

/**
 * Credit on the customer's Stripe balance (in cents): Stripe uses it on the next
 * invoices before charging the card. Used for referral free months.
 */
export const addCustomerCredit = (customerId, cents, currency, description) =>
  stripe(`/customers/${encodeURIComponent(customerId)}/balance_transactions`, { amount: -Math.abs(Math.round(cents)), currency, description });
export const cancelSubscription = (id) => stripe(`/subscriptions/${encodeURIComponent(id)}`, null, 'DELETE');

/** Verify the Stripe-Signature header. Returns the parsed event or throws. */
export function verifyWebhook(rawBody, header, secret = config.stripeWebhookSecret, toleranceSec = 300, now = Date.now()) {
  if (!secret) throw new Error('webhook secret not set');
  const parts = Object.fromEntries(String(header || '').split(',').map((p) => p.split('=')).filter((p) => p.length === 2).map(([k, v]) => [k.trim(), v]));
  const sigs = String(header || '').split(',').filter((p) => p.trim().startsWith('v1=')).map((p) => p.trim().slice(3));
  const t = Number(parts.t);
  if (!t || !sigs.length) throw new Error('bad signature header');
  if (Math.abs(now / 1000 - t) > toleranceSec) throw new Error('timestamp too old');
  const expected = crypto.createHmac('sha256', secret).update(`${t}.${rawBody}`).digest('hex');
  const ok = sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
  if (!ok) throw new Error('signature mismatch');
  return JSON.parse(rawBody);
}

/** Our subscription state from a Stripe subscription object. */
export function stateFromSubscription(sub) {
  const map = { active: 'active', trialing: 'active', past_due: 'past_due', canceled: 'canceled', unpaid: 'canceled', incomplete_expired: 'canceled', incomplete: 'pending', paused: 'canceled' };
  const end = sub.current_period_end || sub.items?.data?.[0]?.current_period_end;
  return {
    provider: 'stripe',
    customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
    subscriptionId: sub.id,
    status: map[sub.status] || 'pending',
    currentPeriodEnd: end ? new Date(end * 1000).toISOString() : undefined,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
  };
}
