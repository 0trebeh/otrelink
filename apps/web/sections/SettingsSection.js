'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { Copy, Download, Upload, Check, Trash2, QrCode } from 'lucide-react';
import { settingsFields, SETTINGS_TRANSLATABLE, otherLanguage, pageLanguage, PAGE_LANGUAGES, translationProgress } from '@otrelink/core';
import { api, errorMessage } from '@/lib/client';
import { Panel, Button, Input, cx } from '@/components/ui';
import FieldList from '@/components/fields/FieldList';
import { TranslationFields } from '@/components/editor/TranslationPanel';
import { UpgradeNote } from '@/components/PlanLock';

function SlugField({ ed }) {
  const { page, set } = ed;
  const [status, setStatus] = useState(null);
  useEffect(() => {
    if (page.slug === ed.savedSlug) return setStatus(null);
    setStatus('checking');
    const t = setTimeout(async () => {
      try {
        const r = await api(`/api/slug-check?slug=${encodeURIComponent(page.slug)}&pageId=${page.id}`);
        setStatus(r.available ? 'available' : r.reason === 'taken' ? 'taken' : 'invalid');
      } catch { setStatus(null); }
    }, 400);
    return () => clearTimeout(t);
  }, [page.slug, page.id, ed.savedSlug]);

  const msg = { checking: ['text-muted', 'Checking…'], available: ['text-teal', 'Available'], taken: ['text-danger', 'Taken — try another'], invalid: ['text-danger', '3–30 letters, numbers, dots, dashes or underscores'] }[status];
  return (
    <div>
      <label htmlFor="slug" className="block text-[13px] font-semibold mb-1.5">Username</label>
      <div className="flex items-center rounded-xl border border-line focus-within:border-accent overflow-hidden bg-panel">
        <span className="pl-3 text-sm text-muted whitespace-nowrap">{ed.pageUrl.replace(/^https?:\/\//, '')}/</span>
        <input id="slug" value={page.slug} onChange={(e) => set((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/\s/g, '') }), 'slug')} className="flex-1 h-10 px-1 text-sm outline-none bg-transparent min-w-0" />
      </div>
      {msg && <p className={cx('text-xs mt-1', msg[0])}>{msg[1]}</p>}
    </div>
  );
}

function ShareCard({ url }) {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState('');
  useEffect(() => { QRCode.toDataURL(url, { margin: 1, width: 512, color: { dark: '#17171f' } }).then(setQr).catch(() => {}); }, [url]);
  return (
    <div className="flex flex-col sm:flex-row gap-5 items-start">
      {qr ? <img src={qr} alt={`QR code for ${url}`} className="size-32 rounded-2xl border border-line" /> : <div className="size-32 rounded-2xl bg-soft grid place-items-center text-muted"><QrCode /></div>}
      <div className="flex-1 min-w-0 space-y-3">
        <Input readOnly value={url} onFocus={(e) => e.target.select()} />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy link'}
          </Button>
          {qr && <a href={qr} download="otrelink-qr.png" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line text-[13px] font-semibold bg-panel hover:border-ink/30"><Download size={15} /> Download QR</a>}
        </div>
      </div>
    </div>
  );
}

/** Second language: overall progress and the SEO / warning texts. Block texts are translated in each block. */
function SecondLanguagePanel({ page, set }) {
  const lang = otherLanguage(pageLanguage(page));
  const { done, total } = translationProgress(page, lang);
  const t = page.translations?.[lang] || {};
  const fields = settingsFields.filter((f) => SETTINGS_TRANSLATABLE.includes(f.key));
  return (
    <Panel title={`Second language · ${PAGE_LANGUAGES[lang].label}`}
      description={`Visitors switch with the ES / EN button. Translate your title and bio in Profile, and each block in its “Translation” section. ${done} of ${total} texts translated.`}>
      <TranslationFields fields={fields} data={page.settings} value={t.settings || {}} lang={lang}
        onChange={(value) => set((p) => ({ ...p, translations: { ...(p.translations || {}), [lang]: { ...(p.translations?.[lang] || {}), settings: value } } }), 'tr:settings')} />
    </Panel>
  );
}

export default function SettingsSection({ ed }) {
  const { page, set } = ed;
  const canTranslate = Boolean(ed.plan?.features?.translate);
  const router = useRouter();
  const fileRef = useRef(null);
  const [importErr, setImportErr] = useState('');

  const exportJson = () => {
    const { profile, socials, blocks, design, settings, translations, slug } = page;
    const blob = new Blob([JSON.stringify({ otrelink: 1, slug, profile, socials, blocks, design, settings, translations }, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${page.slug}.otrelink.json` });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importJson = async (file) => {
    setImportErr('');
    try {
      const data = JSON.parse(await file.text());
      if (!data || typeof data !== 'object' || !Array.isArray(data.blocks)) throw new Error();
      set((p) => ({ ...p, profile: data.profile ?? p.profile, socials: data.socials ?? p.socials, blocks: data.blocks, design: data.design ?? p.design, settings: data.settings ?? p.settings, translations: data.translations ?? {} }));
    } catch {
      setImportErr('That file is not an Otrelink export.');
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete ${page.slug} and all its analytics? This can't be undone.`)) return;
    try {
      await api(`/api/pages/${page.id}`, { method: 'DELETE' });
      router.push('/dashboard');
    } catch (e) { window.alert(errorMessage(e)); }
  };

  return (
    <div className="space-y-5">
      <Panel title="Share your page">
        <ShareCard url={`${ed.pageUrl}/${ed.savedSlug}`} />
      </Panel>
      <Panel title="Page settings">
        <div className="space-y-4">
          <SlugField ed={ed} />
          <FieldList fields={canTranslate ? settingsFields : settingsFields.filter((f) => !['translateButton', 'translatePlace'].includes(f.key))} values={page.settings} onChange={(k, v) => set((p) => ({ ...p, settings: { ...p.settings, [k]: v } }), `settings:${k}`)} />
          {!canTranslate && <UpgradeNote>A second language (ES / EN) is a Pro feature.</UpgradeNote>}
        </div>
      </Panel>
      {canTranslate && page.settings.translateButton && <SecondLanguagePanel page={page} set={set} />}
      <Panel title="Download as website" description="A .zip with index.html, style.css, script.js and your images and PDFs. Open index.html on any computer: no server or database needed. Uses the last saved version.">
        <a href={`/api/pages/${page.id}/export`} download className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-line text-[13px] font-semibold bg-panel hover:border-ink/30">
          <Download size={15} /> Download website (.zip)
        </a>
        {ed.dirty && <p className="text-xs text-muted mt-2">You have unsaved changes. Save first to include them.</p>}
      </Panel>
      <Panel title="Backup" description="Download your page as a file, or restore one. Restoring replaces the current content until you save.">
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={exportJson}><Download size={15} /> Export JSON</Button>
          <Button size="sm" onClick={() => fileRef.current?.click()}><Upload size={15} /> Import JSON</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        </div>
        {importErr && <p className="text-xs text-danger mt-2">{importErr}</p>}
      </Panel>
      <Panel title="Delete page" description="Removes the page, its link and its analytics.">
        <Button variant="danger" size="sm" onClick={remove}><Trash2 size={15} /> Delete this page</Button>
      </Panel>
    </div>
  );
}
