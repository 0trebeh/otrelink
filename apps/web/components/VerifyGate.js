'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MailCheck, Loader2, RefreshCw, LogOut } from 'lucide-react';
import { api, errorMessage } from '@/lib/client';
import { Logo } from './ui';

const LINK_MSG = {
  invalid: 'That confirmation link is not valid. Send a new one below.',
  expired: 'That confirmation link expired. Send a new one below.',
  error: 'Too many attempts. Try the link again later.',
};

/** Whole dashboard until the account confirms its email: nothing can be created before. */
export default function VerifyGate({ email, pendingSlug }) {
  const router = useRouter();
  const linkMsg = LINK_MSG[useSearchParams().get('verified')];
  const [state, setState] = useState('idle');
  const [err, setErr] = useState('');

  const resend = async () => {
    setState('sending'); setErr('');
    try {
      const r = await api('/api/auth/verify/resend', { method: 'POST' });
      if (r.alreadyVerified) { router.refresh(); return; }
      setState('sent');
    } catch (e) { setErr(errorMessage(e)); setState('idle'); }
  };
  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    router.push('/'); router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between h-16 px-4 sm:px-8">
        <Logo />
        <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-[13px] font-semibold hover:bg-panel cursor-pointer"><LogOut size={15} /> Log out</button>
      </header>
      <main className="flex-1 grid place-items-center px-4 pb-16">
        <div className="w-full max-w-md rounded-3xl bg-panel border border-line p-8 text-center">
          <span className="mx-auto mb-4 grid place-items-center size-14 rounded-2xl bg-accent-soft text-accent-ink"><MailCheck size={26} /></span>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">Confirm your email</h1>
          <p className="text-muted mt-2">
            We sent a link to <b className="text-ink break-all">{email}</b>. Open it to activate your account
            {pendingSlug ? <> and create your page <b className="text-ink">@{pendingSlug}</b></> : null}.
          </p>
          <p className="text-sm text-muted mt-3">You can’t create or edit pages until your email is confirmed. Check your spam folder too.</p>
          {linkMsg && <p className="mt-4 rounded-2xl bg-danger/10 text-danger text-sm px-4 py-3">{linkMsg}</p>}
          {err && <p className="mt-4 rounded-2xl bg-danger/10 text-danger text-sm px-4 py-3">{err}</p>}
          <div className="mt-6 grid gap-2">
            {state === 'sent'
              ? <p className="h-11 grid place-items-center rounded-full bg-teal/10 text-teal text-sm font-semibold">Sent! Check your inbox.</p>
              : (
                <button type="button" onClick={resend} disabled={state === 'sending'} className="h-11 rounded-full bg-accent text-white font-semibold inline-flex items-center justify-center gap-2 hover:bg-accent-ink disabled:opacity-60 cursor-pointer">
                  {state === 'sending' && <Loader2 size={16} className="animate-spin" />} Send the link again
                </button>
              )}
            <button type="button" onClick={() => router.refresh()} className="h-11 rounded-full border border-line font-semibold inline-flex items-center justify-center gap-2 hover:border-ink/30 cursor-pointer">
              <RefreshCw size={15} /> I already confirmed it
            </button>
          </div>
          <p className="text-xs text-muted mt-5">Wrong email? Log out and sign up again with the right one (with another username, or the same one after 48 hours).</p>
        </div>
      </main>
    </div>
  );
}
