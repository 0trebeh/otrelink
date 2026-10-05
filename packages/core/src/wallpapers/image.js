import { cssString } from '../util/html.js';
import { bgAdjust } from '../util/image.js';

export default {
  id: 'image',
  label: 'Image',
  fields: [
    { key: 'image', type: 'image', label: 'Image', default: '' },
    { key: 'color', type: 'color', label: 'Fallback color', default: '#222222' },
    { key: 'overlay', type: 'color', label: 'Overlay color', default: '#000000' },
    { key: 'overlayOpacity', type: 'range', label: 'Overlay opacity', min: 0, max: 90, step: 5, default: 30 },
    { key: 'blur', type: 'range', label: 'Blur', min: 0, max: 30, default: 0 },
    { key: 'adjust', type: 'imageAdjust', label: 'Adjust image', image: 'image', frame: 'portrait', showIf: { key: 'image', truthy: true } },
    // Older pages: simple focus keyword (used until "Adjust image" is changed).
    { key: 'position', type: 'select', label: 'Focus', default: 'center', options: ['center', 'top', 'bottom', 'left', 'right'], showIf: { key: '__legacy', truthy: true } },
  ],
  css: (w, sel) => {
    const img = w.image ? `url("${cssString(w.image)}")` : 'none';
    const a = bgAdjust(w.adjust);
    const untouched = !w.adjust || (w.adjust.x === 50 && w.adjust.y === 50 && w.adjust.zoom === 100 && w.adjust.fit === 'cover');
    const pos = untouched && w.position ? w.position : a.position;
    const zoom = a.zoom > 1 ? `transform:scale(${a.zoom});transform-origin:${a.position};` : '';
    return `${sel}{background:${w.color}}`
      + `${sel}::before{content:"";position:absolute;inset:-${w.blur * 2}px;background:${img} ${pos}/${a.size} no-repeat;filter:blur(${w.blur}px);${zoom}}`
      + `${sel}::after{content:"";position:absolute;inset:0;background:${w.overlay};opacity:${w.overlayOpacity / 100}}`;
  },
};
