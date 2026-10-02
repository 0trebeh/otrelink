import { esc, safeUrl } from '../util/html.js';

export default {
  id: 'video',
  label: 'Video',
  fields: [
    { key: 'src', type: 'url', label: 'Video URL (.mp4 / .webm)', default: '' },
    { key: 'poster', type: 'image', label: 'Poster image', default: '' },
    { key: 'color', type: 'color', label: 'Fallback color', default: '#000000' },
    { key: 'overlay', type: 'color', label: 'Overlay color', default: '#000000' },
    { key: 'overlayOpacity', type: 'range', label: 'Overlay opacity', min: 0, max: 90, step: 5, default: 35 },
  ],
  css: (w, sel) =>
    `${sel}{background:${w.color}}${sel} video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}`
    + `${sel}::after{content:"";position:absolute;inset:0;background:${w.overlay};opacity:${w.overlayOpacity / 100}}`,
  // Optional: wallpapers can inject markup inside the background layer.
  html: (w) => {
    const src = safeUrl(w.src);
    if (!src) return '';
    const poster = safeUrl(w.poster);
    return `<video autoplay muted loop playsinline${poster ? ` poster="${esc(poster)}"` : ''} src="${esc(src)}"></video>`;
  },
};
