import { esc } from '../util/html.js';
import { frame } from './_shared.js';

export default {
  type: 'map',
  label: 'Map',
  description: 'Show a location with Google Maps.',
  icon: 'map',
  category: 'Content',
  cssClasses: [
    { selector: '.ol-frame', description: 'Google Maps embed' },
  ],
  fields: [
    { key: 'address', type: 'text', label: 'Address or place', required: true, placeholder: 'Eiffel Tower, Paris' },
    { key: 'title', type: 'text', label: 'Title (optional)' },
    { key: 'zoom', type: 'range', label: 'Zoom', min: 3, max: 20, default: 15 },
    { key: 'height', type: 'range', label: 'Height', min: 160, max: 480, step: 10, default: 260, unit: 'px' },
  ],
  summary: (d) => d.address,
  render(d) {
    const src = `https://maps.google.com/maps?q=${encodeURIComponent(d.address)}&z=${d.zoom}&output=embed`;
    return `${d.title ? `<p class="ol-embed-title">${esc(d.title)}</p>` : ''}${frame(src, { height: d.height, title: d.title || d.address })}`;
  },
};
