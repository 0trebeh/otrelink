'use client';
import { useState } from 'react';
import Link from 'next/link';
import { FileCheck2, Loader2 } from 'lucide-react';
import { api, errorMessage } from '@/lib/client';

/** Asks an account that accepted an older version (or none) to accept the current Terms and Privacy Policy. */
export default function LegalUpdateBanner({ firstTime }) {
  const [state, setState] = useState('idle');
  const [err, setErr] = useState('');
  if (state === 'done') return null;
  const accept = async () => {
    setState('saving'); setErr('');
    try { await api('/api/legal/accept', { method: 'POST' }); setState('done'); } catch (e) { setErr(errorMessage(e)); setState('idle'); }
  };
  return (
    <div role="region" aria-label="Updated terms" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-2xl bg-ink text-white shadow-2xl p-4 sm:p-5 text-sm">
      <p className="flex items-start gap-2.5">
        <FileCheck2 size={18} className="shrink-0 mt-0.5" />
        <span>
          <b>{firstTime ? 'We have published our Terms and Privacy Policy.' : 'We have updated our Terms and Privacy Policy.'}</b>{' '}
          Please review the <Link href="/terms" target="_blank" className="underline font-semibold">Terms of Service</Link>, <Link href="/privacy" target="_blank" className="underline font-semibold">Privacy Policy</Link>, <Link href="/cookies" target="_blank" className="underline font-semibold">Cookie Policy</Link> and <Link href="/refunds" target="_blank" className="underline font-semibold">Refund Policy</Link>. By selecting “I agree” you confirm you are at least 18 and accept them.
          {err && <span className="block text-red-300 mt-1">{err}</span>}
        </span>
      </p>
      <div className="mt-3 flex justify-end">
        <button type="button" onClick={accept} disabled={state === 'saving'} className="h-10 px-5 inline-flex items-center gap-2 rounded-full bg-white text-ink font-semibold cursor-pointer disabled:opacity-60">
          {state === 'saving' && <Loader2 size={15} className="animate-spin" />} I agree
        </button>
      </div>
    </div>
  );
}
