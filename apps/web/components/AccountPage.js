'use client';
// Dashboard → Account: profile, email, password, plan & billing, shortcuts,
// sessions and deleting the account.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Loader2, Check, Sparkles, CreditCard, ReceiptText, Gift, KeyRound, BookOpen, LogOut, ShieldCheck,
  Mail, Lock, MonitorSmartphone, Trash2, ChevronRight, UserRound, AlertTriangle,
} from 'lucide-react';
import { api, errorMessage } from '@/lib/client';
import ThemeToggle from './ThemeToggle';
import { Button, Input, Modal, Logo, cx } from './ui';
import { Avatar, logout } from './AccountMenu';

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString([], { dateStyle: 'long' }) : '');
const EMAIL_MSG = {
  changed: { ok: true, text: 'Your email was changed.' },
  invalid: { ok: false, text: 'That link is not valid (or was already used).' },
  expired: { ok: false, text: 'That link expired. Ask for the change again.' },
  taken: { ok: false, text: 'Another account started using that email in the meantime. Try a different one.' },
  error: { ok: false, text: 'Too many attempts. Try the link again later.' },
};

function Card({ icon: Icon, title, description, children, tone }) {
  return (
    <section className={cx('rounded-3xl bg-panel border p-5 sm:p-6', tone === 'danger' ? 'border-danger/30' : 'border-line/70')}>
      <h2 className={cx('font-display text-lg font-bold tracking-tight flex items-center gap-2', tone === 'danger' && 'text-danger')}><Icon size={18} /> {title}</h2>
      {description && <p className="text-sm text-muted mt-0.5">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      {children}
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

const Note = ({ msg }) => (msg ? (
  <p role="status" className={cx('rounded-2xl px-4 py-2.5 text-sm', msg.ok ? 'bg-teal/10 text-teal' : 'bg-danger/10 text-danger')}>{msg.text}</p>
) : null);

/** Run an API call with busy + message state. */
function useAction() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const run = async (fn, okText) => {
    setBusy(true); setMsg(null);
    try { const r = await fn(); if (okText) setMsg({ ok: true, text: typeof okText === 'function' ? okText(r) : okText }); return r; }
    catch (e) { setMsg({ ok: false, text: errorMessage(e) }); return null; }
    finally { setBusy(false); }
  };
  return { busy, msg, setMsg, run };
}

function ProfileCard({ user, account, setAccount }) {
  const [name, setName] = useState(account.name);
  const a = useAction();
  const router = useRouter();
  const save = (e) => {
    e.preventDefault();
    a.run(async () => { const r = await api('/api/account', { method: 'PATCH', body: { name } }); setAccount(r.account); router.refresh(); return r; }, 'Saved.');
  };
  return (
    <Card icon={UserRound} title="Profile" description="Your name is used in emails and invoices. It isn’t shown on your pages.">
      <form onSubmit={save} className="grid gap-3">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Your name" autoComplete="name" />
        </Field>
        <Note msg={a.msg} />
        <div><Button type="submit" variant="primary" disabled={a.busy || name.trim() === account.name}>{a.busy && <Loader2 size={15} className="animate-spin" />} Save</Button></div>
      </form>
      <p className="text-xs text-muted mt-4">Member since {fmtDate(account.createdAt)}{user.emailVerified ? ' · email confirmed' : ''}.</p>
    </Card>
  );
}

function EmailCard({ account, setAccount, emailLinks }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [open, setOpen] = useState(false);
  const a = useAction();
  const router = useRouter();
  const submit = (e) => {
    e.preventDefault();
    a.run(async () => {
      const r = await api('/api/account/email', { method: 'POST', body: { email, password } });
      setAccount(r.account); setPassword(''); setOpen(false);
      if (r.changed) router.refresh();
      return r;
    }, (r) => (r.changed ? 'Your email was changed.' : `We sent a link to ${email}. Your email changes when you open it.`));
  };
  const cancel = () => a.run(async () => { const r = await api('/api/account/email', { method: 'DELETE' }); setAccount(r.account); return r; }, 'Change cancelled.');
  return (
    <Card icon={Mail} title="Email" description="You sign in with it, and receipts and notifications go there.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium break-all">{account.email}</p>
        {!open && <Button size="sm" onClick={() => { setOpen(true); a.setMsg(null); }}>Change email</Button>}
      </div>
      {account.pendingEmail && (
        <p className="mt-3 rounded-2xl bg-soft px-4 py-2.5 text-sm flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex-1 min-w-[12rem]">Waiting for you to confirm <b className="break-all">{account.pendingEmail}</b> (check that inbox).</span>
          <button type="button" onClick={cancel} disabled={a.busy} className="text-sm font-semibold underline cursor-pointer">Cancel</button>
        </p>
      )}
      {open && (
        <form onSubmit={submit} className="mt-4 grid gap-3 rounded-2xl bg-soft p-4">
          <Field label="New email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></Field>
          <Field label="Current password" hint={emailLinks ? 'We’ll send a confirmation link to the new address.' : undefined}>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </Field>
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={a.busy}>{a.busy && <Loader2 size={15} className="animate-spin" />} Change email</Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      )}
      {a.msg && <div className="mt-3"><Note msg={a.msg} /></div>}
    </Card>
  );
}

function PasswordCard() {
  const [f, setF] = useState({ current: '', next: '', again: '' });
  const a = useAction();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (f.next !== f.again) return a.setMsg({ ok: false, text: 'The new passwords don’t match.' });
    a.run(async () => { const r = await api('/api/account/password', { method: 'POST', body: { current: f.current, next: f.next } }); setF({ current: '', next: '', again: '' }); return r; },
      'Password changed. Other devices were signed out.');
  };
  return (
    <Card icon={Lock} title="Password" description="At least 8 characters. Changing it signs you out on your other devices.">
      <form onSubmit={submit} className="grid gap-3">
        <Field label="Current password"><Input type="password" required value={f.current} onChange={set('current')} autoComplete="current-password" /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="New password"><Input type="password" required minLength={8} value={f.next} onChange={set('next')} autoComplete="new-password" /></Field>
          <Field label="Repeat new password"><Input type="password" required minLength={8} value={f.again} onChange={set('again')} autoComplete="new-password" /></Field>
        </div>
        <Note msg={a.msg} />
        <div><Button type="submit" variant="primary" disabled={a.busy}>{a.busy && <Loader2 size={15} className="animate-spin" />} Change password</Button></div>
      </form>
    </Card>
  );
}

function PlanCard({ user, pagesUsed, canPay }) {
  const router = useRouter();
  const b = user.billing;
  const subscribed = b && ['active', 'past_due'].includes(b.status);
  const a = useAction();
  const portal = () => a.run(async () => { const { url } = await api('/api/billing/stripe/portal', { method: 'POST' }); window.location.href = url; });
  const toFree = () => {
    const until = b?.currentPeriodEnd ? ` until ${fmtDate(b.currentPeriodEnd)}` : '';
    if (!window.confirm(`Go back to Free?\n\nYour subscription won’t renew. You keep Pro${until} and then your account moves to Free. Nothing you built is deleted.`)) return;
    a.run(async () => { await api('/api/billing/cancel', { method: 'POST' }); router.refresh(); }, 'Done: your subscription won’t renew.');
  };
  let status = '';
  if (user.proTrialUntil) status = `Pro for free until ${fmtDate(user.proTrialUntil)} (invite reward).`;
  else if (b?.status === 'active' && !b.cancelAtPeriodEnd) status = `${b.provider === 'stripe' ? 'Card' : 'PayPal'} · renews on ${fmtDate(b.currentPeriodEnd)}.`;
  else if (b?.status === 'active' && b.cancelAtPeriodEnd) status = `Won’t renew · Pro until ${fmtDate(b.currentPeriodEnd)}, then Free.`;
  else if (b?.status === 'past_due') status = 'The last payment failed. Update your payment method to keep Pro.';
  else if (b?.status === 'canceled' && user.plan.id === 'pro') status = `Cancelled · Pro until ${fmtDate(b.endsAt || b.currentPeriodEnd)}, then Free.`;
  else if (user.plan.id === 'business') status = 'Set up with the Otrelink team.';
  return (
    <Card icon={Sparkles} title="Plan & billing">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl font-extrabold">{user.plan.label}</p>
          <p className="text-sm text-muted mt-0.5">{pagesUsed} of {user.plan.maxPages} page{user.plan.maxPages === 1 ? '' : 's'} used{status ? ` · ${status}` : ''}</p>
        </div>
        <Link href="/dashboard/plan" className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-semibold bg-ink text-white hover:bg-black">
          {user.plan.id === 'free' && canPay ? 'Upgrade' : 'Compare plans'} <ChevronRight size={15} />
        </Link>
      </div>
      {(b || subscribed) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {b?.provider === 'stripe' && b.status !== 'canceled' && <Button size="sm" onClick={portal} disabled={a.busy}><CreditCard size={15} /> Payment method</Button>}
          <Link href="/dashboard/plan#billing" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-semibold bg-panel border border-line hover:border-ink/30"><ReceiptText size={14} /> Invoices</Link>
          {subscribed && !b.cancelAtPeriodEnd && <Button size="sm" variant="ghost" onClick={toFree} disabled={a.busy}>Switch to Free</Button>}
        </div>
      )}
      {a.msg && <div className="mt-3"><Note msg={a.msg} /></div>}
    </Card>
  );
}

