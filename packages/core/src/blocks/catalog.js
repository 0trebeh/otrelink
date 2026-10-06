// Catalog block: products with price, discount, stock, description and a
// buy link (or an order through WhatsApp). Shown as a button that opens the
// catalog, or always visible. Pro feature (see ../plans.js).
import { esc, safeUrl } from '../util/html.js';
import { imgStyle } from '../util/image.js';
import { icon } from '../icons.js';
import { toggleButton } from './_shared.js';

/** "1,234.5" -> number formatting chosen in the block. */
export function formatMoney(n, d = {}) {
  const value = Math.round(Number(n) * 100) / 100;
  const decimals = Number.isInteger(value) ? 0 : 2;
  const loc = d.numberFormat === 'comma' ? 'de-DE' : 'en-US';
  const num = value.toLocaleString(loc, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const cur = d.currency || '';
  if (!cur) return num;
  return d.currencyPosition === 'after' ? `${num} ${cur}` : `${cur}${/[a-z.]$/i.test(cur) ? ' ' : ''}${num}`;
}

/** Final price after the discount. */
export const salePrice = (p) => Math.round(Number(p.price || 0) * (100 - Number(p.discount || 0))) / 100;

/** Stock as a number, or null when it is not shown. */
export const stockOf = (p) => (/^\d+$/.test(String(p.stock ?? '').trim()) ? Number(String(p.stock).trim()) : null);

const waNumber = (tel) => String(tel || '').replace(/\D/g, '');

export default {
  type: 'catalog',
  label: 'Catalog',
  description: 'Products with prices, discounts and stock, as a button that opens them or always visible.',
  icon: 'bag',
  category: 'Content',
  cssClasses: [
    { selector: '.ol-catalog', description: 'Catalog wrapper (.is-grid or .is-list)' },
    { selector: '.ol-cat-head', description: 'Title and description above the products' },
    { selector: '.ol-cat-item', description: 'One product (.is-soldout when stock is 0)' },
    { selector: '.ol-cat-media', description: 'Product image' },
    { selector: '.ol-cat-badge', description: 'Product label (e.g. New)' },
    { selector: '.ol-cat-off', description: 'Discount label (e.g. -20%)' },
    { selector: '.ol-cat-name', description: 'Product name' },
    { selector: '.ol-cat-desc', description: 'Product description' },
    { selector: '.ol-cat-price', description: 'Final price' },
    { selector: '.ol-cat-old', description: 'Price before the discount' },
    { selector: '.ol-cat-stock', description: 'Stock text (.is-low, .is-out)' },
    { selector: '.ol-cat-buy', description: 'Buy / Order button' },
  ],
  fields: [
    { key: 'display', type: 'choice', label: 'Show as', default: 'button', options: [
      { value: 'button', label: 'Button that opens it' }, { value: 'always', label: 'Always visible' },
    ] },
    { key: 'buttonLabel', type: 'text', label: 'Button text', default: 'Catalog', showIf: { key: 'display', equals: 'button' } },
    { key: 'buttonSub', type: 'text', label: 'Button subtitle (optional)', placeholder: 'See products and prices', showIf: { key: 'display', equals: 'button' } },
    { key: 'startOpen', type: 'toggle', label: 'Start open', default: false, showIf: { key: 'display', equals: 'button' } },
    { key: 'title', type: 'text', label: 'Title (optional)', max: 80 },
    { key: 'description', type: 'textarea', label: 'Description (optional)', max: 400, placeholder: 'Shipping, payment methods, how to order…' },
    { key: 'products', type: 'list', label: 'Products', itemLabel: 'product', max: 60, fields: [
      { key: 'name', type: 'text', label: 'Name', required: true, max: 80 },
      { key: 'image', type: 'image', label: 'Image (optional)' },
      { key: 'adjust', type: 'imageAdjust', label: 'Adjust image', image: 'image', frame: 'square', showIf: { key: 'image', truthy: true } },
      { key: 'description', type: 'textarea', label: 'Description (optional)', max: 400 },
      { key: 'price', type: 'number', label: 'Price', min: 0, max: 100000000, step: 0.01, default: 0, help: '0 = no price shown.' },
      { key: 'discount', type: 'range', label: 'Discount', min: 0, max: 95, step: 5, default: 0, unit: '%' },
      { key: 'stock', type: 'text', label: 'Stock (optional)', max: 7, placeholder: 'e.g. 12',
        help: 'Units available. 0 = Sold out. Empty = stock is not shown.' },
      { key: 'badge', type: 'text', label: 'Label (optional)', max: 20, placeholder: 'New, Best seller…' },
      { key: 'url', type: 'url', label: 'Link (optional)', help: 'Product or checkout page. Without a link, the WhatsApp order is used (if set).' },
    ], default: [
      { id: 'p1', name: 'Product name', image: '', description: 'A short description of the product.', price: 25, discount: 0, stock: '', badge: 'New', url: '' },
    ] },
    { key: 'layout', type: 'choice', label: 'Layout', default: 'grid', options: [
      { value: 'grid', label: 'Grid (2 per row)' }, { value: 'list', label: 'List' },
    ] },
    { key: 'currency', type: 'text', label: 'Currency', default: '$', max: 6, placeholder: '$, €, Bs., USD' },
    { key: 'currencyPosition', type: 'select', label: 'Currency position', default: 'before', options: [
      { value: 'before', label: 'Before the price ($25)' }, { value: 'after', label: 'After the price (25 €)' },
    ] },
    { key: 'numberFormat', type: 'select', label: 'Number format', default: 'dot', options: [
      { value: 'dot', label: '1,234.50' }, { value: 'comma', label: '1.234,50' },
    ] },
    { key: 'buyLabel', type: 'text', label: 'Buy button text', default: 'Buy', max: 24 },
    { key: 'whatsapp', type: 'tel', label: 'Order via WhatsApp (optional)', placeholder: '+58 412 123 4567',
      help: 'Products without a link get a button that opens WhatsApp with the order written.' },
    { key: 'orderMessage', type: 'text', label: 'WhatsApp message', max: 200, default: 'Hi! I would like to order: {product} ({price})',
      showIf: { key: 'whatsapp', truthy: true }, help: '{product} and {price} are replaced by the product name and price.' },
    { key: 'lowStock', type: 'range', label: 'Show “Only N left” from', min: 0, max: 20, default: 5, help: '0 = never.' },
  ],
  summary: (d) => `${d.display === 'button' ? 'Button · ' : ''}${d.products.length} product${d.products.length === 1 ? '' : 's'}`,
  render(d, ctx) {
    const items = (d.products || []).filter((p) => p.name);
    const wa = waNumber(d.whatsapp);
    const card = (p) => {
      const stock = stockOf(p);
      const out = stock === 0;
      const price = Number(p.price) > 0;
      const off = price && Number(p.discount) > 0;
      const final = off ? salePrice(p) : Number(p.price);
      const priceText = price ? formatMoney(final, d) : '';
      const url = safeUrl(p.url);
      const href = url || (wa ? `https://wa.me/${wa}?text=${encodeURIComponent(String(d.orderMessage || '').replaceAll('{product}', p.name).replaceAll('{price}', priceText).replace(/\s*\(\)\s*$/, ''))}` : '');
      const img = p.image
        ? `<span class="ol-cat-media"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" style="${imgStyle(p.adjust)}"></span>`
        : `<span class="ol-cat-media ol-cat-noimg" aria-hidden="true">${icon('bag', 28)}</span>`;
      const badges = (p.badge || off)
        ? `<span class="ol-cat-badges">${p.badge ? `<span class="ol-cat-badge">${esc(p.badge)}</span>` : ''}${off ? `<span class="ol-cat-off">-${Number(p.discount)}%</span>` : ''}</span>` : '';
      const stockHtml = stock === null ? ''
        : out ? '<span class="ol-cat-stock is-out">Sold out</span>'
          : d.lowStock && stock <= d.lowStock ? `<span class="ol-cat-stock is-low">Only ${stock} left</span>`
            : '<span class="ol-cat-stock">In stock</span>';
      const buyLabel = esc(url || !wa ? d.buyLabel || 'Buy' : d.buyLabel && d.buyLabel !== 'Buy' ? d.buyLabel : 'Order');
      const buy = !href ? ''
        : out ? `<span class="ol-cat-buy" aria-disabled="true">${buyLabel}</span>`
          : `<a class="ol-cat-buy" href="${esc(href)}" target="_blank" rel="noopener noreferrer" data-ol-track="${esc(ctx.blockId)}" aria-label="${buyLabel}: ${esc(p.name)}">${wa && !url ? icon('message', 15) : ''}${buyLabel}</a>`;
      return `<li class="ol-cat-item${out ? ' is-soldout' : ''}">${img}${badges}<div class="ol-cat-info">`
        + `<p class="ol-cat-name">${esc(p.name)}</p>`
        + (p.description ? `<p class="ol-cat-desc">${esc(p.description)}</p>` : '')
        + `<div class="ol-cat-foot">${price ? `<p class="ol-cat-prices"><span class="ol-cat-price">${esc(priceText)}</span>${off ? `<s class="ol-cat-old">${esc(formatMoney(p.price, d))}</s>` : ''}</p>` : ''}${stockHtml}</div>`
        + `${buy}</div></li>`;
    };
    const head = d.title || d.description
      ? `<div class="ol-cat-head">${d.title ? `<p class="ol-cat-title">${esc(d.title)}</p>` : ''}${d.description ? `<p class="ol-cat-intro">${esc(d.description)}</p>` : ''}</div>` : '';
    const list = items.length
      ? `<ul class="ol-cat-list">${items.map(card).join('')}</ul>`
      : (ctx.mode === 'preview' ? '<p class="ol-cat-intro">Add products to your catalog.</p>' : '');
    const body = `<div class="ol-catalog is-${d.layout === 'list' ? 'list' : 'grid'}">${head}${list}</div>`;
    if (d.display === 'button') {
      const sub = d.buttonSub || `${items.length} product${items.length === 1 ? '' : 's'}`;
      return toggleButton({ ctx, iconName: 'bag', label: d.buttonLabel || d.title || 'Catalog', sub, body, open: d.startOpen, cls: 'ol-cat-toggle' });
    }
    return body;
  },
  css: `.ol-root .ol-catalog{container-type:inline-size;display:flex;flex-direction:column;gap:10px;text-align:left}
.ol-root .ol-cat-head{background:var(--ol-surface);color:var(--ol-surface-fg);border-radius:var(--ol-surface-radius);padding:14px 16px}
.ol-root .ol-cat-title{margin:0;font-family:var(--ol-title-font);font-weight:800;font-size:1.1em}
.ol-root .ol-cat-intro{margin:4px 0 0;font-size:.88em;opacity:.85;white-space:pre-line;line-height:1.45}
.ol-root .ol-cat-head .ol-cat-title+.ol-cat-intro{margin-top:4px}
.ol-root .ol-cat-head .ol-cat-intro:first-child{margin-top:0}
.ol-root .ol-cat-list{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.ol-root .is-grid .ol-cat-list{grid-template-columns:repeat(2,minmax(0,1fr))}
.ol-root .ol-cat-item{position:relative;display:flex;flex-direction:column;background:var(--ol-surface);color:var(--ol-surface-fg);border-radius:var(--ol-surface-radius);overflow:hidden;min-width:0}
.ol-root .is-list .ol-cat-item{flex-direction:row;align-items:stretch}
.ol-root .ol-cat-media{display:grid;place-items:center;aspect-ratio:1/1;overflow:hidden;background:color-mix(in srgb,var(--ol-surface-fg) 7%,transparent);color:color-mix(in srgb,var(--ol-surface-fg) 40%,transparent)}
.ol-root .is-list .ol-cat-media{width:96px;flex:none;align-self:flex-start}
.ol-root .ol-cat-media img{width:100%;height:100%;display:block;object-fit:cover}
.ol-root .ol-cat-badges{position:absolute;top:8px;left:8px;display:flex;flex-wrap:wrap;gap:4px;max-width:calc(100% - 16px)}
.ol-root .ol-cat-badge,.ol-root .ol-cat-off{font-size:.68em;font-weight:800;padding:3px 8px;border-radius:999px;line-height:1.3;background:var(--ol-surface-fg);color:var(--ol-surface)}
.ol-root .ol-cat-off{background:#dc2626;color:#fff}
.ol-root .ol-cat-info{flex:1;display:flex;flex-direction:column;gap:4px;padding:10px 12px 12px;min-width:0}
.ol-root .ol-cat-name{margin:0;font-weight:700;line-height:1.25;overflow-wrap:anywhere}
.ol-root .ol-cat-desc{margin:0;font-size:.8em;opacity:.78;line-height:1.4;white-space:pre-line;overflow-wrap:anywhere}
.ol-root .ol-cat-foot{margin-top:auto;padding-top:4px;display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:2px 8px}
.ol-root .ol-cat-prices{margin:0;display:flex;flex-wrap:wrap;align-items:baseline;gap:0 6px}
.ol-root .ol-cat-price{font-weight:800;font-size:1.05em;font-variant-numeric:tabular-nums}
.ol-root .ol-cat-old{font-size:.8em;opacity:.55;font-variant-numeric:tabular-nums}
.ol-root .ol-cat-stock{font-size:.72em;font-weight:700;opacity:.7}
.ol-root .ol-cat-stock.is-low{color:#d97706;opacity:1}
.ol-root .ol-cat-stock.is-out{color:#dc2626;opacity:1}
.ol-root .ol-cat-buy{margin-top:6px;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:0 14px;border-radius:999px;font-weight:700;font-size:.85em;text-decoration:none;background:var(--ol-surface-fg);color:var(--ol-surface)!important;transition:opacity .15s}
.ol-root a.ol-cat-buy:hover{opacity:.85}
.ol-root .ol-cat-buy svg{flex:none}
.ol-root .ol-cat-buy[aria-disabled]{opacity:.35;cursor:not-allowed}
.ol-root .ol-cat-item.is-soldout .ol-cat-media img{filter:grayscale(1);opacity:.6}
.ol-root .is-list .ol-cat-buy{align-self:flex-start}
@container (max-width:250px){.ol-root .is-grid .ol-cat-list{grid-template-columns:minmax(0,1fr)}}`,
};
