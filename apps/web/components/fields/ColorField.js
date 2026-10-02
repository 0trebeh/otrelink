'use client';
import { useEffect, useState } from 'react';

// Hex color with optional alpha (#rrggbb or #rrggbbaa).
const expand = (hex) => {
  let h = String(hex || '').replace('#', '');
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
  return h;
};

export default function ColorField({ value, onChange, id }) {
  const transparent = value === 'transparent';
  const h = transparent ? '00000000' : expand(value);
  const rgb = '#' + (h.slice(0, 6) || '000000');
  const alpha = h.length === 8 ? Math.round((parseInt(h.slice(6, 8), 16) / 255) * 100) : 100;
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);

  const emit = (nextRgb, nextAlpha) => {
    const a = nextAlpha >= 100 ? '' : Math.round((nextAlpha / 100) * 255).toString(16).padStart(2, '0');
    onChange(nextRgb.toLowerCase() + a);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="relative size-10 shrink-0 rounded-xl border border-line overflow-hidden cursor-pointer" style={{ backgroundImage: 'conic-gradient(#ddd 25%, #fff 0 50%, #ddd 0 75%, #fff 0)', backgroundSize: '10px 10px' }}>
        <span className="absolute inset-0" style={{ background: transparent ? 'transparent' : value }} />
        <input type="color" value={rgb} onChange={(e) => emit(e.target.value, alpha)} className="absolute inset-0 opacity-0 cursor-pointer" aria-label="Pick color" />
      </label>
      <input
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(text) || text === 'transparent' ? onChange(text) : setText(value))}
        className="w-28 h-10 rounded-xl border border-line bg-panel px-2.5 text-sm font-mono focus:border-accent focus:outline-none"
        spellCheck={false}
      />
      <input type="range" min="0" max="100" value={alpha} onChange={(e) => emit(rgb, Number(e.target.value))} aria-label="Opacity" className="flex-1 min-w-0" />
      <span className="w-9 text-right text-xs text-muted tabular-nums">{alpha}%</span>
    </div>
  );
}
