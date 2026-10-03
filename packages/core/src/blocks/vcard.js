// Contact card: a button that expands to show your details, each with a copy
// button. Downloading the .vcf contact file is optional.
import { esc, safeUrl } from '../util/html.js';
import { icon } from '../icons.js';

const clean = (v) => String(v || '').replace(/[\r\n]+/g, ' ').replace(/[,;]/g, ' ');
const line = (k, v) => (v ? `${k}:${clean(v)}\r\n` : '');

function vcfHref(d) {
  const vcf = 'BEGIN:VCARD\r\nVERSION:3.0\r\n' + line('FN', d.name) + line('ORG', d.org) + line('TITLE', d.role)
    + line('TEL;TYPE=CELL', d.phone) + line('EMAIL', d.email) + line('URL', d.website)
    + (d.address ? `ADR;TYPE=WORK:;;${clean(d.address)};;;;\r\n` : '') + line('NOTE', d.note) + 'END:VCARD\r\n';
  return `data:text/vcard;charset=utf-8,${encodeURIComponent(vcf)}`;
}

function row(iconName, label, value, href) {
  const url = href ? safeUrl(href) : '';
  const text = url
    ? `<a class="ol-vcard-value" href="${esc(url)}"${/^https?:/.test(url) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${esc(value)}</a>`
    : `<span class="ol-vcard-value">${esc(value)}</span>`;
  return `<div class="ol-vcard-row"><span class="ol-vcard-icon" title="${esc(label)}">${icon(iconName, 18)}</span>`
    + `<span class="ol-vcard-text"><small>${esc(label)}</small>${text}</span>`
    + `<button type="button" class="ol-copy" data-copy="${esc(value)}" aria-label="Copy ${esc(label.toLowerCase())}">${icon('copy', 16)}</button></div>`;
}

