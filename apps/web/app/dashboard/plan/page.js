import { getUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { config } from '@/lib/config';
import { stripeConfigured } from '@/lib/billing/stripe';
import { paypalConfigured } from '@/lib/billing/paypal';
import PlanPage from '@/components/PlanPage';

export const metadata = { title: 'Plans — Otrelink' };

export default async function Plans() {
  const user = await getUser();
  const db = await getDb();
  const pagesUsed = await db.pages.countByUser(user.id);
  return (
    <PlanPage
      user={user}
      pagesUsed={pagesUsed}
      payments={{ stripe: stripeConfigured(), paypal: paypalConfigured(), contactEmail: config.businessContactEmail }}
    />
  );
}
