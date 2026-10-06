'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, ExternalLink, LogOut, Loader2, Sparkles, Lock } from 'lucide-react';
import { api, errorMessage } from '@/lib/client';
import { Button, Input, Modal, Logo } from './ui';
import Preview from './Preview';
import { InstallButton, clearPwaCache } from './Pwa';
import VerifyEmailBanner from './VerifyEmailBanner';
import { useSearchParams } from 'next/navigation';

const VERIFIED_MSG = {
  1: { ok: true, text: 'Email confirmed. Your page is now visible.' },
  slug_taken: { ok: true, text: 'Email confirmed. The username you chose was taken in the meantime — create your page with another one.' },
  invalid: { ok: false, text: 'That confirmation link is not valid. Send a new one below.' },
  expired: { ok: false, text: 'That confirmation link expired. Send a new one below.' },
  error: { ok: false, text: 'Too many attempts. Try the link again later.' },
};

export default function PagesList({ user, pages, pageUrl, limit }) {
  const router = useRouter();
  const verifiedMsg = VERIFIED_MSG[useSearchParams().get('verified')];
  const [creating, setCreating] = useState(false);
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const create = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const { page } = await api('/api/pages', { method: 'POST', body: { slug, title: `@${slug}` } });
      router.push(`/dashboard/${page.id}`);
    } catch (e2) { setErr(errorMessage(e2)); setBusy(false); }
  };

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' });
    clearPwaCache();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between h-16 px-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-muted">{user.email}</span>
          <Link href="/dashboard/plan" className="h-8 px-3 inline-flex items-center gap-1.5 rounded-full text-[13px] font-semibold bg-panel border border-line hover:border-ink/30">
            <Sparkles size={14} /> {user.plan.label}
          </Link>
          <InstallButton />
          <Link href="/docs" className="h-8 px-3 inline-flex items-center rounded-full text-[13px] font-semibold hover:bg-panel">Docs</Link>
          <Button size="sm" variant="ghost" onClick={logout}><LogOut size={15} /> Log out</Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {verifiedMsg && <p role="status" className={`mb-4 rounded-2xl px-4 py-3 text-sm ${verifiedMsg.ok ? 'bg-teal/10 text-teal' : 'bg-danger/10 text-danger'}`}>{verifiedMsg.text}</p>}
        {!user.emailVerified && <div className="mb-6"><VerifyEmailBanner email={user.email} /></div>}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight">Your pages</h1>
            <p className="text-muted mt-1">{pages.length} of {limit} page{limit === 1 ? '' : 's'} · {user.plan.label} plan</p>
          </div>
          {pages.length < limit
            ? <Button variant="primary" onClick={() => setCreating(true)}><Plus size={17} /> New page</Button>
            : (
              <Link href="/dashboard/plan" className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-sm font-semibold bg-panel border border-line hover:border-ink/30">
                <Lock size={15} /> {user.plan.id === 'free' ? 'Upgrade to create more pages' : 'Page limit reached'}
              </Link>
            )}
        </div>

        {pages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-line p-12 text-center">
            <p className="font-display text-xl font-bold">You don&apos;t have a page yet</p>
            <p className="text-muted mt-1 mb-5">Pick a username and start adding links.</p>
            <Button variant="primary" onClick={() => setCreating(true)}><Plus size={17} /> Create a page</Button>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((p) => (
              <li key={p.id} className="group rounded-3xl bg-panel border border-line/70 overflow-hidden">
                <Link href={`/dashboard/${p.id}`} className="block dot-canvas h-72 overflow-hidden relative" aria-label={`Edit ${p.slug}`}>
                  <div className="absolute left-1/2 top-6 -translate-x-1/2 pointer-events-none transition-transform group-hover:-translate-y-1">
                    <Preview page={p} scale={0.6} />
                  </div>
                </Link>
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <Link href={`/dashboard/${p.id}`} className="font-semibold truncate block hover:underline">{p.profile.title || p.slug}</Link>
                    <p className="text-xs text-muted truncate">{pageUrl.replace(/^https?:\/\//, '')}/{p.slug}{!p.settings.published && ' · Hidden'}</p>
                  </div>
                  <a href={`${pageUrl}/${p.slug}`} target="_blank" rel="noreferrer" className="inline-grid place-items-center size-9 rounded-full hover:bg-soft text-muted hover:text-ink" aria-label="Open public page"><ExternalLink size={16} /></a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Modal open={creating} onClose={() => setCreating(false)} title="New page">
        <form onSubmit={create} className="space-y-3">
          <div className="flex items-center rounded-xl border border-line focus-within:border-accent overflow-hidden">
            <span className="pl-3 text-sm text-muted whitespace-nowrap">{pageUrl.replace(/^https?:\/\//, '')}/</span>
            <input required autoFocus aria-label="Username for the page" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s/g, ''))} className="flex-1 h-11 px-1 text-sm outline-none min-w-0" placeholder="yourbrand" />
          </div>
          {err && <p className="text-sm text-danger">{err}</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={busy || slug.length < 3}>
            {busy && <Loader2 size={16} className="animate-spin" />} Create page
          </Button>
        </form>
      </Modal>
    </div>
  );
}
