'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Gift, Copy, Check, Share2, Loader2, Users, BadgeCheck, CalendarClock, Sparkles } from 'lucide-react';
import { REFERRAL_REASONS } from '@otrelink/core';
import { api, errorMessage } from '@/lib/client';
import ThemeToggle from './ThemeToggle';
import { Button, Logo, cx } from './ui';

const fmt = (iso) => (iso ? new Date(iso).toLocaleDateString([], { dateStyle: 'medium' }) : '');
const months = (n) => `${n} month${n === 1 ? '' : 's'}`;

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="rounded-2xl bg-panel border border-line/70 p-4">
      <p className="text-xs text-muted flex items-center gap-1.5"><Icon size={14} /> {label}</p>
      <p className="font-display text-2xl font-extrabold mt-1">{value}</p>
      {hint && <p className="text-[11px] text-muted mt-0.5">{hint}</p>}
    </div>
  );
}

function StatusChip({ r }) {
  if (r.status === 'pending') return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-soft text-muted">Signed up</span>;
  if (r.status === 'rewarded') {
    const label = r.kind === 'pro-trial' ? `+${months(r.months)} of Pro` : `+${months(r.months)} free`;
    const waiting = r.kind !== 'pro-trial' && r.appliedMonths < r.months;
    return (
      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal/15 text-teal" title={waiting ? `${r.months - r.appliedMonths} still to be applied` : undefined}>
        {label}{waiting ? ` · ${r.appliedMonths}/${r.months} applied` : ''}
      </span>
    );
  }
  return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-soft text-muted" title={REFERRAL_REASONS[r.reason] || ''}>Subscribed · no reward</span>;
}

