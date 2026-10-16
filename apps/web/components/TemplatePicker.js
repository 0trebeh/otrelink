'use client';
// Template gallery: version (Classic by default / v2 Experimental) and category filters, live mini previews
// (drawn when they scroll into view), and a preview window with a "Use this template" button.
import { useEffect, useRef, useState } from 'react';
import { Check, LayoutTemplate } from 'lucide-react';
import { TEMPLATES, TEMPLATE_CATEGORIES, TEMPLATE_VERSIONS, buildTemplatePage } from '@otrelink/core';
import { Button, Modal, cx } from './ui';
import Preview from './Preview';

// Pages are built on first use only (two versions × 24 templates).
const built = new Map();
const pageOf = (id) => {
  if (!built.has(id)) built.set(id, { id: `tpl-${id}`, slug: id, today: null, ...buildTemplatePage(id) });
  return built.get(id);
};
const twin = (t) => TEMPLATES.find((o) => o.family === t.family && o.version !== t.version);
const order = (v) => TEMPLATE_VERSIONS.findIndex((x) => x.id === v);
const versionLabel = (v) => TEMPLATE_VERSIONS.find((x) => x.id === v)?.label || `v${v}`;

/** Draws its children only once visible (20 live previews at once would be heavy). */
function WhenVisible({ children, className, style }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || shown) return undefined;
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { setShown(true); io.disconnect(); } }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);
  return <div ref={ref} className={className} style={style}>{shown ? children : null}</div>;
}

const chip = (on) => cx('h-8 px-3.5 rounded-full text-[13px] font-semibold cursor-pointer border', on ? 'bg-ink text-white border-ink' : 'bg-panel border-line text-muted hover:text-ink');

export default function TemplatePicker({ onUse, useLabel = 'Use this template', note, extra }) {
  const [version, setVersion] = useState(TEMPLATE_VERSIONS[0].id);
  const [cat, setCat] = useState('');
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const inVersion = TEMPLATES.filter((t) => t.version === version);
  const list = inVersion.filter((t) => !cat || t.category === cat);
  const tpl = TEMPLATES.find((t) => t.id === open);
  const other = tpl && twin(tpl);
  const current = TEMPLATE_VERSIONS.find((v) => v.id === version);

  const use = async () => {
    setBusy(true);
    try { await onUse(open); setOpen(null); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 mb-2" role="toolbar" aria-label="Version">
        {TEMPLATE_VERSIONS.map((v) => (
          <button key={v.id} type="button" onClick={() => setVersion(v.id)} aria-pressed={version === v.id} className={chip(version === v.id)}>
            {v.label}
          </button>
        ))}
      </div>
      {current?.description && <p className="text-xs text-muted mb-3">{current.description}</p>}
      <div className="flex flex-wrap gap-1.5 mb-4" role="toolbar" aria-label="Categories">
        {['', ...TEMPLATE_CATEGORIES].map((c) => (
          <button key={c || 'all'} type="button" onClick={() => setCat(c)} aria-pressed={cat === c} className={chip(cat === c)}>
            {c || `All (${inVersion.length})`}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {list.map((t) => (
          <li key={t.id}>
            <button type="button" onClick={() => setOpen(t.id)} className="group w-full text-left rounded-3xl border border-line/80 bg-panel p-2.5 hover:border-accent hover:shadow-md transition cursor-pointer">
              <WhenVisible className="dot-canvas rounded-2xl overflow-hidden grid place-items-center h-[230px] pointer-events-none">
                <Preview page={pageOf(t.id)} scale={0.3} />
              </WhenVisible>
              <p className="font-semibold text-sm mt-2.5 px-1">{t.name}</p>
              <p className="text-xs text-muted px-1 pb-1 line-clamp-2">{t.description}</p>
            </button>
          </li>
        ))}
      </ul>

      <Modal open={Boolean(tpl)} onClose={() => setOpen(null)} title={tpl ? `${tpl.name} · ${versionLabel(tpl.version)}` : ''} wide>
        {tpl && (
          <div className="grid sm:grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-6 items-start">
            <div className="dot-canvas rounded-3xl p-3 grid place-items-center">
              <Preview key={tpl.id} page={pageOf(tpl.id)} scale={0.72} />
            </div>
            <div className="space-y-4">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted"><LayoutTemplate size={14} /> {tpl.category}</p>
              <p className="text-sm">{tpl.description}</p>
              {other && (
                <div className="inline-flex rounded-full border border-line p-0.5" role="group" aria-label="Version">
                  {[tpl, other].sort((a, b) => order(a.version) - order(b.version)).map((t) => (
                    <button key={t.id} type="button" onClick={() => setOpen(t.id)} aria-pressed={t.id === tpl.id}
                      className={cx('h-7 px-3 rounded-full text-xs font-semibold cursor-pointer', t.id === tpl.id ? 'bg-ink text-white' : 'text-muted hover:text-ink')}>
                      {versionLabel(t.version)}
                    </button>
                  ))}
                </div>
              )}
              <ul className="text-sm text-muted space-y-1">
                {[...new Set(pageOf(tpl.id).blocks.map((b) => b.type))].slice(0, 8).map((type) => (
                  <li key={type} className="flex items-center gap-2"><Check size={14} className="text-teal" /> {type.charAt(0).toUpperCase() + type.slice(1)} block</li>
                ))}
              </ul>
              {extra}
              {note && <p className="text-xs text-muted">{note}</p>}
              <Button variant="primary" className="w-full" onClick={use} disabled={busy}>{useLabel}</Button>
              <p className="text-xs text-muted">The preview is interactive: scroll it and try the buttons.</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
