'use client';
// Template gallery: category filter, live mini previews (drawn when they scroll
// into view), and a preview window with a "Use this template" button.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, LayoutTemplate } from 'lucide-react';
import { TEMPLATES, TEMPLATE_CATEGORIES, buildTemplatePage } from '@otrelink/core';
import { Button, Modal, cx } from './ui';
import Preview from './Preview';

const pageOf = (id) => ({ id: `tpl-${id}`, slug: id, today: null, ...buildTemplatePage(id) });

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

export default function TemplatePicker({ onUse, useLabel = 'Use this template', note, extra }) {
  const [cat, setCat] = useState('');
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const pages = useMemo(() => Object.fromEntries(TEMPLATES.map((t) => [t.id, pageOf(t.id)])), []);
  const list = TEMPLATES.filter((t) => !cat || t.category === cat);
  const tpl = TEMPLATES.find((t) => t.id === open);

  const use = async () => {
    setBusy(true);
    try { await onUse(open); setOpen(null); } finally { setBusy(false); }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-4" role="toolbar" aria-label="Categories">
        {['', ...TEMPLATE_CATEGORIES].map((c) => (
          <button key={c || 'all'} type="button" onClick={() => setCat(c)} aria-pressed={cat === c}
            className={cx('h-8 px-3.5 rounded-full text-[13px] font-semibold cursor-pointer border', cat === c ? 'bg-ink text-white border-ink' : 'bg-panel border-line text-muted hover:text-ink')}>
            {c || `All (${TEMPLATES.length})`}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
        {list.map((t) => (
          <li key={t.id}>
            <button type="button" onClick={() => setOpen(t.id)} className="group w-full text-left rounded-3xl border border-line/80 bg-panel p-2.5 hover:border-accent hover:shadow-md transition cursor-pointer">
              <WhenVisible className="dot-canvas rounded-2xl overflow-hidden grid place-items-center h-[230px] pointer-events-none">
                <Preview page={pages[t.id]} scale={0.3} />
              </WhenVisible>
              <p className="font-semibold text-sm mt-2.5 px-1">{t.name}</p>
              <p className="text-xs text-muted px-1 pb-1 line-clamp-2">{t.description}</p>
            </button>
          </li>
        ))}
      </ul>

      <Modal open={Boolean(tpl)} onClose={() => setOpen(null)} title={tpl?.name || ''} wide>
        {tpl && (
          <div className="grid sm:grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-6 items-start">
            <div className="dot-canvas rounded-3xl p-3 grid place-items-center">
              <Preview page={pages[tpl.id]} scale={0.72} />
            </div>
            <div className="space-y-4">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted"><LayoutTemplate size={14} /> {tpl.category}</p>
              <p className="text-sm">{tpl.description}</p>
              <ul className="text-sm text-muted space-y-1">
                {[...new Set(pages[tpl.id].blocks.map((b) => b.type))].slice(0, 8).map((type) => (
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
