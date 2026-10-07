// Route block: where a food truck (or any mobile business) is each day of the
// week. Today's stops are highlighted and the current one is marked "Here now".
import { esc } from '../util/html.js';
import { icon } from '../icons.js';
import { localTimeZone, timeZoneOptions, WEEKDAYS, weekdayOf } from '../booking.js';
import { ROUTE_DAYS, stopsOn, todayIn, zonedMinutes, formatMinutes, formatWeekday, pageLocale, directionsUrls } from '../hours.js';

const ORDER = WEEKDAYS.map((w) => w.value);
const toMin = (t) => { const m = String(t || '').match(/^(\d{1,2}):(\d{2})$/); return m ? Number(m[1]) * 60 + Number(m[2]) : 0; };
// A date for each weekday, to print its name in the page language.
const SAMPLE = { mon: '2024-01-01', tue: '2024-01-02', wed: '2024-01-03', thu: '2024-01-04', fri: '2024-01-05', sat: '2024-01-06', sun: '2024-01-07' };

function html(d, ctx, now) {
  const locale = pageLocale(ctx.page);
  const today = todayIn(d.timezone, new Date(now));
  const todayDay = weekdayOf(today);
  const live = stopsOn(d.stops, today, zonedMinutes(new Date(now), d.timezone));
  const nowId = live.find((s) => s.now)?.id;
  const days = ORDER.map((day) => ({
    day,
    stops: (d.stops || []).filter((s) => s.place && (s.day === day || s.day === 'daily')).sort((a, b) => toMin(a.from) - toMin(b.from)),
  })).filter((g) => g.stops.length);
  // Start the week on today.
  const start = days.findIndex((g) => ORDER.indexOf(g.day) >= ORDER.indexOf(todayDay));
  const ordered = d.startToday && start > 0 ? [...days.slice(start), ...days.slice(0, start)] : days;
  const time = (s) => (s.from ? `${formatMinutes(toMin(s.from), locale)}${s.to ? `–${formatMinutes(toMin(s.to), locale)}` : ''}` : '');
  const stop = (s, isToday) => {
    const links = d.directions ? directionsUrls({ place: s.place, address: s.address }) : null;
    const here = isToday && s.id === nowId;
    return `<li class="ol-route-stop${here ? ' is-now' : ''}">`
      + `<div class="ol-route-info"><p class="ol-route-place">${esc(s.place)}${here ? ` <span class="ol-route-now">${esc(d.nowLabel || 'Here now')}</span>` : ''}</p>`
      + (s.address ? `<p class="ol-route-addr">${esc(s.address)}</p>` : '')
      + (s.note ? `<p class="ol-route-note">${esc(s.note)}</p>` : '')
      + '</div>'
      + `<div class="ol-route-side">${time(s) ? `<span class="ol-route-time">${esc(time(s))}</span>` : ''}`
      + (links ? `<a class="ol-route-go" href="${esc(links.google)}" target="_blank" rel="noopener noreferrer" data-ol-track="${esc(ctx.blockId)}" aria-label="Directions: ${esc(s.place)}">${icon('navigate', 15)}</a>` : '')
      + '</div></li>';
  };
  const list = ordered.map((g) => {
    const isToday = g.day === todayDay;
    const name = formatWeekday(SAMPLE[g.day], locale);
    return `<li class="ol-route-day${isToday ? ' is-today' : ''}"><p class="ol-route-dayname">${esc(name.charAt(0).toUpperCase() + name.slice(1))}${isToday ? ` <span class="ol-route-badge">${esc(d.todayLabel || 'Today')}</span>` : ''}</p>`
      + `<ul class="ol-route-stops">${g.stops.map((s) => stop(s, isToday)).join('')}</ul></li>`;
  }).join('');
  return `<div class="ol-route">${d.title ? `<p class="ol-route-title">${icon('route', 18)}${esc(d.title)}</p>` : ''}`
    + (list ? `<ul class="ol-route-days">${list}</ul>` : (ctx.mode === 'preview' ? '<p class="ol-route-addr">Add the stops of your route.</p>' : ''))
    + '</div>';
}

