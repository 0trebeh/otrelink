'use client';
import { useState } from 'react';
import { MailCheck, Loader2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/client';

/** Shown until a new account confirms its email (its pages stay hidden until then). */
export default function VerifyEmailBanner({ email }) {
  const [state, setState] = useState('idle');
  const [err, setErr] = useState('');
  const resend = async () => {
    setState('sending'); setErr('');
    try {
      const r = await api('/api/auth/verify/resend', { method: 'POST' });
      if (r.alreadyVerified) { window.location.reload(); return; }
      setState('sent');
    } catch (e) { setErr(errorMessage(e)); setState('idle'); }
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 px-4 py-3 text-sm" role="status">
      <span className="inline-flex items-start gap-2">
        <MailCheck size={17} className="shrink-0 mt-0.5" />
        <span>
          <b>Confirm your email to publish your page.</b> We sent a link to {email}. Until then your page is not visible to others.
          {err && <span className="block text-danger mt-1">{err}</span>}
        </span>
      </span>
      {state === 'sent'
        ? <span className="font-semibold">Sent! Check your inbox and spam.</span>
        : (
          <button type="button" onClick={resend} disabled={state === 'sending'} className="inline-flex items-center gap-1.5 font-semibold underline cursor-pointer disabled:opacity-60">
            {state === 'sending' && <Loader2 size={14} className="animate-spin" />} Send the link again
          </button>
        )}
    </div>
  );
}
