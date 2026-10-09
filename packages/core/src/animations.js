// Animations. Three registries:
//  - attention: loops on a single block to draw the eye (per-block setting)
//  - entrance: how the page (or one block) appears (design + per-block setting)
//  - background motion: slow movement of the page background (design setting)
// Each module provides its CSS; the renderer only includes what is used.
// Visitors who ask for reduced motion (OS setting) get no animation at all.

import { createRegistry } from './util/registry.js';

// ── Attention (per block, loops) ─────────────────────────────
// The loop runs on the block's content (> *), so it doesn't fight with the
// entrance animation, which runs on the block itself.
const att = (id, label, keyframes, animation) => ({
  id, label, css: `@keyframes ol-${id}{${keyframes}}.ol-anim-${id}>*{animation:${animation}}`,
});

export const attentionAnimations = createRegistry('attention', [
  { id: 'none', label: 'None', css: '' },
  att('pulse', 'Pulse', '0%,100%{transform:scale(1)}50%{transform:scale(1.035)}', 'ol-pulse 1.6s ease-in-out infinite'),
  att('shake', 'Shake', '0%,80%,100%{transform:translateX(0)}84%,92%{transform:translateX(-5px)}88%,96%{transform:translateX(5px)}', 'ol-shake 3s ease-in-out infinite'),
  att('wobble', 'Wobble', '0%,70%,100%{transform:rotate(0)}75%{transform:rotate(-2deg)}85%{transform:rotate(2deg)}95%{transform:rotate(-1deg)}', 'ol-wobble 2.6s ease-in-out infinite'),
  att('bounce', 'Bounce', '0%,60%,100%{transform:translateY(0)}70%{transform:translateY(-8px)}80%{transform:translateY(0)}88%{transform:translateY(-3px)}', 'ol-bounce 2.4s ease infinite'),
  att('glow', 'Glow', '0%,100%{filter:drop-shadow(0 0 0 transparent)}50%{filter:drop-shadow(0 0 12px var(--ol-btn-bg))}', 'ol-glow 2s ease-in-out infinite'),
  att('heartbeat', 'Heartbeat', '0%,40%,100%{transform:scale(1)}10%,30%{transform:scale(1.05)}20%{transform:scale(.98)}', 'ol-heartbeat 1.8s ease-in-out infinite'),
  att('float', 'Float', '0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}', 'ol-float 3.2s ease-in-out infinite'),
  att('swing', 'Swing', '0%,100%{transform:rotate(0)}20%{transform:rotate(3deg)}40%{transform:rotate(-2deg)}60%{transform:rotate(1deg)}80%{transform:rotate(-1deg)}', 'ol-swing 2.4s ease-in-out infinite;transform-origin:top center'),
  att('jello', 'Jello', '0%,60%,100%{transform:none}66%{transform:skewX(-6deg) skewY(-1deg)}72%{transform:skewX(4deg) skewY(.6deg)}78%{transform:skewX(-2deg)}84%{transform:skewX(1deg)}', 'ol-jello 3s ease-in-out infinite'),
  att('tada', 'Tada', '0%,70%,100%{transform:none}73%,76%{transform:scale(.97) rotate(-2deg)}79%,85%,91%{transform:scale(1.04) rotate(2deg)}82%,88%{transform:scale(1.04) rotate(-2deg)}', 'ol-tada 3.4s ease-in-out infinite'),
  att('rubber', 'Rubber band', '0%,70%,100%{transform:scale(1)}76%{transform:scale(1.06,.94)}82%{transform:scale(.96,1.04)}88%{transform:scale(1.03,.97)}94%{transform:scale(.99,1.01)}', 'ol-rubber 3s ease-in-out infinite'),
  att('blink', 'Blink', '0%,100%{opacity:1}50%{opacity:.55}', 'ol-blink 1.6s ease-in-out infinite'),
  {
    // A light sweep across the block (buttons, banners, cards).
    id: 'shine', label: 'Shine',
    css: '@keyframes ol-shine{0%,65%{transform:translateX(-120%) skewX(-20deg)}100%{transform:translateX(220%) skewX(-20deg)}}'
      + '.ol-anim-shine{position:relative;overflow:hidden;border-radius:var(--ol-btn-radius)}'
      + '.ol-anim-shine::after{content:"";position:absolute;inset:0;width:45%;pointer-events:none;background:linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent);animation:ol-shine 3.2s ease-in-out infinite}',
  },
  {
    // A ring that grows out of the block, like a notification.
    id: 'ripple', label: 'Ripple',
    css: '@keyframes ol-ripple{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ol-btn-bg) 45%,transparent)}70%,100%{box-shadow:0 0 0 14px transparent}}'
      + '.ol-anim-ripple{position:relative}.ol-anim-ripple::after{content:"";position:absolute;inset:0;border-radius:var(--ol-btn-radius);pointer-events:none;animation:ol-ripple 2s ease-out infinite}',
  },
]);

