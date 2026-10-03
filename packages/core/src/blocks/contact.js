import { button } from './_shared.js';

export default {
  type: 'contact',
  label: 'Contact buttons',
  description: 'Email, call or WhatsApp in one tap.',
  icon: 'message',
  category: 'Contact',
  cssClasses: [
    { selector: '.ol-contact', description: 'Wrapper' },
    { selector: '.ol-contact-stack / .ol-contact-row', description: 'Layout variants' },
    { selector: '.ol-btn', description: 'Each contact button' },
  ],
  fields: [
    { key: 'email', type: 'email', label: 'Email' },
    { key: 'emailLabel', type: 'text', label: 'Email button text', default: 'Send me an email', showIf: { key: 'email', truthy: true } },
    { key: 'phone', type: 'tel', label: 'Phone' },
    { key: 'phoneLabel', type: 'text', label: 'Call button text', default: 'Call me', showIf: { key: 'phone', truthy: true } },
    { key: 'whatsapp', type: 'tel', label: 'WhatsApp number', help: 'International format, e.g. +58 412 1234567' },
    { key: 'whatsappMessage', type: 'text', label: 'Prefilled WhatsApp message', showIf: { key: 'whatsapp', truthy: true } },
    { key: 'whatsappLabel', type: 'text', label: 'WhatsApp button text', default: 'Chat on WhatsApp', showIf: { key: 'whatsapp', truthy: true } },
    { key: 'layout', type: 'select', label: 'Layout', default: 'stack', options: [
      { value: 'stack', label: 'Stacked' }, { value: 'row', label: 'Side by side' },
    ] },
  ],
  summary: (d) => [d.email, d.phone, d.whatsapp].filter(Boolean).join(' · '),
  render(d, ctx) {
    const out = [];
    if (d.email) out.push(button({ href: `mailto:${d.email}`, label: d.emailLabel, iconName: 'mail', ctx }));
    if (d.phone) out.push(button({ href: `tel:${d.phone.replace(/[^\d+]/g, '')}`, label: d.phoneLabel, iconName: 'phone', ctx }));
    if (d.whatsapp) {
      const n = d.whatsapp.replace(/\D/g, '');
      const msg = d.whatsappMessage ? `?text=${encodeURIComponent(d.whatsappMessage)}` : '';
      out.push(button({ href: `https://wa.me/${n}${msg}`, label: d.whatsappLabel, iconName: 'whatsapp', ctx }));
    }
    return `<div class="ol-contact ol-contact-${d.layout}">${out.join('')}</div>`;
  },
  css: `.ol-root .ol-contact{display:flex;flex-direction:column;gap:var(--ol-gap)}
.ol-root .ol-contact-row{flex-direction:row}.ol-root .ol-contact-row .ol-btn{flex:1;min-width:0}
.ol-root .ol-contact-row .ol-btn-spacer{display:none}`,
};
