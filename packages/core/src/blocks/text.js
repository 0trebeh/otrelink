import { miniMarkdown } from '../util/html.js';

export default {
  type: 'text',
  label: 'Text',
  description: 'A paragraph. Supports **bold**, *italic* and [links](https://…).',
  icon: 'text',
  category: 'Content',
  cssClasses: [
    { selector: '.ol-text', description: 'The paragraph' },
    { selector: '.ol-text.ol-card', description: 'When “Show on a card” is on' },
  ],
  fields: [
    { key: 'text', type: 'textarea', label: 'Text', required: true, max: 3000 },
    { key: 'align', type: 'select', label: 'Alignment', default: 'center', options: ['center', 'left', 'right'] },
    { key: 'card', type: 'toggle', label: 'Show on a card', default: false },
  ],
  summary: (d) => d.text.slice(0, 60),
  render: (d) => `<div class="ol-text${d.card ? ' ol-card' : ''}" style="text-align:${d.align}">${miniMarkdown(d.text)}</div>`,
  css: `.ol-root .ol-text{line-height:1.55}.ol-root .ol-text a{color:inherit;text-decoration:underline}`,
};