function Shortcuts({ user }) {
  const row = 'flex items-center gap-3 px-4 py-3 hover:bg-soft';
  const links = [
    { href: '/dashboard/referrals', icon: Gift, label: 'Invite friends', hint: 'Your link and the rewards you earned' },
    user.plan.features.api && { href: '/dashboard/api', icon: KeyRound, label: 'API tokens & MCP', hint: 'Let scripts and AI assistants edit your pages' },
    { href: '/docs', icon: BookOpen, label: 'Docs', hint: 'How every block and option works' },
  ].filter(Boolean);
  return (
    <section className="rounded-3xl bg-panel border border-line/70 overflow-hidden divide-y divide-line/70">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className={row}>
          <l.icon size={18} className="text-muted" />
          <span className="flex-1 min-w-0"><span className="block text-sm font-semibold">{l.label}</span><span className="block text-xs text-muted truncate">{l.hint}</span></span>
          <ChevronRight size={16} className="text-muted" />
        </Link>
      ))}
    </section>
  );
}

function SessionsCard() {
  const router = useRouter();
  const a = useAction();
  const everywhere = () => {
    if (!window.confirm('Sign out on every other device? This one stays signed in.')) return;
    a.run(() => api('/api/account/sessions', { method: 'DELETE' }), 'Signed out on your other devices.');
  };
  return (
    <Card icon={MonitorSmartphone} title="Sessions" description="You stay signed in for 30 days on each device.">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={everywhere} disabled={a.busy}><ShieldCheck size={15} /> Sign out other devices</Button>
        <Button size="sm" variant="ghost" onClick={() => logout(router)}><LogOut size={15} /> Log out</Button>
      </div>
      {a.msg && <div className="mt-3"><Note msg={a.msg} /></div>}
    </Card>
  );
}

