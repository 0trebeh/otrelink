import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUser } from '@/lib/auth';
import { getSubscription, stateFromSubscription } from '@/lib/billing/paypal';
import { billingPatch } from '@/lib/billing';
import { publicOrigin } from '@/lib/origin';

// PayPal sends the user back here after approving: ?subscription_id=I-…
export async function GET(req) {
  const origin = publicOrigin(req);
  const back = (q) => NextResponse.redirect(`${origin}/dashboard/plan${q}`);
  const id = new URL(req.url).searchParams.get('subscription_id');
  const user = await getUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);
  if (!id) return back('?paid=error');
  try {
    const sub = await getSubscription(id);
    if (sub.custom_id !== user.id) return back('?paid=error');
    const db = await getDb();
    const dbUser = await db.users.findById(user.id);
    // APPROVED becomes ACTIVE a moment later; treat it as active (the webhook confirms it).
    const state = stateFromSubscription(sub.status === 'APPROVED' ? { ...sub, status: 'ACTIVE' } : sub);
    await db.users.update(user.id, billingPatch(dbUser, state));
    return back('?paid=paypal');
  } catch (err) {
    console.error('[otrelink] PayPal return failed:', err);
    return back('?paid=error');
  }
}
