import Link from 'next/link';
import LegalPage, { Contact } from '@/components/legal/LegalPage';
import { LEGAL_VERSIONS } from '@/lib/legal';
import { PLANS } from '@otrelink/core';

export const metadata = { title: 'Refund Policy — Otrelink', description: 'Cancelling, refunds and billing problems.' };

export default function RefundsPage() {
  return (
    <LegalPage path="/refunds" title="Refund Policy" version={LEGAL_VERSIONS.refunds}
      intro="We want paying for Otrelink to be simple and fair. Here is how cancelling and refunds work.">
      <h2>1. How billing works</h2>
      <p>The free plan costs nothing. Pro is a monthly subscription (currently ${PLANS.pro.price} USD per month, plus any taxes that apply) that is charged at the start of each month and <strong>renews automatically until you cancel</strong>. Payments are processed by Stripe or PayPal.</p>

      <h2>2. Cancel at any time</h2>
      <p>Cancel online in one click on the <strong>Plan</strong> page of your dashboard. The subscription stops renewing, you keep Pro until the end of the month you already paid, and then your account moves to the free plan. Your pages and content are not deleted.</p>

      <h2>3. When you can get a refund</h2>
      <ul>
        <li><strong>First payment, 14 days:</strong> if Pro is not for you, ask for a refund within 14 days of your first Pro payment and we will refund it in full. This applies once per customer.</li>
        <li><strong>Billing errors:</strong> duplicate charges, charges after you cancelled, or a charge for the wrong amount are refunded in full. Tell us within 60 days of the charge.</li>
        <li><strong>Service problems:</strong> if Otrelink was unavailable or a paid feature did not work for a significant part of a billing period because of a problem on our side, we will give you a refund or credit for that period.</li>
        <li><strong>Where the law gives you more:</strong> if the law where you live gives you a right to cancel or to a refund (for example, the 14-day right of withdrawal for consumers in the European Union and the United Kingdom), you have that right in addition to this policy.</li>
      </ul>

      <h2>4. When refunds are not given</h2>
      <ul>
        <li>Partial months: cancelling stops the next renewal; the current month is not refunded pro rata, except in the cases above.</li>
        <li>Deleting your account: this cancels your subscription immediately; the rest of the current month is not refunded, except in the cases above.</li>
        <li>Accounts closed for breaking the <Link href="/terms">Terms of Service</Link> (for example fraud, spam or illegal content).</li>
        <li>Pro time received for free, such as through referrals.</li>
        <li>Business plans follow the terms agreed for them.</li>
      </ul>

      <h2>5. How to ask</h2>
      <p>Write to <Contact /> from the email on your account, with the date and amount of the charge. We answer within 5 business days. Approved refunds go back to the original payment method (card or PayPal); your bank or PayPal may take 5 to 10 business days to show them.</p>
      <p>Please contact us before disputing a charge with your bank: we can usually solve it faster.</p>

      <h2>6. Price changes</h2>
      <p>If the price of your plan changes, we tell you by email at least 30 days before your next renewal at the new price, so you can cancel before it applies.</p>
    </LegalPage>
  );
}
