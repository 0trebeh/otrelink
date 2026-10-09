// Button styles: the "fill" of every button-like block (links, contact, etc).
// Each style gets the design CSS variables and returns rules for `.ol-btn`.
//
// Available variables:
//   --ol-btn-bg, --ol-btn-fg, --ol-btn-border, --ol-btn-bw,
//   --ol-btn-shadow, --ol-btn-radius, --ol-glass-alpha, --ol-glass-edge, --ol-glass-blur
//
// Rules must start with `.ol-root .ol-btn` (the S constant): blocks with their
// own style and the dashboard tiles re-scope them by replacing that prefix.
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
    // Opacity and blur come from the design (Buttons → Glass opacity / Glass blur).
    css: `${S}{background:color-mix(in srgb,var(--ol-btn-bg) var(--ol-glass-alpha,22%),transparent);color:var(--ol-btn-fg);border:1px solid color-mix(in srgb,var(--ol-btn-bg) var(--ol-glass-edge,45%),transparent);backdrop-filter:blur(var(--ol-glass-blur,14px)) saturate(1.4);-webkit-backdrop-filter:blur(var(--ol-glass-blur,14px)) saturate(1.4)}`,
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
  {
    id: '3d', label: '3D',
    // A thick base under the button; it sinks when pressed.
    css: `${S}{background:linear-gradient(180deg,color-mix(in srgb,var(--ol-btn-bg) 82%,#fff),var(--ol-btn-bg));color:var(--ol-btn-fg);border:0;box-shadow:0 6px 0 color-mix(in srgb,var(--ol-btn-bg) 58%,#000),0 12px 18px -6px var(--ol-btn-shadow);margin-bottom:6px}${S}:active{transform:translateY(4px);box-shadow:0 2px 0 color-mix(in srgb,var(--ol-btn-bg) 58%,#000),0 4px 8px -4px var(--ol-btn-shadow)}`,
    preview: { background: 'linear-gradient(180deg,#8b8ff8,#6366f1)', color: '#fff', boxShadow: '0 4px 0 #3c3f9a' },
  },
  {
    id: 'cel', label: 'Cel shading',
    // Flat two-tone fill (darker lower band), thick ink outline and a hard shadow.
    css: `${S}{background:var(--ol-btn-bg);color:var(--ol-btn-fg);border:max(var(--ol-btn-bw),3px) solid var(--ol-btn-border);box-shadow:inset 0 -9px 0 color-mix(in srgb,var(--ol-btn-bg) 72%,#000),inset 0 4px 0 color-mix(in srgb,var(--ol-btn-bg) 65%,#fff),4px 4px 0 var(--ol-btn-border)}${S}:active{transform:translate(2px,2px);box-shadow:inset 0 -9px 0 color-mix(in srgb,var(--ol-btn-bg) 72%,#000),inset 0 4px 0 color-mix(in srgb,var(--ol-btn-bg) 65%,#fff),2px 2px 0 var(--ol-btn-border)}`,
    preview: { background: '#ffd43b', color: '#1a1a1a', border: '3px solid #1a1a1a', boxShadow: 'inset 0 -6px 0 #b8961f, 3px 3px 0 #1a1a1a' },
  },
  {
    id: 'pop', label: 'Pop art',
    // Halftone dots over the color, comic outline and offset shadow.
    css: `${S}{background:radial-gradient(color-mix(in srgb,var(--ol-btn-fg) 22%,transparent) 1.2px,transparent 1.6px) 0 0/7px 7px,var(--ol-btn-bg);color:var(--ol-btn-fg);border:max(var(--ol-btn-bw),3px) solid var(--ol-btn-border);box-shadow:6px 6px 0 var(--ol-btn-shadow);font-weight:800;letter-spacing:.02em}`,
    preview: { background: 'radial-gradient(rgba(0,0,0,.25) 1px,transparent 1.4px) 0 0/5px 5px,#00b4ff', color: '#111', border: '3px solid #111', boxShadow: '4px 4px 0 #ff2d6f' },
  },
  {
    id: 'punk', label: 'Punk',
    // Ripped edges and a slight tilt, like a flyer taped to a wall.
    css: `${S}{background:var(--ol-btn-bg);color:var(--ol-btn-fg);border:0;border-radius:0!important;rotate:-.8deg;clip-path:polygon(0 6%,4% 0,22% 5%,38% 0,57% 4%,76% 0,92% 5%,100% 1%,99% 34%,100% 66%,98% 100%,79% 95%,61% 100%,43% 96%,24% 100%,6% 95%,0 100%,1% 64%,0 33%);font-weight:800;letter-spacing:.04em}${S}:hover{rotate:.8deg}`,
    preview: { background: '#ff2d95', color: '#0d0d0d', clipPath: 'polygon(0 8%,30% 0,60% 6%,100% 0,98% 100%,60% 92%,30% 100%,0 94%)', borderRadius: 0 },
  },
  {
    id: 'soft-ui', label: 'Soft UI',
    // Neumorphism: the button seems pressed out of the background.
    css: `${S}{background:var(--ol-btn-bg);color:var(--ol-btn-fg);border:0;box-shadow:6px 6px 14px color-mix(in srgb,var(--ol-btn-bg) 70%,#000),-6px -6px 14px color-mix(in srgb,var(--ol-btn-bg) 75%,#fff)}${S}:active{box-shadow:inset 4px 4px 10px color-mix(in srgb,var(--ol-btn-bg) 70%,#000),inset -4px -4px 10px color-mix(in srgb,var(--ol-btn-bg) 75%,#fff)}`,
    preview: { background: '#e6e7ee', color: '#444', boxShadow: '4px 4px 8px #b8b9c2,-4px -4px 8px #ffffff' },
  },
  {
    id: 'double', label: 'Double line',
    css: `${S}{background:var(--ol-btn-bg);color:var(--ol-btn-fg);border:0;outline:max(var(--ol-btn-bw),2px) solid var(--ol-btn-border);outline-offset:4px}`,
    preview: { background: '#111', color: '#fff', outline: '2px solid #111', outlineOffset: '3px' },
  },
  {
    id: 'sticker', label: 'Sticker',
    css: `${S}{background:var(--ol-btn-bg);color:var(--ol-btn-fg);border:4px solid #fff;box-shadow:0 3px 0 color-mix(in srgb,#fff 60%,#000),0 8px 16px -4px var(--ol-btn-shadow);rotate:-.4deg}`,
    preview: { background: '#ff7a59', color: '#fff', border: '3px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,.25)' },
  },
  {
    id: 'dashed', label: 'Dashed',
    css: `${S}{background:color-mix(in srgb,var(--ol-btn-bg) 10%,transparent);color:var(--ol-btn-bg);border:max(var(--ol-btn-bw),2px) dashed var(--ol-btn-bg)}${S}:hover{border-style:solid}`,
    preview: { background: 'rgba(17,17,17,.06)', color: '#111', border: '2px dashed #111' },
  },
]);

