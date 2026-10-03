import { esc } from '../util/html.js';

export default {
  type: 'share',
  label: 'Share button',
  description: 'Lets visitors share your page.',
  icon: 'arrow',
  category: 'Essentials',
  cssClasses: [
    { selector: '.ol-share', description: 'Share button (also .ol-btn)' },
  ],
  fields: [{ key: 'label', type: 'text', label: 'Button text', default: 'Share this page' }],
  summary: (d) => d.label,
  render: (d, ctx) => `<button type="button" class="ol-btn ol-share" data-ol-track="${esc(ctx.blockId)}"><span class="ol-btn-label"><span class="ol-btn-title">${esc(d.label)}</span></span></button>`,
  hydrate(el) {
    const btn = el.querySelector('.ol-share');
    btn?.addEventListener('click', async () => {
      const url = el.ownerDocument.defaultView.location.href;
      const nav = el.ownerDocument.defaultView.navigator;
      try {
        if (nav.share) await nav.share({ url, title: el.ownerDocument.title });
        else { await nav.clipboard.writeText(url); btn.querySelector('.ol-btn-title').textContent = 'Link copied!'; }
      } catch { /* user cancelled */ }
    });
  },
};
