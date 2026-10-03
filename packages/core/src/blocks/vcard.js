import { esc } from '../util/html.js';
import { icon } from '../icons.js';

const line = (k, v) => (v ? `${k}:${String(v).replace(/[\r\n,;]/g, ' ')}\r\n` : '');

export default {
  type: 'vcard',
  label: 'Contact card',
  description: 'A “Save contact” button that downloads your details.',
  icon: 'card',
  category: 'Contact',
  cssClasses: [
    { selector: '.ol-btn', description: '“Save contact” button' },
  ],
  fields: [
    { key: 'name', type: 'text', label: 'Full name', required: true },
    { key: 'org', type: 'text', label: 'Company' },
    { key: 'role', type: 'text', label: 'Job title' },
    { key: 'phone', type: 'tel', label: 'Phone' },
    { key: 'email', type: 'email', label: 'Email' },
    { key: 'website', type: 'url', label: 'Website' },
    { key: 'label', type: 'text', label: 'Button text', default: 'Save my contact' },
  ],
  summary: (d) => d.name,
  render(d, ctx) {
    const vcf = 'BEGIN:VCARD\r\nVERSION:3.0\r\n' + line('FN', d.name) + line('ORG', d.org) + line('TITLE', d.role)
      + line('TEL;TYPE=CELL', d.phone) + line('EMAIL', d.email) + line('URL', d.website) + 'END:VCARD\r\n';
    const href = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcf)}`;
    // data: URLs are not allowed by safeUrl, so this block builds its own anchor.
    return `<a class="ol-btn has-media" href="${esc(href)}" download="${esc(d.name || 'contact')}.vcf" data-ol-track="${esc(ctx.blockId)}">`
      + `<span class="ol-btn-icon">${icon('card', 20)}</span>`
      + `<span class="ol-btn-label"><span class="ol-btn-title">${esc(d.label)}</span></span><span class="ol-btn-spacer"></span></a>`;
  },
};
