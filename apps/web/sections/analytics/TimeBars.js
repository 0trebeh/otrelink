'use client';
import { useState } from 'react';
import { cx } from '@/components/ui';

/**
 * Simple vertical bar chart (hour of day, day of week).
 * `labels` are shown under some bars; `full` labels are used in the tooltip.
 */
export default function TimeBars({ values, labels, full, color, unit, every = 1 }) {
  const [hover, setHover] = useState(null);
  const max = Math.max(1, ...values);
  const peak = values.indexOf(Math.max(...values));
  const total = values.reduce((a, b) => a + b, 0);
  return (
    <div>
      <div className="relative flex items-end gap-[3px] h-40" onMouseLeave={() => setHover(null)} role="img"
        aria-label={total ? `Busiest: ${full[peak]} (${values[peak]} ${unit})` : 'No data'}>
        {values.map((v, i) => (
          <div key={i} className="flex-1 h-full flex items-end cursor-default" onMouseEnter={() => setHover(i)}>
            <div className={cx('w-full rounded-t-md transition-opacity', hover !== null && hover !== i && 'opacity-50')}
              style={{ height: `${Math.max(v ? 4 : 1.5, (v / max) * 100)}%`, background: v ? color : 'var(--color-line)' }} />
          </div>
        ))}
        {hover !== null && (
          <div className="pointer-events-none absolute -top-2 -translate-y-full rounded-xl bg-ink text-white text-xs px-2.5 py-1.5 shadow-lg whitespace-nowrap"
            style={{ left: `clamp(0px, calc(${((hover + 0.5) / values.length) * 100}% - 50px), calc(100% - 110px))` }}>
            <b>{full[hover]}</b> · {values[hover]} {unit}
          </div>
        )}
      </div>
      <div className="flex gap-[3px] mt-1.5 text-[10px] text-muted tabular-nums" aria-hidden="true">
        {labels.map((l, i) => <span key={i} className="flex-1 text-center">{i % every === 0 ? l : ''}</span>)}
      </div>
      {total > 0 && <p className="text-xs text-muted mt-2">Busiest: <b className="text-ink">{full[peak]}</b> · {values[peak]} {unit} ({Math.round((values[peak] / total) * 100)}%)</p>}
    </div>
  );
}
