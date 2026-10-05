'use client';
import { useId } from 'react';
import { isVisible } from '@otrelink/core';
import { fieldInputs } from './index';
import { cx } from '../ui';

/** Renders a form for a list of field declarations. */
export default function FieldList({ fields, values = {}, onChange, compact }) {
  const base = useId();
  return (
    <div className={cx('grid', compact ? 'gap-3' : 'gap-4')}>
      {fields.filter((f) => isVisible(f, values)).map((f) => {
        const Input = fieldInputs[f.type];
        if (!Input) return <p key={f.key} className="text-xs text-danger">No input for field type “{f.type}”.</p>;
        const id = `${base}-${f.key}`;
        const inline = f.type === 'toggle';
        return (
          <div key={f.key} className={inline ? 'flex items-center justify-between gap-4' : ''}>
            <label htmlFor={id} className={cx('block text-[13px] font-semibold', !inline && 'mb-1.5')}>
              {f.label}
              {f.required && <span className="text-accent"> *</span>}
              {inline && f.help && <span className="block font-normal text-xs text-muted mt-0.5">{f.help}</span>}
            </label>
            <Input id={id} field={f} value={values[f.key]} values={values} onChange={(v) => onChange(f.key, v)} />
            {!inline && f.help && <p className="text-xs text-muted mt-1">{f.help}</p>}
          </div>
        );
      })}
    </div>
  );
}