export default {
  type: 'route',
  label: 'Route',
  description: 'Where you are each day of the week. Today is highlighted.',
  icon: 'route',
  category: 'Business',
  cssClasses: [
    { selector: '.ol-route', description: 'Route card' },
    { selector: '.ol-route-day', description: 'One day (.is-today)' },
    { selector: '.ol-route-stop', description: 'One stop (.is-now while you are there)' },
    { selector: '.ol-route-place', description: 'Place name' },
    { selector: '.ol-route-time', description: 'Times of the stop' },
    { selector: '.ol-route-go', description: 'Directions button' },
  ],
  fields: [
    { key: 'title', type: 'text', label: 'Title (optional)', default: 'Weekly route', max: 60 },
    { key: 'stops', type: 'list', label: 'Stops', itemLabel: 'stop', max: 40, fields: [
      { key: 'day', type: 'select', label: 'Day', default: 'mon', options: ROUTE_DAYS },
      { key: 'place', type: 'text', label: 'Place', required: true, max: 80, placeholder: 'Central Park, north gate' },
      { key: 'address', type: 'text', label: 'Address (optional)', max: 200, help: 'Used for the directions button. Defaults to the place.' },
      { key: 'from', type: 'time', label: 'From', default: '11:00' },
      { key: 'to', type: 'time', label: 'To', default: '15:00', help: 'Earlier than “From” = after midnight.' },
      { key: 'note', type: 'text', label: 'Note (optional)', max: 100, placeholder: 'Next to the fountain' },
    ], default: [
      { id: 'r1', day: 'mon', place: 'Downtown square', address: '', from: '11:00', to: '15:00', note: '' },
      { id: 'r2', day: 'wed', place: 'University campus', address: '', from: '12:00', to: '16:00', note: '' },
      { id: 'r3', day: 'fri', place: 'Night market', address: '', from: '18:00', to: '23:00', note: '' },
    ] },
    { key: 'timezone', type: 'select', label: 'Your time zone', default: localTimeZone(), options: timeZoneOptions },
    { key: 'startToday', type: 'toggle', label: 'Start the list on today', default: false },
    { key: 'directions', type: 'toggle', label: 'Directions button on each stop', default: true },
    { key: 'todayLabel', type: 'text', label: '“Today” label', default: 'Today', max: 20 },
    { key: 'nowLabel', type: 'text', label: '“Here now” label', default: 'Here now', max: 20 },
  ],
  summary: (d) => `${d.stops.length} stop${d.stops.length === 1 ? '' : 's'}`,
  render(d, ctx) {
    return html(d, ctx, ctx.now ?? Date.now());
  },
  hydrate(el, d, ctx) {
    const tick = () => {
      if (!el.isConnected) { clearInterval(timer); return; }
      const box = el.querySelector('.ol-route');
      const next = html(d, { page: ctx.page, blockId: ctx.blockId, mode: ctx.mode }, Date.now());
      if (box && box.outerHTML !== next) box.outerHTML = next;
    };
    const timer = setInterval(tick, 60_000);
  },
  css: `.ol-root .ol-route{background:var(--ol-surface);color:var(--ol-surface-fg);border-radius:var(--ol-surface-radius);padding:16px;text-align:left}
.ol-root .ol-route-title{display:flex;align-items:center;gap:8px;margin:0 0 10px;font-family:var(--ol-title-font);font-weight:800;font-size:1.05em}
.ol-root .ol-route-days,.ol-root .ol-route-stops{list-style:none;margin:0;padding:0}
.ol-root .ol-route-day{padding:10px 0;border-top:1px solid color-mix(in srgb,var(--ol-surface-fg) 12%,transparent)}
.ol-root .ol-route-day:first-child{border-top:0;padding-top:2px}
.ol-root .ol-route-day.is-today{margin:4px -10px;padding:10px;border:0;border-radius:calc(var(--ol-surface-radius)*.7);background:color-mix(in srgb,var(--ol-surface-fg) 8%,transparent)}
.ol-root .ol-route-day.is-today+.ol-route-day{border-top:0}
.ol-root .ol-route-dayname{margin:0 0 4px;font-size:.78em;font-weight:800;text-transform:uppercase;letter-spacing:.06em;opacity:.65;display:flex;align-items:center;gap:6px}
.ol-root .is-today .ol-route-dayname{opacity:1}
.ol-root .ol-route-badge,.ol-root .ol-route-now{font-size:.85em;letter-spacing:0;text-transform:none;padding:2px 8px;border-radius:999px;background:var(--ol-surface-fg);color:var(--ol-surface);font-weight:700}
.ol-root .ol-route-now{background:#16a34a;color:#fff;font-size:.7em;vertical-align:middle}
.ol-root .ol-route-stop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:4px 0}
.ol-root .ol-route-info{min-width:0}
.ol-root .ol-route-place{margin:0;font-weight:700;overflow-wrap:anywhere}
.ol-root .ol-route-addr,.ol-root .ol-route-note{margin:2px 0 0;font-size:.82em;opacity:.75;overflow-wrap:anywhere}
.ol-root .ol-route-side{display:flex;align-items:center;gap:8px;flex:none}
.ol-root .ol-route-time{font-size:.82em;font-weight:600;opacity:.8;font-variant-numeric:tabular-nums;white-space:nowrap}
.ol-root .ol-route-go{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:var(--ol-surface-fg);color:var(--ol-surface)!important}`,
};
