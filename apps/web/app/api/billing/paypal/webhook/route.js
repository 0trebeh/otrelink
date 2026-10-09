// PayPal → Otrelink. In the PayPal developer dashboard: your app → Webhooks → add
//   https://YOUR-APP/api/billing/paypal/webhook
// Events: BILLING.SUBSCRIPTION.ACTIVATED, .UPDATED, .RE-ACTIVATED, .SUSPENDED, .CANCELLED, .EXPIRED, PAYMENT.SALE.COMPLETED
// Put the webhook's ID in PAYPAL_WEBHOOK_ID.
import { getDb } from '@/lib/db';
import { verifyWebhook, getSubscription, stateFromSubscription } from '@/lib/billing/paypal';
import { billingPatch } from '@/lib/billing';
import { qualifyReferral, refundPaypalIfCredit } from '@/lib/referrals';

export async function POST(req) {
  const raw = await req.text();
  try {
    if (!(await verifyWebhook(req.headers, raw))) return new Response('invalid signature', { status: 400 });
    const event = JSON.parse(raw);
    const r = event.resource || {};
    // Subscription id: the resource itself, or billing_agreement_id on payments.
    const subId = event.event_type?.startsWith('BILLING.SUBSCRIPTION.') ? r.id : r.billing_agreement_id;
    if (!subId) return Response.json({ received: true });
    // Always read the current state from PayPal instead of trusting the payload.
    const sub = await getSubscription(subId);
    const db = await getDb();
    const user = (sub.custom_id && await db.users.findById(sub.custom_id)) || await db.users.findBySubscription(subId);
    if (user) await db.users.update(user.id, billingPatch(user, stateFromSubscription(sub)));
    // Each completed payment is recorded (users download its PDF invoice from the Plan page).
    if (user && event.event_type === 'PAYMENT.SALE.COMPLETED' && r.id && Number(r.amount?.total) > 0) {
      const payment = await db.payments.record({
        userId: user.id, provider: 'paypal', providerId: r.id,
        amount: Number(r.amount.total), currency: String(r.amount.currency || 'USD').toUpperCase(),
        periodStart: r.create_time || null,
        periodEnd: sub.billing_info?.next_billing_time || null,
        description: 'Otrelink Pro — monthly subscription',
      });
      // Free months from referrals: this payment is refunded. Then: the payer's own referral qualifies.
      await refundPaypalIfCredit(db, user, payment).catch((err) => console.error('[otrelink] referral refund failed:', err));
      await qualifyReferral(db, user.id, 'paypal').catch((err) => console.error('[otrelink] referral qualify failed:', err));
    }
    return Response.json({ received: true });
  } catch (err) {
    console.error('[otrelink] PayPal webhook failed:', err);
    return new Response('error', { status: 500 }); // PayPal retries
  }
}
