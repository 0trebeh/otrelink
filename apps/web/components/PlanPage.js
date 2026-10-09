'use client';
import ThemeToggle from './ThemeToggle';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, Minus, CreditCard, Loader2, Mail, Sparkles, Download, ReceiptText } from 'lucide-react';
import { PLANS, groupedFeatures } from '@otrelink/core';
import { api, errorMessage } from '@/lib/client';
import { Button, Logo, cx } from './ui';

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString([], { dateStyle: 'long' }) : '');

function PayPalMark() {
  return <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M7.1 21.5H3.6a.5.5 0 0 1-.5-.6L5.9 3.1a.9.9 0 0 1 .9-.7h6.1c3.4 0 5.6 1.8 5 5-.7 3.9-3.4 5.5-6.9 5.5h-1.8a.9.9 0 0 0-.9.7l-1 6.5a.9.9 0 0 1-.2.4zm12-12.7c-.7 3.8-3.2 5.8-7 5.8h-1.4l-1.1 6.6a.5.5 0 0 0 .5.6h2.6a.8.8 0 0 0 .8-.6l.6-3.8a.8.8 0 0 1 .8-.6h.6c3 0 5.2-1.4 5.8-4.7.3-1.4.1-2.6-.6-3.3z" /></svg>;
}

export default function PlanPage({ user: initialUser, pagesUsed, payments }) {
  const params = useSearchParams();
  const paid = params.get('paid');
  const [user, setUser] = useState(initialUser);
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const [waiting, setWaiting] = useState(paid === 'stripe' || paid === 'paypal');
  const plan = user.plan;
  const b = user.billing;
  const subscribed = b && ['active', 'past_due'].includes(b.status);

  // After paying, the payment provider tells us in the background: check a few times.
  useEffect(() => {
    if (!waiting) return undefined;
    let n = 0;
    const t = setInterval(async () => {
      n++;
      const r = await api('/api/auth/me').catch(() => null);
      if (r?.user) setUser(r.user);
      if (r?.user?.plan.id === 'pro' || n >= 15) { setWaiting(false); clearInterval(t); }
    }, 2000);
    return () => clearInterval(t);
  }, [waiting]);

  const go = async (key, path) => {
    setBusy(key); setErr('');
    try {
      const { url } = await api(path, { method: 'POST' });
      window.location.href = url;
    } catch (e) { setErr(errorMessage(e)); setBusy(''); }
  };
  const cancelPaypal = async () => {
    if (!window.confirm('Cancel your PayPal subscription? You keep Pro until the end of the period you already paid.')) return;
    setBusy('cancel'); setErr('');
    try {
      await api('/api/billing/paypal/cancel', { method: 'POST' });
      const r = await api('/api/auth/me'); setUser(r.user);
    } catch (e) { setErr(errorMessage(e)); }
    setBusy('');
  };

  const featureRows = [
    { label: 'Pages', values: [`${PLANS.free.maxPages}`, `${PLANS.pro.maxPages}`, 'Custom'] },
    { label: 'Links, socials, text, images, video, music, maps, PDF, contact, collections, analytics', values: [true, true, true] },
    // Plan features, grouped by kind (a heading row before each group).
    ...groupedFeatures().flatMap((g) => [
      { label: g.label, heading: true },
      ...g.features.map((f) => ({ label: f.label, values: [f.free, !f.business, true] })),
    ]),
  ];

  const cards = [
    { id: 'free', price: '$0', period: 'forever' },
    { id: 'pro', price: `$${PLANS.pro.price}`, period: 'per month' },
    { id: 'business', price: 'Custom', period: 'made for you' },
  ];

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-3 h-16 px-4 sm:px-8">
        <Link href="/dashboard" className="inline-grid place-items-center size-9 rounded-full hover:bg-panel" aria-label="Back to my pages"><ArrowLeft size={19} /></Link>
        <Logo />
        <ThemeToggle className="ml-auto" />
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-8 pb-16">
        <h1 className="font-display text-4xl font-extrabold tracking-tight mt-4">Plans</h1>
        <p className="text-muted mt-1">You are on <b className="text-ink">{plan.label}</b> · {pagesUsed} of {plan.maxPages} page{plan.maxPages === 1 ? '' : 's'} used.</p>

        {user.proTrialUntil && (
          <p className="mt-5 rounded-2xl bg-teal/10 text-teal px-4 py-3 text-sm">You have <b>Pro for free until {fmtDate(user.proTrialUntil)}</b> thanks to your invites. Subscribe before then to keep Pro without a break; otherwise you go back to Free.</p>
        )}
        {paid === 'error' && <p className="mt-5 rounded-2xl bg-danger/10 text-danger px-4 py-3 text-sm">The payment could not be confirmed. If you were charged, it will appear in a few minutes; otherwise try again.</p>}
        {(paid === 'stripe' || paid === 'paypal') && (
          <p className="mt-5 rounded-2xl bg-teal/10 px-4 py-3 text-sm inline-flex items-center gap-2" role="status">
            {waiting ? <><Loader2 size={15} className="animate-spin" /> Confirming your payment…</> : plan.id === 'pro' ? <><Check size={15} /> Thank you! Your account is now Pro.</> : 'Payment received. Your plan will update in a moment — refresh this page.'}
          </p>
        )}
        {err && <p className="mt-5 rounded-2xl bg-danger/10 text-danger px-4 py-3 text-sm">{err}</p>}

        {b && b.status !== 'pending' && (
          <section className="mt-6 rounded-3xl bg-panel border border-line/70 p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Your subscription · {b.provider === 'stripe' ? 'Card (Stripe)' : 'PayPal'}</p>
              <p className="text-sm text-muted mt-0.5">
                {b.status === 'active' && !b.cancelAtPeriodEnd && `Renews on ${fmtDate(b.currentPeriodEnd)}.`}
                {b.status === 'active' && b.cancelAtPeriodEnd && `Cancelled. Pro until ${fmtDate(b.currentPeriodEnd)}.`}
                {b.status === 'past_due' && 'The last payment failed. Update your payment method to keep Pro.'}
                {b.status === 'canceled' && (plan.id === 'pro' ? `Cancelled. Pro until ${fmtDate(b.currentPeriodEnd)}.` : 'Cancelled.')}
              </p>
            </div>
            {b.provider === 'stripe' && b.status !== 'canceled' && (
              <Button onClick={() => go('portal', '/api/billing/stripe/portal')} disabled={!!busy}>
                {busy === 'portal' ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />} Manage subscription
              </Button>
            )}
            {b.provider === 'paypal' && subscribed && (
              <Button variant="danger" onClick={cancelPaypal} disabled={!!busy}>{busy === 'cancel' && <Loader2 size={15} className="animate-spin" />} Cancel subscription</Button>
            )}
          </section>
        )}

        <div className="grid md:grid-cols-3 gap-4 mt-8">
          {cards.map((c) => {
            const p = PLANS[c.id];
            const current = plan.id === c.id;
            return (
              <section key={c.id} className={cx('rounded-3xl bg-panel border p-6 flex flex-col', c.id === 'pro' ? 'border-accent shadow-[0_10px_40px_-20px_rgba(124,58,237,.6)]' : 'border-line/70')}>
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-display text-xl font-bold">{p.label}</h2>
                  {current && <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-ink text-white">{c.id === 'pro' && user.proTrialUntil ? 'Free for now' : 'Current'}</span>}
                  {!current && c.id === 'pro' && <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-accent-soft text-accent-ink">Popular</span>}
                </div>
                <p className="mt-3"><span className="font-display text-4xl font-extrabold">{c.price}</span> <span className="text-sm text-muted">{c.period}</span></p>
                <p className="text-sm text-muted mt-2 flex-1">{p.tagline}</p>
                <div className="mt-5 grid gap-2">
                  {c.id === 'pro' && (!current || user.proTrialUntil) && !subscribed && (
                    <>
                      {payments.stripe && (
                        <Button variant="primary" onClick={() => go('stripe', '/api/billing/stripe/checkout')} disabled={!!busy}>
                          {busy === 'stripe' ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />} Pay with card
                        </Button>
                      )}
                      {payments.paypal && (
                        <Button onClick={() => go('paypal', '/api/billing/paypal/checkout')} disabled={!!busy} className="!bg-[#ffc439] !border-[#ffc439] !text-[#003087] hover:!bg-[#f2b92f]">
                          {busy === 'paypal' ? <Loader2 size={16} className="animate-spin" /> : <PayPalMark />} Pay with PayPal
                        </Button>
                      )}
                      {!payments.stripe && !payments.paypal && <p className="text-sm text-muted">Online payments are not available yet.</p>}
                    </>
                  )}
                  {c.id === 'business' && !current && (
                    payments.contactEmail
                      ? <a href={`mailto:${payments.contactEmail}?subject=${encodeURIComponent('Otrelink Business plan')}`} className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full text-sm font-semibold bg-ink text-white hover:bg-black"><Mail size={16} /> Contact us</a>
                      : <p className="text-sm text-muted">Contact the Otrelink team to set it up.</p>
                  )}
                  {c.id === 'free' && !current && <p className="text-sm text-muted">{subscribed ? 'Cancel your subscription to go back to Free.' : ''}</p>}
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-10 rounded-3xl bg-panel border border-line/70 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-line">
                <th className="px-5 py-3 font-semibold">What you get</th>
                {cards.map((c) => <th key={c.id} className="px-5 py-3 font-semibold text-center">{PLANS[c.id].label}</th>)}
              </tr>
            </thead>
            <tbody>
              {featureRows.map((r) => (r.heading ? (
                <tr key={`g-${r.label}`} className="bg-soft/70">
                  <th colSpan={4} scope="colgroup" className="px-5 pt-4 pb-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted">{r.label}</th>
                </tr>
              ) : (
                <tr key={r.label} className="border-b border-line/60 last:border-0">
                  <td className="px-5 py-3">{r.label}</td>
                  {r.values.map((v, i) => (
                    <td key={i} className="px-5 py-3 text-center">
                      {v === true ? <Check size={17} className="inline text-teal" aria-label="Included" /> : v === false ? <Minus size={17} className="inline text-muted/50" aria-label="Not included" /> : v}
                    </td>
                  ))}
                </tr>
              )))}
            </tbody>
          </table>
        </section>
        <p className="text-xs text-muted mt-4 inline-flex items-center gap-1.5"><Sparkles size={13} /> Payments are processed by Stripe and PayPal. You can cancel any time; Pro stays until the end of the period you paid.</p>
        <BillingHistory />
      </main>
    </div>
  );
}

/** Your payments to Otrelink, each with a PDF invoice. */
function BillingHistory() {
  const [list, setList] = useState(null);
  const lang = typeof navigator !== 'undefined' && /^es/i.test(navigator.language) ? 'es' : 'en';
  useEffect(() => { api('/api/billing/invoices').then((r) => setList(r.invoices)).catch(() => setList([])); }, []);
  if (!list?.length) return null;
  const money = (n, c) => new Intl.NumberFormat([], { style: 'currency', currency: c || 'USD' }).format(n);
  return (
    <section className="mt-10 rounded-3xl bg-panel border border-line/70 p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold tracking-tight flex items-center gap-2"><ReceiptText size={18} /> Billing history</h2>
      <p className="text-sm text-muted mt-0.5">Download the invoice of each payment.</p>
      <ul className="mt-4 divide-y divide-line/70">
        {list.map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-3 text-sm">
            <span className="font-semibold tabular-nums w-28 shrink-0">{p.code}</span>
            <span className="flex-1 min-w-0 text-muted truncate">{new Date(p.date).toLocaleDateString([], { dateStyle: 'medium' })} · {p.provider === 'paypal' ? 'PayPal' : 'Card'}{p.refunded ? ' · Refunded' : ''}</span>
            <span className="font-semibold tabular-nums">{money(p.amount, p.currency)}</span>
            <a href={`/api/billing/invoices/${p.id}?download=1&lang=${lang}`} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line text-[13px] font-semibold bg-panel hover:border-ink/30"><Download size={14} /> PDF</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