export default {
  type: 'vcard',
  label: 'Contact card',
  description: 'Your contact details in an expandable card, easy to copy or save.',
  icon: 'card',
  category: 'Contact',
  cssClasses: [
    { selector: '.ol-vcard', description: 'Wrapper (details element; [open] when expanded)' },
    { selector: '.ol-vcard > .ol-btn', description: 'The button that opens the card' },
    { selector: '.ol-vcard-body', description: 'Card with the details' },
    { selector: '.ol-vcard-head', description: 'Name, job title and company' },
    { selector: '.ol-vcard-row', description: 'One detail (phone, email…)' },
    { selector: '.ol-vcard-value', description: 'The detail text or link' },
    { selector: '.ol-copy', description: 'Copy button (.is-copied after copying)' },
    { selector: '.ol-vcard-save', description: '“Save contact” download button' },
  ],
  fields: [
    { key: 'label', type: 'text', label: 'Button text', default: 'Contact info' },
    { key: 'name', type: 'text', label: 'Full name', required: true },
    { key: 'role', type: 'text', label: 'Job title' },
    { key: 'org', type: 'text', label: 'Company' },
    { key: 'phone', type: 'tel', label: 'Phone' },
    { key: 'email', type: 'email', label: 'Email' },
    { key: 'website', type: 'url', label: 'Website' },
    { key: 'address', type: 'text', label: 'Address' },
    { key: 'note', type: 'textarea', label: 'Note', max: 300, placeholder: 'Office hours, how you prefer to be contacted…' },
    { key: 'startOpen', type: 'toggle', label: 'Show the card open', default: false },
    { key: 'showDownload', type: 'toggle', label: 'Show “Save contact” button', default: true, help: 'Downloads a .vcf file that phones add to Contacts.' },
    { key: 'downloadLabel', type: 'text', label: 'Save button text', default: 'Save contact', showIf: { key: 'showDownload', truthy: true } },
  ],
  summary: (d) => d.name,
  render(d, ctx) {
    const rows = [
      d.phone && row('phone', 'Phone', d.phone, `tel:${d.phone.replace(/[^\d+]/g, '')}`),
      d.email && row('mail', 'Email', d.email, `mailto:${d.email}`),
      d.website && row('globe', 'Website', d.website.replace(/^https?:\/\//, '').replace(/\/$/, ''), d.website),
      d.address && row('map', 'Address', d.address, `https://maps.google.com/?q=${encodeURIComponent(d.address)}`),
    ].filter(Boolean).join('');
    const sub = [d.role, d.org].filter(Boolean).join(' · ');
    const save = d.showDownload
      ? `<a class="ol-vcard-save" href="${esc(vcfHref(d))}" download="${esc(d.name || 'contact')}.vcf" data-ol-track="${esc(ctx.blockId)}">${icon('download', 16)} ${esc(d.downloadLabel || 'Save contact')}</a>`
      : '';
    return `<details class="ol-vcard"${d.startOpen ? ' open' : ''}>`
      + `<summary class="ol-btn has-media" data-ol-track="${esc(ctx.blockId)}"><span class="ol-btn-icon">${icon('card', 20)}</span>`
      + `<span class="ol-btn-label"><span class="ol-btn-title">${esc(d.label || 'Contact info')}</span></span><span class="ol-btn-icon ol-vcard-chevron">${icon('chevron', 18)}</span></summary>`
      + `<div class="ol-card ol-vcard-body">`
      + `<div class="ol-vcard-head"><strong>${esc(d.name)}</strong>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`
      + rows
      + (d.note ? `<p class="ol-vcard-note">${esc(d.note)}</p>` : '')
      + save
      + '</div></details>';
  },
  hydrate(el) {
    const win = el.ownerDocument.defaultView;
    for (const btn of el.querySelectorAll('.ol-copy')) {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const text = btn.dataset.copy;
        try {
          await win.navigator.clipboard.writeText(text);
        } catch {
          // Fallback for browsers/iframes without clipboard permission.
          const ta = el.ownerDocument.createElement('textarea');
          ta.value = text;
          ta.style.cssText = 'position:fixed;opacity:0';
          el.ownerDocument.body.append(ta);
          ta.select();
          el.ownerDocument.execCommand('copy');
          ta.remove();
        }
        const original = btn.innerHTML;
        btn.classList.add('is-copied');
        btn.innerHTML = icon('check', 16);
        btn.setAttribute('aria-label', 'Copied');
        setTimeout(() => { btn.classList.remove('is-copied'); btn.innerHTML = original; }, 1500);
      });
    }
  },
  css: `.ol-root .ol-vcard>summary{list-style:none}
.ol-root .ol-vcard>summary::-webkit-details-marker{display:none}
.ol-root .ol-vcard-chevron{transition:transform .2s}
.ol-root .ol-vcard[open] .ol-vcard-chevron{transform:rotate(180deg)}
.ol-root .ol-vcard-body{margin-top:8px;padding:16px;text-align:left;display:flex;flex-direction:column;gap:4px;animation:ol-vcard-in .2s ease}
@keyframes ol-vcard-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.ol-root .ol-vcard-head{display:flex;flex-direction:column;margin-bottom:8px}
.ol-root .ol-vcard-head strong{font-size:1.1em;font-family:var(--ol-title-font)}
.ol-root .ol-vcard-head small{opacity:.75}
.ol-root .ol-vcard-row{display:flex;align-items:center;gap:12px;padding:8px 0;border-top:1px solid color-mix(in srgb,var(--ol-surface-fg) 12%,transparent)}
.ol-root .ol-vcard-icon{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:10px;flex-shrink:0;background:color-mix(in srgb,var(--ol-surface-fg) 9%,transparent)}
.ol-root .ol-vcard-text{flex:1;min-width:0;display:flex;flex-direction:column}
.ol-root .ol-vcard-text small{font-size:.75em;opacity:.65}
.ol-root .ol-vcard-value{color:inherit;text-decoration:none;font-weight:600;overflow-wrap:anywhere}
.ol-root a.ol-vcard-value:hover{text-decoration:underline}
.ol-root .ol-copy{display:inline-grid;place-items:center;width:36px;height:36px;border-radius:10px;border:0;cursor:pointer;flex-shrink:0;color:inherit;background:transparent;transition:background .15s}
.ol-root .ol-copy:hover{background:color-mix(in srgb,var(--ol-surface-fg) 10%,transparent)}
.ol-root .ol-copy.is-copied{color:#16a34a}
.ol-root .ol-vcard-note{margin:8px 0 0;font-size:.9em;opacity:.8;line-height:1.45}
.ol-root .ol-vcard-save{margin-top:12px;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:44px;border-radius:999px;font-weight:600;text-decoration:none;background:color-mix(in srgb,var(--ol-surface-fg) 9%,transparent);color:var(--ol-surface-fg)}
.ol-root .ol-vcard-save:hover{background:color-mix(in srgb,var(--ol-surface-fg) 15%,transparent)}`,
};
