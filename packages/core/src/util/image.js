// Image adjustments (focus point, zoom and fit) shared by the profile picture,
// wallpaper, Image block and link thumbnails. Values come from the
// `imageAdjust` field type: { x: 0–100, y: 0–100, zoom: 100–300, fit }.
import { esc } from './html.js';

export const DEFAULT_ADJUST = Object.freeze({ x: 50, y: 50, zoom: 100, fit: 'cover' });

const ok = (a) => (a && typeof a === 'object' ? a : DEFAULT_ADJUST);
const zoomOf = (a) => (a.fit === 'cover' && a.zoom > 100 ? a.zoom / 100 : 1);

/** Inline CSS for an <img> (object-fit / object-position / zoom). */
export function imgStyle(adj) {
  const a = ok(adj);
  if (a.fit === 'natural') return '';
  const z = zoomOf(a);
  return `object-fit:${a.fit === 'contain' ? 'contain' : 'cover'};object-position:${a.x}% ${a.y}%;`
    + (z > 1 ? `transform:scale(${z});transform-origin:${a.x}% ${a.y}%;` : '');
}

/** True when the image is zoomed in (needs a clipping frame around it). */
export const isZoomed = (adj) => zoomOf(ok(adj)) > 1;

/**
 * <img> with adjustments. A zoomed image is wrapped in a <span> that takes
 * the classes (size, shape, border) and clips the zoom.
 */
export function adjustedImg({ src, alt = '', cls = '', adj, attrs = '' }) {
  const style = imgStyle(adj);
  const styleAttr = style ? ` style="${style}"` : '';
  const img = (c) => `<img${c ? ` class="${c}"` : ''} src="${esc(src)}" alt="${esc(alt)}"${attrs ? ` ${attrs}` : ''}${styleAttr}>`;
  return isZoomed(adj) ? `<span class="${cls} ol-zoom">${img('')}</span>` : img(cls);
}

/** CSS for background images (wallpaper). */
export function bgAdjust(adj) {
  const a = ok(adj);
  return { position: `${a.x}% ${a.y}%`, size: a.fit === 'contain' ? 'contain' : 'cover', zoom: zoomOf(a) };
}
