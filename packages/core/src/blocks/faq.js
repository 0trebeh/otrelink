import { esc, miniMarkdown } from '../util/html.js';

export default {
  type: 'faq',
  label: 'FAQ',
  description: 'Collapsible questions and answers.',
  icon: 'list',
  category: 'Content',
  cssClasses: [
    { selector: '.ol-faq', description: 'Card with all questions' },
    { selector: '.ol-faq-item', description: 'One question (details element)' },
    { selector: '.ol-faq-item summary', description: 'Question text' },
    { selector: '.ol-faq-item div', description: 'Answer' },
  ],
  fields: [
    { key: 'title', type: 'text', label: 'Title (optional)' },
    { key: 'items', type: 'list', label: 'Questions', itemLabel: 'question', max: 30, fields: [
      { key: 'question', type: 'text', label: 'Question', required: true },
      { key: 'answer', type: 'textarea', label: 'Answer' },
    ], default: [{ id: 'q1', question: 'What do you do?', answer: 'Tell your visitors here.' }] },
  ],
  summary: (d) => `${d.items.length} question${d.items.length === 1 ? '' : 's'}`,
  render(d) {
    const items = d.items.map((it) => `<details class="ol-faq-item"><summary>${esc(it.question)}</summary><div>${miniMarkdown(it.answer)}</div></details>`).join('');
    return `${d.title ? `<p class="ol-embed-title">${esc(d.title)}</p>` : ''}<div class="ol-card ol-faq">${items}</div>`;
  },
  css: `.ol-root .ol-faq{padding:4px 16px;text-align:left}
.ol-root .ol-faq-item{border-bottom:1px solid color-mix(in srgb,var(--ol-surface-fg) 15%,transparent)}
.ol-root .ol-faq-item:last-child{border-bottom:0}
.ol-root .ol-faq-item summary{cursor:pointer;padding:14px 0;font-weight:600;list-style:none;display:flex;justify-content:space-between;gap:12px}
.ol-root .ol-faq-item summary::-webkit-details-marker{display:none}
.ol-root .ol-faq-item summary::after{content:"+";font-size:1.2em;line-height:1;transition:transform .2s}
.ol-root .ol-faq-item[open] summary::after{transform:rotate(45deg)}
.ol-root .ol-faq-item div{padding:0 0 14px;opacity:.85;line-height:1.5}`,
};