// ── Entrance (page load or scroll) ───────────────────────────
// `kf` = keyframes, `run` = duration (s) + easing. Speed (design) multiplies the duration.
const SPRING = 'cubic-bezier(.2,.7,.2,1)';
const ENTRANCES = [
  ['fade', 'Fade in', 'from{opacity:0}to{opacity:1}', .6, 'ease'],
  ['fade-up', 'Fade up', 'from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}', .55, SPRING],
  ['zoom', 'Zoom', 'from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}', .5, SPRING],
  ['slide', 'Slide in', 'from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}', .5, SPRING],
  ['flip', 'Flip', 'from{opacity:0;transform:perspective(600px) rotateX(-40deg)}to{opacity:1;transform:none}', .6, SPRING, 'transform-origin:top'],
  ['slide-right', 'Slide from right', 'from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}', .5, SPRING],
  ['drop', 'Drop', 'from{opacity:0;transform:translateY(-18px)}to{opacity:1;transform:none}', .55, SPRING],
  ['rise', 'Rise', 'from{opacity:0;transform:translateY(40px) scale(.97)}to{opacity:1;transform:none}', .75, 'cubic-bezier(.16,1,.3,1)'],
  ['blur', 'Blur in', 'from{opacity:0;filter:blur(12px);transform:scale(1.03)}to{opacity:1;filter:none;transform:none}', .7, 'ease'],
  ['pop', 'Pop', '0%{opacity:0;transform:scale(.6)}70%{opacity:1;transform:scale(1.04)}100%{opacity:1;transform:none}', .55, 'cubic-bezier(.34,1.56,.64,1)'],
  ['tilt', 'Tilt', 'from{opacity:0;transform:rotate(-4deg) translateY(16px)}to{opacity:1;transform:none}', .6, SPRING, 'transform-origin:left bottom'],
  ['unfold', 'Unfold', 'from{opacity:0;clip-path:inset(0 0 100% 0)}to{opacity:1;clip-path:inset(0 0 0 0)}', .7, 'cubic-bezier(.65,0,.35,1)'],
  ['swing-in', 'Swing in', 'from{opacity:0;transform:perspective(600px) rotateY(-35deg)}to{opacity:1;transform:none}', .7, SPRING, 'transform-origin:left center'],
  ['bounce-in', 'Bounce in', '0%{opacity:0;transform:translateY(30px)}60%{opacity:1;transform:translateY(-6px)}80%{transform:translateY(2px)}100%{opacity:1;transform:none}', .8, 'ease-out'],
];

const entranceCss = ([id, , kf, dur, ease, extra = '']) => {
  const anim = `ol-in-${id} calc(${dur}s * var(--ol-enter-speed,1)) ${ease} both${extra ? `;${extra}` : ''}`;
  return `@keyframes ol-in-${id}{${kf}}`
    // Whole page (design → Entrance animation)…
    + `.ol-enter-${id} .ol-enter{animation:${anim}}`
    // …or one block (block → Animation → Entrance), which wins.
    + `.ol-root .ol-enter.ol-in-${id}{animation:${anim}}`;
};

export const entranceAnimations = createRegistry('entrance', [
  { id: 'none', label: 'None', css: '' },
  ...ENTRANCES.map((e) => ({ id: e[0], label: e[1], css: entranceCss(e) })),
]);

/** Entrance speed (design): multiplies every entrance duration. */
export const ENTRANCE_SPEEDS = [
  { value: 'slow', label: 'Slow', factor: 1.6 },
  { value: 'normal', label: 'Normal', factor: 1 },
  { value: 'fast', label: 'Fast', factor: 0.6 },
];

// ── Background motion (design) ───────────────────────────────
// Moves the whole background layer slowly; works with every background type.
export const backgroundMotions = createRegistry('backgroundMotion', [
  { id: 'none', label: 'None', css: '' },
  {
    id: 'breathe', label: 'Breathe (slow zoom)',
    css: '@keyframes ol-bgm-breathe{from{transform:scale(1)}to{transform:scale(1.12)}}.ol-bgm-breathe .ol-bg{animation:ol-bgm-breathe 18s ease-in-out infinite alternate}',
  },
  {
    id: 'pan', label: 'Pan',
    css: '@keyframes ol-bgm-pan{from{transform:scale(1.15) translate(-3%,-2%)}to{transform:scale(1.15) translate(3%,2%)}}.ol-bgm-pan .ol-bg{animation:ol-bgm-pan 24s ease-in-out infinite alternate}',
  },
  {
    id: 'flow', label: 'Flow (gradients)',
    css: '@keyframes ol-bgm-flow{from{background-position:0% 50%}to{background-position:100% 50%}}.ol-bgm-flow .ol-bg{background-size:220% 220%!important;animation:ol-bgm-flow 16s ease-in-out infinite alternate}',
    wallpapers: ['gradient'],
  },
  {
    id: 'hue', label: 'Color shift',
    css: '@keyframes ol-bgm-hue{from{filter:hue-rotate(0deg)}to{filter:hue-rotate(360deg)}}.ol-bgm-hue .ol-bg{animation:ol-bgm-hue 40s linear infinite}',
  },
  {
    id: 'parallax', label: 'Parallax on scroll',
    // The page sets --ol-scroll while scrolling (see hydratePage).
    css: '.ol-bgm-parallax .ol-bg{transform:scale(1.15) translateY(calc(var(--ol-scroll,0) * -6%));will-change:transform}',
    script: 'parallax',
  },
]);

/** Tap feedback on buttons (design "Button press"). */
export const PRESS_CSS = '.ol-press .ol-btn:active,.ol-press .ol-cat-buy:active,.ol-press .ol-contact .ol-btn:active{transform:scale(.96)!important;transition-duration:.08s!important}';
