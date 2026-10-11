import { getUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { accountInfo } from '@/lib/account';
import { emailConfigured } from '@/lib/notify';
import { stripeConfigured } from '@/lib/billing/stripe';
import { paypalConfigured } from '@/lib/billing/paypal';
import AccountPage from '@/components/AccountPage';

export const metadata = { title: 'Account — Otrelink' };

export default async function Account() {
  const user = await getUser();
  const db = await getDb();
  const [full, pagesUsed] = await Promise.all([db.users.findById(user.id), db.pages.countByUser(user.id)]);
  return (
    <AccountPage
      user={user}
      account={accountInfo(full)}
      pagesUsed={pagesUsed}
      emailLinks={emailConfigured()}
      canPay={stripeConfigured() || paypalConfigured()}
    />
  );
}
