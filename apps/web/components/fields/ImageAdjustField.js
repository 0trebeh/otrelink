'use client';
import { useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { imgStyle } from '@otrelink/core';
import { cx } from '../ui';

const FITS = {
  cover: { label: 'Fill', help: 'Fills the shape and crops the rest' },
  contain: { label: 'Whole image', help: 'Shows the whole image, no crop' },
  natural: { label: 'Original shape', help: 'Keeps the image proportions' },
};
const DEFAULT = { x: 50, y: 50, zoom: 100, fit: 'cover' };

// Shape of the preview frame (close to how the image is shown on the page).
function frameStyle(frame, values) {
  if (frame === 'circle') return { className: 'w-36 rounded-full', style: { aspectRatio: '1 / 1' } };
  if (frame === 'square') return { className: 'w-28 rounded-2xl', style: { aspectRatio: '1 / 1' } };
  if (frame === 'portrait') return { className: 'w-36 rounded-2xl', style: { aspectRatio: '9 / 16' } };
  if (frame === 'ratio') return { className: 'w-full max-w-72 rounded-2xl', style: { aspectRatio: values?.ratio && values.ratio !== 'auto' ? values.ratio : '4 / 3' } };
  return { className: 'w-full max-w-72 rounded-2xl', style: { aspectRatio: '16 / 9' } };
}

/**
 * Focus point + zoom + fit for an image. Click or drag on the preview to choose
 * the part of the image that stays visible.
 */
export default function ImageAdjustField({ id, field, value, onChange, values }) {
  const v = { ...DEFAULT, ...(value || {}) };
  const src = values?.[field.image];
  const box = useRef(null);
  const fits = field.fits || ['cover', 'contain'];
  const set = (patch) => onChange({ ...v, ...patch });

  const pick = (e) => {
    const r = box.current.getBoundingClientRect();
    const x = Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)));
    const y = Math.round(Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)));
    set({ x, y });
  };
  const onPointerDown = (e) => {
    if (v.fit === 'natural') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pick(e);
  };
  const onPointerMove = (e) => { if (e.buttons && v.fit !== 'natural') pick(e); };
  const onKeyDown = (e) => {
    const step = e.shiftKey ? 10 : 2;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    set({ x: Math.min(100, Math.max(0, v.x + d[0])), y: Math.min(100, Math.max(0, v.y + d[1])) });
  };

  if (!src) return <p className="text-xs text-muted">Add an image first.</p>;
  const frame = frameStyle(field.frame, values);
  const natural = v.fit === 'natural';

  return (
    <div className="rounded-2xl border border-line bg-soft/40 p-3 grid sm:grid-cols-[auto_minmax(0,1fr)] gap-4 items-start">
      <div
        ref={box}
        id={id}
        role="slider"
        tabIndex={natural ? -1 : 0}
        aria-label="Focus point"
        aria-valuetext={`${v.x}% from the left, ${v.y}% from the top`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onKeyDown={onKeyDown}
        className={cx('relative overflow-hidden bg-line/60 select-none touch-none mx-auto focus:outline-none focus-visible:ring-3 focus-visible:ring-accent/40', natural ? 'cursor-default' : 'cursor-crosshair', frame.className)}
        style={natural ? { width: '9rem' } : frame.style}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" draggable={false} className={cx('block w-full pointer-events-none', !natural && 'h-full')}
          style={Object.fromEntries(imgStyle(v).split(';').filter(Boolean).map((rule) => {
            const [k, ...rest] = rule.split(':');
            return [k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), rest.join(':').trim()];
          }))} />
        {!natural && (
          <span className="absolute size-5 -ml-2.5 -mt-2.5 rounded-full border-2 border-white shadow-[0_0_0_1.5px_rgba(0,0,0,.45)] bg-accent/70 pointer-events-none"
            style={{ left: `${v.x}%`, top: `${v.y}%` }} aria-hidden="true" />
        )}
      </div>

      <div className="grid gap-3 min-w-0">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Fit">
          {fits.map((f) => (
            <button key={f} type="button" title={FITS[f].help} aria-pressed={v.fit === f} onClick={() => set({ fit: f })}
              className={cx('h-8 px-3 rounded-full text-xs font-semibold border cursor-pointer', v.fit === f ? 'bg-ink text-white border-ink' : 'bg-panel border-line text-muted hover:text-ink')}>
              {FITS[f].label}
            </button>
          ))}
        </div>
        {v.fit === 'cover' && (
          <label className="grid gap-1">
            <span className="text-xs font-semibold">Zoom</span>
            <span className="flex items-center gap-3">
              <input type="range" className="flex-1" min={100} max={300} step={5} value={v.zoom} onChange={(e) => set({ zoom: Number(e.target.value) })} />
              <span className="w-12 text-right text-xs tabular-nums text-muted">{v.zoom}%</span>
            </span>
          </label>
        )}
        <p className="text-xs text-muted">
          {natural ? FITS.natural.help + '.' : 'Click or drag on the picture to choose the part that stays visible. Arrow keys move it too.'}
        </p>
        <button type="button" onClick={() => onChange({ ...DEFAULT, fit: fits[0] })}
          className="justify-self-start inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink cursor-pointer">
          <RotateCcw size={13} /> Reset
        </button>
      </div>
    </div>
  );
}
