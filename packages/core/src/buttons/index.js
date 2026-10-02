// Button styles: the "fill" of every button-like block (links, contact, etc).
// Each style gets the design CSS variables and returns rules for `.ol-btn`.
//
// Available variables:
//   --ol-btn-bg, --ol-btn-fg, --ol-btn-border, --ol-btn-bw,
//   --ol-btn-shadow, --ol-btn-radius
//
// To add a style: append an object. `preview` is used for the dashboard tile.

import { createRegistry } from '../util/registry.js';

const S = '.ol-root .ol-btn';

export const buttonStyles = createRegistry('buttonStyles', [
  {
    id: 'fill', label: 'Fill',
    css: `${S}{background:var(--ol-btn-bg);color:var(--ol-btn-fg);border:var(--ol-btn-bw) solid var(--ol-btn-border)}`,
    preview: { background: '#111', color: '#fff' },
  },
  {
    id: 'outline', label: 'Outline',
    css: `${S}{background:transparent;color:var(--ol-btn-bg);border:max(var(--ol-btn-bw),2px) solid var(--ol-btn-bg)}${S}:hover{background:var(--ol-btn-bg);color:var(--ol-btn-fg)}`,
    preview: { background: 'transparent', border: '2px solid #111', color: '#111' },
  },
  {
    id: 'soft-shadow', label: 'Soft shadow',
    css: `${S}{background:var(--ol-btn-bg);color:var(--ol-btn-fg);border:var(--ol-btn-bw) solid var(--ol-btn-border);box-shadow:0 6px 20px -4px var(--ol-btn-shadow)}`,
    preview: { background: '#fff', color: '#111', boxShadow: '0 4px 12px rgba(0,0,0,.25)' },
  },
  {
    id: 'hard-shadow', label: 'Hard shadow',
    css: `${S}{background:var(--ol-btn-bg);color:var(--ol-btn-fg);border:max(var(--ol-btn-bw),2px) solid var(--ol-btn-border);box-shadow:5px 5px 0 0 var(--ol-btn-shadow)}${S}:active{transform:translate(3px,3px);box-shadow:2px 2px 0 0 var(--ol-btn-shadow)}`,
    preview: { background: '#fff', color: '#111', border: '2px solid #111', boxShadow: '4px 4px 0 #111' },
  },
  {
    id: 'glass', label: 'Glass',
    css: `${S}{background:color-mix(in srgb,var(--ol-btn-bg) 22%,transparent);color:var(--ol-btn-fg);border:1px solid color-mix(in srgb,var(--ol-btn-bg) 45%,transparent);backdrop-filter:blur(14px) saturate(1.4);-webkit-backdrop-filter:blur(14px) saturate(1.4)}`,
    preview: { background: 'rgba(255,255,255,.35)', color: '#111', border: '1px solid rgba(255,255,255,.7)' },
  },
  {
    id: 'gradient', label: 'Gradient',
    css: `${S}{background:linear-gradient(120deg,var(--ol-btn-bg),var(--ol-btn-border));color:var(--ol-btn-fg);border:0}`,
    preview: { background: 'linear-gradient(120deg,#7c3aed,#ec4899)', color: '#fff' },
  },
  {
    id: 'neon', label: 'Neon',
    css: `${S}{background:transparent;color:var(--ol-btn-bg);border:2px solid var(--ol-btn-bg);box-shadow:0 0 10px var(--ol-btn-bg),inset 0 0 10px color-mix(in srgb,var(--ol-btn-bg) 40%,transparent);text-shadow:0 0 6px var(--ol-btn-bg)}`,
    preview: { background: '#0b0b12', color: '#39ff88', border: '2px solid #39ff88', boxShadow: '0 0 8px #39ff88' },
  },
  {
    id: 'underline', label: 'Minimal',
    css: `${S}{background:transparent;color:var(--ol-btn-bg);border:0;border-bottom:max(var(--ol-btn-bw),1px) solid var(--ol-btn-bg);border-radius:0!important}`,
    preview: { background: 'transparent', color: '#111', borderBottom: '1px solid #111', borderRadius: 0 },
  },
]);

// Hover effects (design setting "buttonHover").
export const buttonHovers = createRegistry('buttonHovers', [
  { id: 'lift', label: 'Lift', css: `${S}:hover{transform:translateY(-2px)}` },
  { id: 'grow', label: 'Grow', css: `${S}:hover{transform:scale(1.025)}` },
  { id: 'shift', label: 'Shift', css: `${S}:hover{transform:translate(-2px,-2px)}` },
  { id: 'glow', label: 'Glow', css: `${S}:hover{box-shadow:0 0 0 3px color-mix(in srgb,var(--ol-btn-bg) 35%,transparent)}` },
  { id: 'dim', label: 'Dim', css: `${S}:hover{opacity:.82}` },
  { id: 'none', label: 'None', css: '' },
]);
