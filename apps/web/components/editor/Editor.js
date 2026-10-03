'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Undo2, Redo2, ExternalLink, Eye, X, Loader2, Check, RotateCcw, BookOpen } from 'lucide-react';
import { api, errorMessage } from '@/lib/client';
import { sections } from '@/sections';
import { Button, IconButton, cx } from '../ui';
import Preview from '../Preview';
import { useHistory } from './useHistory';

const contentOf = (p) => JSON.stringify({ s: p.slug, a: p.profile, b: p.socials, c: p.blocks, d: p.design, e: p.settings });
const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

export default function Editor({ initialPage, pageUrl }) {
  const { page, set, undo, redo, reset, canUndo, canRedo } = useHistory(initialPage);
  const [saved, setSaved] = useState(() => ({ json: contentOf(initialPage), slug: initialPage.slug }));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [tab, setTab] = useState('links');
  const [mobilePreview, setMobilePreview] = useState(false);
  const [replay, setReplay] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const pageRef = useRef(page);
  pageRef.current = page;

  const dirty = contentOf(page) !== saved.json;
  const section = sections.find((s) => s.id === tab) || sections[0];

  // Restore tab from URL hash (#style, #analytics…)
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (sections.some((s) => s.id === h)) setTab(h);
  }, []);
  const go = (id) => {
    setTab(id);
    history.replaceState(null, '', `#${id}`);
    window.scrollTo({ top: 0 });
  };

  // Click counts shown on block cards.
  useEffect(() => {
    api(`/api/pages/${initialPage.id}/analytics?days=30`).then(setAnalytics).catch(() => {});
  }, [initialPage.id]);

  const save = useCallback(async () => {
    const draft = pageRef.current;
    setSaving(true);
    setNotice(null);
    try {
      const { page: fresh } = await api(`/api/pages/${draft.id}`, {
        method: 'PUT',
        body: { slug: draft.slug, profile: draft.profile, socials: draft.socials, blocks: draft.blocks, design: draft.design, settings: draft.settings },
      });
      setSaved({ json: contentOf(fresh), slug: fresh.slug });
      // Adopt the server's cleaned version only if nothing changed while saving.
      if (pageRef.current === draft) reset(fresh);
      setNotice({ type: 'ok', text: 'Saved' });
      setTimeout(() => setNotice((n) => (n?.type === 'ok' ? null : n)), 2000);
    } catch (e) {
      setNotice({ type: 'error', text: errorMessage(e) });
    } finally {
      setSaving(false);
    }
  }, [reset]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === 's') { e.preventDefault(); if (!saving) save(); }
      else if (k === 'z' && !isTyping(document.activeElement)) { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (k === 'y' && !isTyping(document.activeElement)) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save, saving, undo, redo]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const fn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', fn);
    return () => window.removeEventListener('beforeunload', fn);
  }, [dirty]);

  const ed = useMemo(() => ({ page, set, pageUrl, savedSlug: saved.slug, analytics }), [page, set, pageUrl, saved.slug, analytics]);
  const Section = section.Component;
  const liveUrl = `${pageUrl}/${saved.slug}`;

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-canvas/85 backdrop-blur border-b border-line/70">
        <div className="flex items-center gap-2 h-16 px-3 sm:px-5">
          <Link href="/dashboard" className="inline-grid place-items-center size-9 rounded-full hover:bg-panel" aria-label="Back to my pages"><ArrowLeft size={19} /></Link>
          <div className="min-w-0 mr-auto">
            <p className="font-display font-bold text-lg leading-tight truncate">{page.profile.title || page.slug}</p>
            <p className={cx('text-xs truncate', notice?.type === 'error' ? 'text-danger' : 'text-muted')} aria-live="polite">
              {notice?.type === 'error' ? notice.text : saving ? 'Saving…' : dirty ? 'Unsaved changes' : notice?.text || `Saved · ${liveUrl.replace(/^https?:\/\//, '')}`}
            </p>
          </div>
          <IconButton label="Undo (Ctrl+Z)" onClick={undo} disabled={!canUndo}><Undo2 size={18} /></IconButton>
          <IconButton label="Redo (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}><Redo2 size={18} /></IconButton>
          <a href={`/docs#${tab === 'style' ? 'custom-css' : 'getting-started'}`} target="_blank" rel="noreferrer" className="hidden sm:inline-grid place-items-center size-9 rounded-full text-muted hover:text-ink hover:bg-panel" aria-label="Docs" title="Docs"><BookOpen size={18} /></a>
          <a href={liveUrl} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-sm font-semibold border border-line bg-panel hover:border-ink/30">
            <ExternalLink size={15} /> View page
          </a>
          <Button variant="primary" onClick={save} disabled={saving || !dirty} className="min-w-[92px]">
            {saving ? <Loader2 size={16} className="animate-spin" /> : !dirty && notice?.type === 'ok' ? <Check size={16} /> : null}
            {saving ? 'Saving' : 'Save'}
          </Button>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)_440px] xl:grid-cols-[220px_minmax(0,1fr)_500px]">
        {/* Desktop nav */}
        <nav className="hidden lg:block sticky top-16 self-start h-[calc(100vh-4rem)] p-4" aria-label="Editor sections">
          <ul className="space-y-1">
            {sections.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => go(s.id)}
                  aria-current={tab === s.id ? 'page' : undefined}
                  className={cx('w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-sm font-medium cursor-pointer transition-colors', tab === s.id ? 'bg-panel text-ink shadow-sm' : 'text-muted hover:text-ink hover:bg-panel/60')}
                >
                  <s.icon size={17} /> {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Section content */}
        <main className="px-3 sm:px-6 py-6 pb-32 lg:pb-12">
          <div className={cx('mx-auto', section.wide ? 'max-w-4xl' : 'max-w-2xl')}>
            <Section ed={ed} />
          </div>
        </main>

        {/* Desktop preview */}
        <aside className="hidden lg:flex dot-canvas sticky top-16 h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 border-l border-line/70">
          <PreviewFit page={page} replay={replay} />
          <button type="button" onClick={() => setReplay((r) => r + 1)} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink cursor-pointer">
            <RotateCcw size={13} /> Replay entrance animation
          </button>
        </aside>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-3 inset-x-3 z-30 rounded-3xl bg-panel shadow-[0_10px_30px_-10px_rgba(23,23,31,.35)] border border-line/70" aria-label="Editor sections">
        <ul className="flex overflow-x-auto px-1.5 py-1.5 gap-0.5 [scrollbar-width:none]">
          {sections.map((s) => (
            <li key={s.id} className="shrink-0">
              <button type="button" onClick={() => go(s.id)} aria-current={tab === s.id ? 'page' : undefined}
                className={cx('flex flex-col items-center gap-0.5 w-[68px] py-1.5 rounded-2xl text-[11px] font-medium cursor-pointer', tab === s.id ? 'bg-accent-soft text-accent-ink' : 'text-muted')}>
                <s.icon size={19} /> {s.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <button type="button" onClick={() => setMobilePreview(true)} className="lg:hidden fixed right-4 bottom-24 z-30 inline-flex items-center gap-2 h-11 px-4 rounded-full bg-ink text-white text-sm font-semibold shadow-lg cursor-pointer">
        <Eye size={17} /> Preview
      </button>
      {mobilePreview && (
        <div className="lg:hidden fixed inset-0 z-50 dot-canvas flex flex-col items-center justify-center p-4" role="dialog" aria-label="Preview">
          <IconButton label="Close preview" onClick={() => setMobilePreview(false)} className="absolute top-4 right-4 bg-panel size-10"><X size={20} /></IconButton>
          <PreviewFit page={page} replay={replay} />
        </div>
      )}
    </div>
  );
}

/** Scales the phone frame to fit the available height. */
function PreviewFit({ page, replay }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => setScale(Math.min(1, (window.innerHeight - 140) / 700, (window.innerWidth - 32) / 340));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  return <Preview page={page} replayKey={replay} scale={scale} />;
}
