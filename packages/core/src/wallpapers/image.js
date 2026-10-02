import { cssString } from '../util/html.js';

export default {
  id: 'image',
  label: 'Image',
  fields: [
    { key: 'image', type: 'image', label: 'Image', default: '' },
    { key: 'color', type: 'color', label: 'Fallback color', default: '#222222' },
    { key: 'overlay', type: 'color', label: 'Overlay color', default: '#000000' },
    { key: 'overlayOpacity', type: 'range', label: 'Overlay opacity', min: 0, max: 90, step: 5, default: 30 },
    { key: 'blur', type: 'range', label: 'Blur', min: 0, max: 30, default: 0 },
    { key: 'position', type: 'select', label: 'Focus', default: 'center', options: ['center', 'top', 'bottom', 'left', 'right'] },
  ],
  css: (w, sel) => {
    const img = w.image ? `url("${cssString(w.image)}")` : 'none';
    return `${sel}{background:${w.color}}`
      + `${sel}::before{content:"";position:absolute;inset:-${w.blur * 2}px;background:${img} ${w.position}/cover no-repeat;filter:blur(${w.blur}px)}`
      + `${sel}::after{content:"";position:absolute;inset:0;background:${w.overlay};opacity:${w.overlayOpacity / 100}}`;
  },
};
