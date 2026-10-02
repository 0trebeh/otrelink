// Animations. Two registries:
//  - attention: loops on a single block to draw the eye (per-block setting)
//  - entrance: how the whole page appears on load (design setting)
// Each module provides its CSS; the renderer only includes what is used.

import { createRegistry } from './util/registry.js';

export const attentionAnimations = createRegistry('attention', [
  { id: 'none', label: 'None', css: '' },
  {
    id: 'pulse', label: 'Pulse',
    css: '@keyframes ol-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}.ol-anim-pulse{animation:ol-pulse 1.6s ease-in-out infinite}',
  },
  {
    id: 'shake', label: 'Shake',
    css: '@keyframes ol-shake{0%,80%,100%{transform:translateX(0)}84%,92%{transform:translateX(-5px)}88%,96%{transform:translateX(5px)}}.ol-anim-shake{animation:ol-shake 3s ease-in-out infinite}',
  },
  {
    id: 'wobble', label: 'Wobble',
    css: '@keyframes ol-wobble{0%,70%,100%{transform:rotate(0)}75%{transform:rotate(-2deg)}85%{transform:rotate(2deg)}95%{transform:rotate(-1deg)}}.ol-anim-wobble{animation:ol-wobble 2.6s ease-in-out infinite}',
  },
  {
    id: 'bounce', label: 'Bounce',
    css: '@keyframes ol-bounce{0%,60%,100%{transform:translateY(0)}70%{transform:translateY(-8px)}80%{transform:translateY(0)}88%{transform:translateY(-3px)}}.ol-anim-bounce{animation:ol-bounce 2.4s ease infinite}',
  },
  {
    id: 'glow', label: 'Glow',
    css: '@keyframes ol-glow{0%,100%{filter:drop-shadow(0 0 0 transparent)}50%{filter:drop-shadow(0 0 12px var(--ol-btn-bg))}}.ol-anim-glow{animation:ol-glow 2s ease-in-out infinite}',
  },
]);

export const entranceAnimations = createRegistry('entrance', [
  { id: 'none', label: 'None', css: '' },
  {
    id: 'fade', label: 'Fade in',
    css: '@keyframes ol-in-fade{from{opacity:0}to{opacity:1}}.ol-enter-fade .ol-enter{animation:ol-in-fade .6s ease both}',
  },
  {
    id: 'fade-up', label: 'Fade up',
    css: '@keyframes ol-in-up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}.ol-enter-fade-up .ol-enter{animation:ol-in-up .55s cubic-bezier(.2,.7,.2,1) both}',
  },
  {
    id: 'zoom', label: 'Zoom',
    css: '@keyframes ol-in-zoom{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}.ol-enter-zoom .ol-enter{animation:ol-in-zoom .5s cubic-bezier(.2,.7,.2,1) both}',
  },
  {
    id: 'slide', label: 'Slide in',
    css: '@keyframes ol-in-slide{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}.ol-enter-slide .ol-enter{animation:ol-in-slide .5s cubic-bezier(.2,.7,.2,1) both}',
  },
  {
    id: 'flip', label: 'Flip',
    css: '@keyframes ol-in-flip{from{opacity:0;transform:perspective(600px) rotateX(-40deg)}to{opacity:1;transform:none}}.ol-enter-flip .ol-enter{animation:ol-in-flip .6s cubic-bezier(.2,.7,.2,1) both;transform-origin:top}',
  },
]);