/**
 * CSS that makes a button style apply only inside `scope` (e.g. a block with
 * its own style). Clears what the page's style may have added first.
 */
export function scopedButtonCss(styleId, scope) {
  const style = buttonStyles.get(styleId);
  if (!style) return '';
  const sel = `.ol-root ${scope} .ol-btn`;
  return `${sel}{box-shadow:none;text-shadow:none;backdrop-filter:none;-webkit-backdrop-filter:none;clip-path:none;rotate:none;outline:0;margin-bottom:0;font-weight:600;letter-spacing:normal;border-radius:var(--ol-btn-radius)!important}`
    + style.css.replaceAll(S, sel);
}

// Hover effects (design setting "buttonHover").
export const buttonHovers = createRegistry('buttonHovers', [
  { id: 'lift', label: 'Lift', css: `${S}:hover{transform:translateY(-2px)}` },
  { id: 'grow', label: 'Grow', css: `${S}:hover{transform:scale(1.025)}` },
  { id: 'shift', label: 'Shift', css: `${S}:hover{transform:translate(-2px,-2px)}` },
  { id: 'glow', label: 'Glow', css: `${S}:hover{box-shadow:0 0 0 3px color-mix(in srgb,var(--ol-btn-bg) 35%,transparent)}` },
  { id: 'dim', label: 'Dim', css: `${S}:hover{opacity:.82}` },
  { id: 'press', label: 'Press', css: `${S}:hover{transform:scale(.975)}` },
  { id: 'tilt', label: 'Tilt', css: `${S}:hover{transform:rotate(-1.2deg) scale(1.01)}` },
  { id: 'bounce', label: 'Bounce', css: `@keyframes ol-h-bounce{0%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}70%{transform:translateY(-1px)}}${S}:hover{animation:ol-h-bounce .5s ease}` },
  { id: 'wiggle', label: 'Wiggle', css: `@keyframes ol-h-wiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-2deg)}75%{transform:rotate(2deg)}}${S}:hover{animation:ol-h-wiggle .4s ease}` },
  { id: 'shine', label: 'Shine', css: `${S}{overflow:hidden}${S}::after{content:"";position:absolute;inset:0;width:40%;pointer-events:none;transform:translateX(-150%) skewX(-20deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);transition:transform .6s ease}${S}:hover::after{transform:translateX(300%) skewX(-20deg)}` },
  { id: 'invert', label: 'Swap colors', css: `${S}:hover{background:var(--ol-btn-fg)!important;color:var(--ol-btn-bg)!important}` },
  { id: 'none', label: 'None', css: '' },
]);
