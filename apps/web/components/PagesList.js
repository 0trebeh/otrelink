'use client';
import ThemeToggle, { ThemeMenuItem } from './ThemeToggle';
import GlobalAnalytics from './GlobalAnalytics';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, ExternalLink, LogOut, Loader2, Sparkles, Lock, Menu, X, BookOpen, LayoutTemplate, KeyRound } from 'lucide-react';
import { TEMPLATES } from '@otrelink/core';
import TemplatePicker from './TemplatePicker';
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
  const [template, setTemplate] = useState('');
  const [picking, setPicking] = useState(false);

  const create = async (e) => {
    e?.preventDefault();
    setBusy(true); setErr('');
    try {
      const { page } = await api('/api/pages', { method: 'POST', body: { slug, title: `@${slug}`, ...(template ? { template } : {}) } });
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
      <header className="relative flex items-center justify-between h-16 px-4 sm:px-8">
        <Logo />
        {/* Desktop */}
        <div className="hidden sm:flex items-center gap-3">
          <span className="text-sm text-muted">{user.email}</span>
          <Link href="/dashboard/plan" className="h-8 px-3 inline-flex items-center gap-1.5 rounded-full text-[13px] font-semibold bg-panel border border-line hover:border-ink/30">
            <Sparkles size={14} /> {user.plan.label}
          </Link>
          <InstallButton />
          <ThemeToggle />
          {user.plan.features.api && <Link href="/dashboard/api" className="h-8 px-3 inline-flex items-center gap-1.5 rounded-full text-[13px] font-semibold hover:bg-panel"><KeyRound size={14} /> API</Link>}
          <Link href="/docs" className="h-8 px-3 inline-flex items-center rounded-full text-[13px] font-semibold hover:bg-panel">Docs</Link>
          <Button size="sm" variant="ghost" onClick={logout}><LogOut size={15} /> Log out</Button>
        </div>
        {/* Phone: logo + menu */}
        <MobileMenu user={user} onLogout={logout} />
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

        {pages.length > 0 && <GlobalAnalytics />}

        {pages.length > 0 && <h2 className="font-display text-xl font-bold tracking-tight mb-4">Pages</h2>}
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
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-soft px-3 py-2.5">
            <span className="text-sm min-w-0"><span className="block text-xs text-muted">Start from</span><b className="truncate block">{template ? TEMPLATES.find((t) => t.id === template)?.name : 'A blank page'}</b></span>
            <span className="flex gap-1 shrink-0">
              {template && <Button size="sm" variant="ghost" onClick={() => setTemplate('')}>Blank</Button>}
              <Button size="sm" onClick={() => setPicking(true)}><LayoutTemplate size={14} /> {template ? 'Change' : 'Templates'}</Button>
            </span>
          </div>
          {err && <p className="text-sm text-danger">{err}</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={busy || slug.length < 3}>
            {busy && <Loader2 size={16} className="animate-spin" />} Create page
          </Button>
        </form>
      </Modal>
      {picking && (
        <div className="fixed inset-0 z-50 bg-canvas overflow-y-auto" role="dialog" aria-modal="true" aria-label="Templates">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="font-display text-2xl font-extrabold tracking-tight">Choose a template</h2>
                <p className="text-sm text-muted">Your new page starts with it. Everything stays editable.</p>
              </div>
              <Button onClick={() => setPicking(false)}>Close</Button>
            </div>
            <TemplatePicker useLabel="Start my page with it" onUse={(id) => { setTemplate(id); setPicking(false); }} />
          </div>
        </div>
      )}
    </div>
  );
}

/** Phone header menu (hamburger): account, plan, install, dark mode, docs and log out. */
function MobileMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e) => { if (!box.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, [open]);
  const item = 'w-full flex items-center gap-3 h-11 px-3 rounded-xl text-[15px] font-medium hover:bg-soft cursor-pointer';
  return (
    <div ref={box} className="sm:hidden">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? 'Close menu' : 'Open menu'}
        className="inline-grid place-items-center size-10 rounded-full hover:bg-panel cursor-pointer">
        {open ? <X size={21} /> : <Menu size={21} />}
      </button>
      {open && (
        <nav id="mobile-menu" aria-label="Account" className="absolute right-3 left-3 top-[3.75rem] z-40 rounded-2xl bg-panel border border-line shadow-xl p-2">
          <p className="px-3 pt-1.5 pb-2 text-xs text-muted truncate border-b border-line/70 mb-1">{user.email}</p>
          <Link href="/dashboard/plan" className={item} onClick={() => setOpen(false)}>
            <Sparkles size={17} /> <span className="flex-1">Plan</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-soft">{user.plan.label}</span>
          </Link>
          <InstallButton className="!w-full !justify-start !h-11 !px-3 !rounded-xl !text-[15px] !font-medium !border-0 !bg-transparent hover:!bg-soft !gap-3" />
          <ThemeMenuItem className={item} />
          {user.plan.features.api && <Link href="/dashboard/api" className={item} onClick={() => setOpen(false)}><KeyRound size={17} /> API tokens</Link>}
          <Link href="/docs" className={item} onClick={() => setOpen(false)}><BookOpen size={17} /> Docs</Link>
          <button type="button" className={item} onClick={() => { setOpen(false); onLogout(); }}><LogOut size={17} /> Log out</button>
        </nav>
      )}
    </div>
  );
}