function DeleteCard({ user, account }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const a = useAction();
  const paying = user.billing && ['active', 'past_due'].includes(user.billing.status);
  const submit = async (e) => {
    e.preventDefault();
    const r = await a.run(() => api('/api/account', { method: 'DELETE', body: { confirmEmail, password } }));
    if (r) { router.push('/'); router.refresh(); }
  };
  return (
    <Card icon={Trash2} title="Delete account" tone="danger" description="Deletes your account, all your pages, files, analytics, orders and bookings. This can’t be undone.">
      <Button size="sm" variant="danger" onClick={() => { setOpen(true); a.setMsg(null); }}><Trash2 size={15} /> Delete my account</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Delete your account?">
        <form onSubmit={submit} className="grid gap-3">
          <p className="text-sm text-muted flex gap-2"><AlertTriangle size={18} className="text-danger shrink-0" /> Everything is deleted right away and your page links stop working.{paying ? ' Your subscription is cancelled now, without a refund for the rest of this period.' : ''}</p>
          <Field label={<span>Type <b>{account.email}</b> to confirm</span>}>
            <Input value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Password"><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>
          <Note msg={a.msg} />
          <div className="flex justify-end gap-2">
            <Button type="button" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="danger" disabled={a.busy || confirmEmail.trim().toLowerCase() !== account.email}>{a.busy && <Loader2 size={15} className="animate-spin" />} Delete forever</Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}

export default function AccountPage({ user, account: initial, pagesUsed, emailLinks, canPay }) {
  const [account, setAccount] = useState(initial);
  const emailMsg = EMAIL_MSG[useSearchParams().get('email')];
  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-3 h-16 px-4 sm:px-8">
        <Link href="/dashboard" className="inline-grid place-items-center size-9 rounded-full hover:bg-panel" aria-label="Back to my pages"><ArrowLeft size={19} /></Link>
        <Logo />
        <ThemeToggle className="ml-auto" />
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-8 pb-16">
        <div className="flex items-center gap-4 mt-4">
          <Avatar user={{ ...user, name: account.name }} size={56} />
          <div className="min-w-0">
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight truncate">{account.name || 'Your account'}</h1>
            <p className="text-muted truncate">{account.email} · <span className="inline-flex items-center gap-1"><Check size={14} /> {user.plan.label}</span></p>
          </div>
        </div>
        {emailMsg && <div className="mt-5"><Note msg={emailMsg} /></div>}
        <div className="grid gap-5 mt-6">
          <PlanCard user={user} pagesUsed={pagesUsed} canPay={canPay} />
          <ProfileCard user={user} account={account} setAccount={setAccount} />
          <EmailCard account={account} setAccount={setAccount} emailLinks={emailLinks} />
          <PasswordCard />
          <Shortcuts user={user} />
          <SessionsCard />
          <DeleteCard user={user} account={account} />
        </div>
      </main>
    </div>
  );
}
