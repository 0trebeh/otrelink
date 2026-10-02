'use client';
import { fieldOptions } from '@otrelink/core';
import { cx } from '../ui';

// Visual tiles. Options may carry a `preview` style object (e.g. button styles).
export default function ChoiceField({ value, onChange, field }) {
  const opts = fieldOptions(field);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {opts.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cx('rounded-2xl border p-2.5 text-xs font-medium cursor-pointer transition-colors flex flex-col items-center gap-2', value === o.value ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line hover:border-ink/30')}
        >
          {o.preview && <span className="block w-full h-6 rounded-lg" style={{ ...o.preview, borderRadius: o.preview.borderRadius ?? 8 }} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}
