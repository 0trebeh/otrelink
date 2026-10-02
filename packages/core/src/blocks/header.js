import { esc } from '../util/html.js';

export default {
  type: 'header',
  label: 'Header',
  description: 'A title to separate sections.',
  icon: 'heading',
  category: 'Essentials',
  fields: [
    { key: 'text', type: 'text', label: 'Text', required: true, max: 100, placeholder: 'My projects' },
    { key: 'size', type: 'select', label: 'Size', default: 'md', options: [
      { value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' },
    ] },
    { key: 'align', type: 'select', label: 'Alignment', default: 'center', options: ['center', 'left', 'right'] },
  ],
  summary: (d) => d.text,
  render: (d) => `<h2 class="ol-header ol-header-${d.size}" style="text-align:${d.align}">${esc(d.text)}</h2>`,
  css: `.ol-root .ol-header{margin:10px 0 0;font-family:var(--ol-title-font);color:var(--ol-title-color);font-weight:var(--ol-title-weight);line-height:1.2}
.ol-root .ol-header-sm{font-size:.95em;opacity:.85;text-transform:uppercase;letter-spacing:.08em}
.ol-root .ol-header-md{font-size:1.25em}.ol-root .ol-header-lg{font-size:1.7em}`,
};
