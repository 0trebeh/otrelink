// Check the PayPal plan, or create it in the account of your credentials.
//
//   node apps/web/scripts/paypal-plan.mjs            → checks PAYPAL_PLAN_ID
//   node apps/web/scripts/paypal-plan.mjs --create   → creates "Otrelink Pro" ($10/month) and prints its P-… id
//
// Uses PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE (sandbox | live) and
// PAYPAL_PLAN_ID from the environment or from apps/web/.env. Optional: --price 10 --currency USD
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const envFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*(?:#.*)?$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
const clean = (v) => String(v || '').trim().replace(/^(['"])(.*)\1$/, '$2').trim();
const arg = (name, def) => { const i = process.argv.indexOf(`--${name}`); return i > -1 ? process.argv[i + 1] : def; };
const id = clean(process.env.PAYPAL_CLIENT_ID);
const secret = clean(process.env.PAYPAL_CLIENT_SECRET);
const mode = ['live', 'production'].includes(clean(process.env.PAYPAL_MODE).toLowerCase()) ? 'live' : 'sandbox';
const base = clean(process.env.PAYPAL_API_BASE) || (mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');
const planId = clean(process.env.PAYPAL_PLAN_ID);
if (!id || !secret) { console.error('Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET (environment or apps/web/.env).'); process.exit(1); }

const auth = await fetch(`${base}/v1/oauth2/token`, {
  method: 'POST',
  headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'grant_type=client_credentials',
}).then((r) => r.json());
if (!auth.access_token) { console.error(`✗ PayPal ${mode}: credentials refused (${auth.error_description || auth.error}). Check that they are ${mode} credentials.`); process.exit(1); }
console.log(`✓ PayPal ${mode}: credentials OK (app ${auth.app_id || '?'})`);

const call = async (p, body) => {
  const r = await fetch(`${base}${p}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(`${json.message || r.status}${json.details?.[0] ? ` (${json.details[0].issue})` : ''}`), { status: r.status });
  return json;
};

if (!process.argv.includes('--create')) {
  if (!planId) { console.log('PAYPAL_PLAN_ID is empty. Run with --create to make the plan.'); process.exit(1); }
  try {
    const plan = await call(`/v1/billing/plans/${encodeURIComponent(planId)}`);
    const price = plan.billing_cycles?.[0]?.pricing_scheme?.fixed_price;
    console.log(`✓ Plan ${plan.id}${plan.name ? `: "${plan.name}"` : ""} · ${plan.status}${price ? ` · ${price.value} ${price.currency_code}` : ''}`);
    if (plan.status !== 'ACTIVE') console.log('✗ The plan is not ACTIVE: activate it in PayPal (or run with --create).');
  } catch (err) {
    console.log(`✗ Plan ${planId} not found for these credentials (${err.message}).`);
    console.log('  It belongs to another PayPal account or mode. Run with --create to make one in the right account.');
    process.exit(1);
  }
  process.exit(0);
}

const price = String(arg('price', '10'));
const currency = String(arg('currency', 'USD')).toUpperCase();
const product = await call('/v1/catalogs/products', { name: 'Otrelink Pro', type: 'SERVICE', category: 'SOFTWARE', description: 'Otrelink Pro monthly subscription' });
console.log(`✓ Product ${product.id}`);
const plan = await call('/v1/billing/plans', {
  product_id: product.id,
  name: 'Otrelink Pro',
  status: 'ACTIVE',
  billing_cycles: [{ frequency: { interval_unit: 'MONTH', interval_count: 1 }, tenure_type: 'REGULAR', sequence: 1, total_cycles: 0, pricing_scheme: { fixed_price: { value: price, currency_code: currency } } }],
  payment_preferences: { auto_bill_outstanding: true, setup_fee_failure_action: 'CONTINUE', payment_failure_threshold: 2 },
});
console.log(`✓ Plan ${plan.id} · ${plan.status} · ${price} ${currency}/month`);
console.log(`\nPut this in Render → Environment:\n  PAYPAL_PLAN_ID=${plan.id}`);
