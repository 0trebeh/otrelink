// PayPal Subscriptions (REST API). Docs: https://developer.paypal.com/docs/api/subscriptions/v1/
import { config } from '../config.js';

export const paypalConfigured = () => Boolean(config.paypalClientId && config.paypalClientSecret && config.paypalPlanId);
const base = () => config.paypalApiBase || (config.paypalMode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');

let cached = { token: '', exp: 0 };
async function token() {
  if (cached.token && cached.exp > Date.now() + 60e3) return cached.token;
  const res = await fetch(`${base()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error_description || `PayPal auth ${res.status}`);
  cached = { token: json.access_token, exp: Date.now() + (json.expires_in || 300) * 1000 };
  return cached.token;
}

async function paypal(path, body, method = body ? 'POST' : 'GET') {
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return {};
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // PayPal's own words: name, issue, field and debug_id (quote it to PayPal support).
    const d = json.details?.[0];
    const detail = [json.name, d?.issue, d?.field && `field ${d.field}`, d?.description, json.debug_id && `debug_id ${json.debug_id}`].filter(Boolean).join(' · ');
    throw Object.assign(new Error(`${json.message || `PayPal ${res.status}`}${detail ? ` (${detail})` : ''}`), { status: res.status, paypal: json });
  }
  return json;
}

/**
 * Why creating a subscription failed with "resource does not exist": check the
 * plan itself with the same credentials and say what is wrong, in plain words.
 */
export async function diagnosePlan(planId = config.paypalPlanId) {
  const where = `PayPal ${config.paypalMode} (${base()})`;
  if (!/^P-[A-Z0-9]+$/.test(planId)) return `PAYPAL_PLAN_ID "${planId}" doesn’t look like a plan id (P-…). A product id (PROD-…) is not a plan.`;
  try {
    const plan = await paypal(`/v1/billing/plans/${encodeURIComponent(planId)}`);
    if (plan.status !== 'ACTIVE') return `The plan ${planId} exists in ${where} but its status is ${plan.status}: activate it in PayPal.`;
    return `The plan ${planId} exists and is ACTIVE in ${where}; the problem is elsewhere (see the PayPal error above).`;
  } catch (err) {
    if (err.status === 404) return `The plan ${planId} doesn’t exist for these credentials in ${where}. It was probably created in the other mode (sandbox vs live) or under another PayPal (sandbox) business account than the app of PAYPAL_CLIENT_ID.`;
    return `Couldn’t check the plan: ${err.message}`;
  }
}

/** Start a subscription; the user approves it on PayPal. → approval URL */
export async function createSubscription({ user, origin }) {
  const sub = await paypal('/v1/billing/subscriptions', {
    plan_id: config.paypalPlanId,
    custom_id: user.id,
    subscriber: { email_address: user.email },
    application_context: {
      brand_name: 'Otrelink',
      user_action: 'SUBSCRIBE_NOW',
      shipping_preference: 'NO_SHIPPING',
      return_url: `${origin}/api/billing/paypal/return`,
      cancel_url: `${origin}/dashboard/plan`,
    },
  });
  return sub.links?.find((l) => l.rel === 'approve')?.href;
}

/** createSubscription, and when PayPal says the plan doesn't exist, log why. */
export async function startSubscription(args) {
  try {
    return await createSubscription(args);
  } catch (err) {
    if (err.status === 404 || err.paypal?.name === 'RESOURCE_NOT_FOUND' || /does not exist/i.test(err.message)) {
      console.error('[otrelink] PayPal plan check:', await diagnosePlan().catch((e) => e.message));
    }
    throw err;
  }
}

export const getSubscription = (id) => paypal(`/v1/billing/subscriptions/${encodeURIComponent(id)}`);
export const cancelSubscription = (id, reason = 'Cancelled by the user') =>
  paypal(`/v1/billing/subscriptions/${encodeURIComponent(id)}/cancel`, { reason });

/** Refund a subscription payment in full (referral free months). */
export const refundSale = (saleId, note) =>
  paypal(`/v1/payments/sale/${encodeURIComponent(saleId)}/refund`, { description: String(note || '').slice(0, 255) });

/** Ask PayPal whether a webhook call is genuine. */
export async function verifyWebhook(headers, rawBody) {
  if (!config.paypalWebhookId) return false;
  const h = (k) => headers.get(k) || '';
  const res = await paypal('/v1/notifications/verify-webhook-signature', {
    auth_algo: h('paypal-auth-algo'),
    cert_url: h('paypal-cert-url'),
    transmission_id: h('paypal-transmission-id'),
    transmission_sig: h('paypal-transmission-sig'),
    transmission_time: h('paypal-transmission-time'),
    webhook_id: config.paypalWebhookId,
    webhook_event: JSON.parse(rawBody),
  });
  return res.verification_status === 'SUCCESS';
}

/** Our subscription state from a PayPal subscription object. */
export function stateFromSubscription(sub, now = new Date()) {
  // After cancelling PayPal may drop next_billing_time: fall back to last payment + 1 month.
  const last = sub.billing_info?.last_payment?.time;
  const next = sub.billing_info?.next_billing_time
    || (last ? new Date(new Date(last).setMonth(new Date(last).getMonth() + 1)).toISOString() : undefined);
  const map = { ACTIVE: 'active', SUSPENDED: 'past_due', CANCELLED: 'canceled', EXPIRED: 'canceled', APPROVAL_PENDING: 'pending', APPROVED: 'pending' };
  const status = map[sub.status] || 'pending';
  return {
    provider: 'paypal',
    subscriptionId: sub.id,
    status,
    currentPeriodEnd: next || undefined,
    // A cancelled PayPal subscription keeps Pro until the period already paid ends.
    endsAt: status === 'canceled' ? (next && new Date(next) > now ? next : now.toISOString()) : undefined,
    cancelAtPeriodEnd: status === 'canceled',
  };
}
