// Stripe → Otrelink. In Stripe: Developers → Webhooks → add endpoint
//   https://YOUR-APP/api/billing/stripe/webhook
// Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
import { getDb } from '@/lib/db';
import { verifyWebhook, getSubscription, stateFromSubscription } from '@/lib/billing/stripe';
import { billingPatch } from '@/lib/billing';

export async function POST(req) {
  const raw = await req.text();
  let event;
  try {
    event = verifyWebhook(raw, req.headers.get('stripe-signature'));
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }
  try {
    const db = await getDb();
    const obj = event.data?.object || {};
    let sub = null;
    let userId = null;
    if (event.type === 'checkout.session.completed' && obj.mode === 'subscription') {
      userId = obj.client_reference_id || obj.metadata?.userId;
      sub = await getSubscription(obj.subscription);
    } else if (event.type.startsWith('customer.subscription.')) {
      sub = obj;
      userId = obj.metadata?.userId;
    }
    if (sub) {
      const user = (userId && await db.users.findById(userId)) || await db.users.findBySubscription(sub.id);
      if (user) await db.users.update(user.id, billingPatch(user, stateFromSubscription(sub)));
      else console.warn('[otrelink] Stripe webhook: no user for subscription', sub.id);
    }
    return Response.json({ received: true });
  } catch (err) {
    console.error('[otrelink] Stripe webhook failed:', err);
    return new Response('error', { status: 500 }); // Stripe retries
  }
}
