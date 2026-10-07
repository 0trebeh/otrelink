// "Where we are today": the live location set from the dashboard "Today"
// panel (it lasts until the end of that day), or today's stop of the Route
// block, with a map and Google Maps / Waze directions.
import { esc } from '../util/html.js';
import { icon } from '../icons.js';
import { localTimeZone, timeZoneOptions } from '../booking.js';
import { currentStop, todayIn, directionsUrls, formatMinutes, pageLocale } from '../hours.js';
import { flattenBlocks } from '../tree.js';

const toMin = (t) => { const m = String(t || '').match(/^(\d{1,2}):(\d{2})$/); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };

/** Where to show: { place, address, lat, lon, note, until, source: 'today' | 'route' } or null. */
export function locationNow(d, page, now = Date.now()) {
  const t = page?.today;
  const has = t && (t.place || t.address || (Number.isFinite(t.lat) && Number.isFinite(t.lon)));
  if (has && (!d.expires || (t.placeAt && todayIn(d.timezone, new Date(t.placeAt)) === todayIn(d.timezone, new Date(now))))) {
    return { place: t.place, address: t.address, lat: t.lat, lon: t.lon, note: t.note, until: t.until, source: 'today' };
  }
  if (!d.useRoute) return null;
  const route = flattenBlocks(page?.blocks || []).find((b) => b.type === 'route' && b.enabled !== false);
  if (!route) return null;
  const stop = currentStop(route.data.stops || [], route.data.timezone, new Date(now));
  return stop ? { place: stop.place, address: stop.address, note: stop.note, from: stop.from, until: stop.to, now: stop.now, source: 'route' } : null;
}

function html(d, ctx, now) {
  const loc = locationNow(d, ctx.page, now);
  const locale = pageLocale(ctx.page);
  const head = d.title ? `<p class="ol-loc-title">${icon('map', 16)}${esc(d.title)}</p>` : '';
  if (!loc) {
    return `<div class="ol-loc is-empty">${head}<p class="ol-loc-empty">${esc(d.emptyText)}</p></div>`;
  }
  const links = directionsUrls({ lat: loc.lat, lon: loc.lon, address: loc.address, place: loc.place });
  const time = (t) => (toMin(t) === null ? '' : formatMinutes(toMin(t), locale));
  let when = '';
  if (loc.source === 'route' && !loc.now && loc.from) when = `${time(loc.from)}–${time(loc.until)}`;
  else if (loc.until) when = String(d.untilText || 'Until {time}').replace('{time}', time(loc.until));
  const map = d.showMap && links
    ? `<div class="ol-loc-map ol-frame" style="height:${Number(d.mapHeight) || 200}px"><iframe src="${esc(links.embed)}" title="${esc(loc.place || loc.address || 'Map')}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>` : '';
  const buttons = d.directions && links
    ? `<div class="ol-loc-actions"><a class="ol-loc-btn" href="${esc(links.google)}" target="_blank" rel="noopener noreferrer" data-ol-track="${esc(ctx.blockId)}">${icon('navigate', 15)}Google Maps</a>`
      + `<a class="ol-loc-btn" href="${esc(links.waze)}" target="_blank" rel="noopener noreferrer" data-ol-track="${esc(ctx.blockId)}">${icon('navigate', 15)}Waze</a></div>` : '';
  return `<div class="ol-loc">${head}`
    + `<p class="ol-loc-place">${esc(loc.place || loc.address || '')}</p>`
    + (loc.place && loc.address ? `<p class="ol-loc-addr">${esc(loc.address)}</p>` : '')
    + (when || loc.note ? `<p class="ol-loc-meta">${[when, loc.note].filter(Boolean).map(esc).join(' · ')}</p>` : '')
    + `${map}${buttons}</div>`;
}

export default {
  type: 'location',
  label: 'Where we are today',
  description: 'Your location today with a map and directions. Update it from the “Today” tab.',
  icon: 'map',
  category: 'Business',
  cssClasses: [
    { selector: '.ol-loc', description: 'Location card (.is-empty without a location)' },
    { selector: '.ol-loc-place', description: 'Place name' },
    { selector: '.ol-loc-meta', description: 'Hours and note' },
    { selector: '.ol-loc-map', description: 'Map' },
    { selector: '.ol-loc-btn', description: 'Google Maps / Waze buttons' },
  ],
  fields: [
    { key: 'title', type: 'text', label: 'Title (optional)', default: 'Where we are today', max: 60 },
    { key: 'useRoute', type: 'toggle', label: 'Use your Route block', default: true,
      help: 'When you haven’t set today’s location in the “Today” tab, show the stop of your Route block for now (or the next one today).' },
    { key: 'expires', type: 'toggle', label: 'The “Today” location ends at midnight', default: true,
      help: 'So yesterday’s spot is never shown by mistake.' },
    { key: 'timezone', type: 'select', label: 'Your time zone', default: localTimeZone(), options: timeZoneOptions },
    { key: 'showMap', type: 'toggle', label: 'Show a map', default: true },
    { key: 'mapHeight', type: 'range', label: 'Map height', min: 140, max: 400, step: 10, default: 200, unit: 'px', showIf: { key: 'showMap', truthy: true } },
    { key: 'directions', type: 'toggle', label: 'Directions buttons (Google Maps, Waze)', default: true },
    { key: 'untilText', type: 'text', label: '“Until” text', default: 'Until {time}', max: 40, help: '{time} = the time set in “Today”.' },
    { key: 'emptyText', type: 'text', label: 'Text without a location', default: 'We’ll post today’s location soon.', max: 120 },
  ],
  summary: (d) => (d.useRoute ? 'Today tab, then your route' : 'From the Today tab'),
  render(d, ctx) {
    return html(d, ctx, ctx.now ?? Date.now());
  },
  hydrate(el, d, ctx) {
    // The route stop changes during the day; the map is only redrawn when the place changes.
    const tick = () => {
      if (!el.isConnected) { clearInterval(timer); return; }
      const box = el.querySelector('.ol-loc');
      const next = html(d, { page: ctx.page, blockId: ctx.blockId, mode: ctx.mode }, Date.now());
      if (box && box.outerHTML !== next) box.outerHTML = next;
    };
    const timer = setInterval(tick, 60_000);
  },
  css: `.ol-root .ol-loc{background:var(--ol-surface);color:var(--ol-surface-fg);border-radius:var(--ol-surface-radius);padding:16px;text-align:left}
.ol-root .ol-loc-title{display:flex;align-items:center;gap:6px;margin:0 0 6px;font-size:.78em;font-weight:800;text-transform:uppercase;letter-spacing:.06em;opacity:.7}
.ol-root .ol-loc-place{margin:0;font-family:var(--ol-title-font);font-weight:800;font-size:1.25em;line-height:1.2;overflow-wrap:anywhere}
.ol-root .ol-loc-addr{margin:4px 0 0;font-size:.88em;opacity:.8;overflow-wrap:anywhere}
.ol-root .ol-loc-meta{margin:6px 0 0;font-size:.85em;font-weight:600}
.ol-root .ol-loc-empty{margin:0;opacity:.8}
.ol-root .ol-loc-map{margin-top:12px;border-radius:calc(var(--ol-surface-radius)*.7);overflow:hidden}
.ol-root .ol-loc-map iframe{width:100%;height:100%;border:0;display:block}
.ol-root .ol-loc-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.ol-root .ol-loc-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:40px;border-radius:999px;font-weight:700;font-size:.88em;text-decoration:none;background:var(--ol-surface-fg);color:var(--ol-surface)!important}`,
};
