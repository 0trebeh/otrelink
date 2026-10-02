'use client';
import { fonts } from '@otrelink/core';
import { cx } from '../ui';

export default function FontField({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-56 overflow-y-auto pr-1">
      {fonts.list().map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          aria-pressed={value === f.id}
          className={cx('text-left rounded-xl border px-3 py-2 cursor-pointer transition-colors', value === f.id ? 'border-accent bg-accent-soft' : 'border-line hover:border-ink/30')}
        >
          <span className="block text-lg leading-tight truncate" style={{ fontFamily: f.stack }}>Aa Bb</span>
          <span className="block text-[11px] text-muted truncate">{f.label}</span>
        </button>
      ))}
    </div>
  );
}