export default function ReferralsPage() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => { api('/api/referrals').then(setData).catch((e) => setErr(errorMessage(e))); }, []);

  const copy = async () => {
    try { await navigator.clipboard.writeText(data.link); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* text stays selectable */ }
  };
  const share = async () => {
    try { await navigator.share({ title: 'Otrelink', text: 'Create your link-in-bio page with Otrelink', url: data.link }); } catch { /* cancelled */ }
  };

  const c = data?.campaign;
  const kind = data?.rewardKind;
  const reward = c ? (kind === 'credit' ? `${months(c.freeMonths)} free on your Pro subscription` : kind === 'pro-trial' ? `${months(c.freeUserMonths)} of Pro for free` : null) : null;
  const refs = data?.referrals || [];
  const earned = refs.filter((r) => r.status === 'rewarded').reduce((n, r) => n + r.months, 0);
  const waiting = refs.filter((r) => r.status === 'rewarded' && r.kind !== 'pro-trial').reduce((n, r) => n + Math.max(0, r.months - r.appliedMonths), 0);

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-3 h-16 px-4 sm:px-8">
        <Link href="/dashboard" className="inline-grid place-items-center size-9 rounded-full hover:bg-panel" aria-label="Back to my pages"><ArrowLeft size={19} /></Link>
        <Logo />
        <ThemeToggle className="ml-auto" />
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-8 pb-16">
        <h1 className="font-display text-4xl font-extrabold tracking-tight mt-4">Invite friends</h1>
        <p className="text-muted mt-1 max-w-[60ch]">
          {kind === 'none'
            ? 'Share Otrelink with your link. Everyone who joins with it is counted here.'
            : 'Share your link. When a friend who joined with it subscribes to Pro or Business, you get rewarded.'}
        </p>

        {err && <p className="mt-5 rounded-2xl bg-danger/10 text-danger px-4 py-3 text-sm" role="alert">{err}</p>}
        {!data && !err && <p className="mt-8 text-sm text-muted inline-flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Loading…</p>}

        {data && (
          <>
            {data.proTrialUntil && (
              <p className="mt-6 rounded-2xl bg-teal/10 text-teal px-4 py-3 text-sm font-medium flex items-center gap-2"><Sparkles size={16} /> You have Pro for free until {fmt(data.proTrialUntil)}, thanks to your invites.</p>
            )}

            {/* Campaign */}
            <section className={cx('mt-6 rounded-3xl p-5 sm:p-6 border', c && reward ? 'bg-accent-soft/60 border-accent/30' : 'bg-panel border-line/70')}>
              {c && reward ? (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-accent-ink flex items-center gap-1.5"><Gift size={14} /> {c.name}</p>
                  <p className="font-display text-2xl font-extrabold mt-1.5">Get {reward} for every friend who subscribes</p>
                  <p className="text-sm text-muted mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="inline-flex items-center gap-1.5"><CalendarClock size={14} /> Friends must sign up by {fmt(c.endsAt)}</span>
                    {c.maxPerReferrer > 0 && <span>Up to {c.maxPerReferrer} rewards per person</span>}
                  </p>
                </>
              ) : c && kind === 'none' ? (
                <p className="text-sm text-muted">Business accounts don’t get automatic rewards. Your invites are still counted below.</p>
              ) : (
                <p className="text-sm text-muted">There’s no reward campaign right now. Your link still works and friends who join are counted, but only sign-ups during a campaign earn rewards.</p>
              )}

              <label className="block mt-5 text-xs font-semibold text-muted" htmlFor="ref-link">Your link</label>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <input id="ref-link" readOnly value={data.link} onFocus={(e) => e.target.select()}
                  className="flex-1 min-w-0 h-11 rounded-xl border border-line bg-panel px-3 text-sm font-mono" />
                <Button variant="primary" onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy'}</Button>
                {typeof navigator !== 'undefined' && navigator.share && <Button onClick={share}><Share2 size={16} /> Share</Button>}
              </div>
            </section>

            {/* Numbers */}
            <div className={cx('grid gap-3 mt-6', kind === 'credit' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3')}>
              <Stat icon={Users} label="Joined" value={refs.length} />
              <Stat icon={BadgeCheck} label="Subscribed" value={refs.filter((r) => r.status !== 'pending').length} />
              <Stat icon={Gift} label={kind === 'pro-trial' ? 'Months of Pro earned' : 'Free months earned'} value={earned} />
              {kind === 'credit' && <Stat icon={CalendarClock} label="Waiting to apply" value={waiting} hint="Used on your next payments" />}
            </div>

            {/* How it works */}
            <section className="mt-6 rounded-3xl bg-panel border border-line/70 p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold tracking-tight">How it works</h2>
              <ol className="mt-3 grid sm:grid-cols-3 gap-3 text-sm">
                <li className="rounded-2xl bg-soft p-3"><b className="block">1. Share your link</b><span className="text-muted">Friends create their account with it.</span></li>
                <li className="rounded-2xl bg-soft p-3"><b className="block">2. They subscribe</b><span className="text-muted">It counts on their first Pro payment, or when they move to Business.</span></li>
                <li className="rounded-2xl bg-soft p-3"><b className="block">3. You get rewarded</b><span className="text-muted">
                  {kind === 'credit' ? 'Free months are taken off your next Pro payments (card: account credit; PayPal: the payment is refunded).'
                    : kind === 'pro-trial' ? 'Your account moves to Pro for free. Months add up, and you go back to Free when they end.'
                      : 'Business accounts don’t get automatic rewards.'}
                </span></li>
              </ol>
            </section>

            {/* People */}
            <section className="mt-6 rounded-3xl bg-panel border border-line/70">
              <h2 className="font-display text-lg font-bold tracking-tight px-5 pt-5 pb-3">Your invites</h2>
              {refs.length === 0 ? (
                <p className="px-5 pb-6 text-sm text-muted">Nobody has joined with your link yet.</p>
              ) : (
                <ul className="divide-y divide-line/70 border-t border-line/70">
                  {refs.map((r) => (
                    <li key={r.id} className="px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex-1 min-w-[10rem] text-sm font-medium">{r.email}</span>
                      <span className="text-xs text-muted">Joined {fmt(r.createdAt)}</span>
                      <StatusChip r={r} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
