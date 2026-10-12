'use client';
// "Translation" section of a block (and of the profile): the owner writes each
// text in the page's second language. Empty = visitors see the original.
import { useId, useState } from 'react';
import { ChevronDown, Languages } from 'lucide-react';
import { translatableFields, blockTranslationProgress, isVisible, PAGE_LANGUAGES } from '@otrelink/core';
import { Input, Textarea, cx } from '../ui';

const has = (v) => String(v || '').trim() !== '';

/** One text: the original above, the translation below. */
function TextRow({ field, original, value, onChange, lang }) {
  const id = useId();
  const Comp = field.type === 'textarea' ? Textarea : Input;
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold">{field.label}</label>
      <p className="text-xs text-muted mt-0.5 mb-1.5 line-clamp-3 whitespace-pre-line" title={original}>{original}</p>
      <Comp id={id} value={value || ''} lang={lang} maxLength={field.max ?? (field.type === 'textarea' ? 2000 : 200)} rows={field.type === 'textarea' ? 3 : undefined}
        onChange={(e) => onChange(e.target.value)} placeholder={`${PAGE_LANGUAGES[lang]?.label || lang}…`} />
    </div>
  );
}

/** The translatable texts of `fields` for `data`, with their translation `value`. */
export function TranslationFields({ fields, data, value = {}, onChange, lang }) {
  const tf = translatableFields(fields).filter((f) => isVisible(f, data));
  const set = (k, v) => {
    const next = { ...value };
    if (has(v) || typeof v === 'object') next[k] = v; else delete next[k];
    onChange(next);
  };
  const rows = [];
  for (const f of tf) {
    if (f.type === 'list') {
      const items = (data?.[f.key] || []).filter((item) => f.fields.some((sf) => has(item[sf.key])));
      items.forEach((item, i) => {
        const tv = value?.[f.key]?.[item.id] || {};
        const setItem = (sk, v) => {
          const row = { ...tv };
          if (has(v)) row[sk] = v; else delete row[sk];
          const map = { ...(value?.[f.key] || {}) };
          if (Object.keys(row).length) map[item.id] = row; else delete map[item.id];
          if (Object.keys(map).length) set(f.key, map); else set(f.key, '');
        };
        rows.push(
          <div key={`${f.key}:${item.id}`} className="rounded-2xl border border-line p-3 bg-panel grid gap-3">
            <p className="text-xs font-semibold text-muted">{f.itemLabel || f.label} {i + 1}</p>
            {f.fields.filter((sf) => has(item[sf.key]) && isVisible(sf, item)).map((sf) => (
              <TextRow key={sf.key} field={sf} original={item[sf.key]} value={tv[sf.key]} lang={lang} onChange={(v) => setItem(sf.key, v)} />
            ))}
          </div>,
        );
      });
    } else if (has(data?.[f.key])) {
      rows.push(<TextRow key={f.key} field={f} original={data[f.key]} value={value?.[f.key]} lang={lang} onChange={(v) => set(f.key, v)} />);
    }
  }
  if (!rows.length) return <p className="text-xs text-muted">This block has no texts to translate yet.</p>;
  return <div className="grid gap-4">{rows}</div>;
}

/** Collapsible "Translation · Español (3/7)" section inside a block. */
export default function TranslationPanel({ block, mod, lang, value, onChange }) {
  const [open, setOpen] = useState(false);
  const { done, total } = blockTranslationProgress(block, value);
  if (!mod || !total) return null;
  const complete = done === total;
  return (
    <div className="mt-4">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="text-[13px] font-semibold text-accent-ink cursor-pointer inline-flex items-center gap-1.5">
        <Languages size={14} /> Translation · {PAGE_LANGUAGES[lang]?.label || lang}
        <span className={cx('text-[11px] font-semibold px-1.5 py-0.5 rounded-full', complete ? 'bg-teal/15 text-teal' : 'bg-soft text-muted')}>{done}/{total}</span>
        <ChevronDown size={14} className={cx('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-3 rounded-2xl bg-soft p-4">
          <p className="text-xs text-muted mb-3">Write each text in {PAGE_LANGUAGES[lang]?.label || lang}. Leave one empty to show the original.</p>
          <TranslationFields fields={mod.fields} data={block.data} value={value || {}} onChange={onChange} lang={lang} />
        </div>
      )}
    </div>
  );
}
