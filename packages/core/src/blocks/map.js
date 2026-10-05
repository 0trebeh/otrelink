import { esc } from '../util/html.js';
import { frame, toggleButton } from './_shared.js';

export default {
  type: 'map',
  label: 'Map',
  description: 'Show a location with Google Maps.',
  icon: 'map',
  category: 'Content',
  cssClasses: [
    { selector: '.ol-frame', description: 'Google Maps embed' },
    { selector: '.ol-toggle', description: 'Wrapper in “Button that opens it” mode (details, [open] when expanded)' },
  ],
  fields: [
    { key: 'address', type: 'text', label: 'Address or place', required: true, placeholder: 'Eiffel Tower, Paris' },
    { key: 'title', type: 'text', label: 'Title (optional)' },
    { key: 'zoom', type: 'range', label: 'Zoom', min: 3, max: 20, default: 15 },
    { key: 'height', type: 'range', label: 'Height', min: 160, max: 480, step: 10, default: 260, unit: 'px' },
    { key: 'display', type: 'choice', label: 'Show as', default: 'always', options: [
      { value: 'always', label: 'Always visible' }, { value: 'button', label: 'Button that opens it' },
    ] },
    { key: 'buttonLabel', type: 'text', label: 'Button text', placeholder: 'Defaults to the title or “See on the map”', showIf: { key: 'display', equals: 'button' } },
    { key: 'buttonSub', type: 'text', label: 'Button subtitle (optional)', placeholder: 'Defaults to the address', showIf: { key: 'display', equals: 'button' } },
    { key: 'startOpen', type: 'toggle', label: 'Start open', default: false, showIf: { key: 'display', equals: 'button' } },
  ],
  summary: (d) => `${d.display === 'button' ? 'Button · ' : ''}${d.address}`,
  render(d, ctx) {
    const src = `https://maps.google.com/maps?q=${encodeURIComponent(d.address)}&z=${d.zoom}&output=embed`;
    const map = frame(src, { height: d.height, title: d.title || d.address });
    if (d.display === 'button') {
      return toggleButton({ ctx, iconName: 'map', label: d.buttonLabel || d.title || 'See on the map', sub: d.buttonSub || d.address, body: map, open: d.startOpen });
    }
    return `${d.title ? `<p class="ol-embed-title">${esc(d.title)}</p>` : ''}${map}`;
  },
};
