// Open / Closed block: "Open now · Until 9:00 PM" or "Closed · Opens tomorrow
// at 11:00 AM", from weekly hours (or the stops of the Route block), with a
// manual override from the dashboard "Today" panel. Re-checked every minute.
import { esc } from '../util/html.js';
import { WEEKDAYS, localTimeZone, timeZoneOptions, addDays } from '../booking.js';
import { openStatus, formatMinutes, formatWeekday, pageLocale, todayIn } from '../hours.js';
import { flattenBlocks } from '../tree.js';

const fill = (s, vars) => String(s || '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));

/** Hours the block follows: its own, or the stops of the first Route block. */
export function statusHours(d, page) {
  if (d.source === 'route') {
    const route = flattenBlocks(page?.blocks || []).find((b) => b.type === 'route' && b.enabled !== false);
    if (!route) return null;
    return { timezone: route.data.timezone, hours: (route.data.stops || []).map((s) => ({ day: s.day, from: s.from, to: s.to })), dateRules: [] };
  }
  return { timezone: d.timezone, hours: d.hours, dateRules: d.dateRules };
}

/** { open, text, detail } for a block at `now` (the Today override wins). */
export function statusInfo(d, page, now = Date.now()) {
  const override = page?.today?.status;
  if (override === 'open') return { open: true, text: d.openText, detail: '' };
  if (override === 'closed') return { open: false, text: d.closedText, detail: '' };
  const hours = statusHours(d, page);
  if (!hours) return { open: false, text: d.closedText, detail: '' };
  const s = openStatus(hours, new Date(now));
  const locale = pageLocale(page);
  if (s.open) {
    return { open: true, text: d.openText, detail: s.closesAt && d.showNext ? fill(d.closesText, { time: formatMinutes(s.closesAt.min, locale) }) : '' };
  }
  if (!s.opensAt || !d.showNext) return { open: false, text: d.closedText, detail: '' };
  const today = todayIn(hours.timezone, new Date(now));
  const time = formatMinutes(s.opensAt.min, locale);
  const tpl = s.opensAt.date === today ? d.opensTodayText : s.opensAt.date === addDays(today, 1) ? d.opensTomorrowText : d.opensLaterText;
  return { open: false, text: d.closedText, detail: fill(tpl, { time, day: formatWeekday(s.opensAt.date, locale) }) };
}

const html = (d, page, now) => {
  const s = statusInfo(d, page, now);
  return `<div class="ol-status is-${s.open ? 'open' : 'closed'} ol-status-${d.style === 'card' ? 'card' : 'pill'}" role="status">`
    + '<span class="ol-status-dot" aria-hidden="true"></span>'
    + `<span class="ol-status-text">${esc(s.text)}</span>`
    + (s.detail ? `<span class="ol-status-detail">${esc(s.detail)}</span>` : '')
    + '</div>';
};

const custom = { key: 'customTexts', truthy: true };

export default {
  type: 'status',
  label: 'Open / Closed',
  description: 'Shows if you are open right now and when you close or open next.',
  icon: 'sign',
  category: 'Business',
  cssClasses: [
    { selector: '.ol-status', description: 'Status (.is-open or .is-closed, .ol-status-pill or .ol-status-card)' },
    { selector: '.ol-status-dot', description: 'Colored dot' },
    { selector: '.ol-status-text', description: '“Open now” / “Closed”' },
    { selector: '.ol-status-detail', description: 'When you close or open next' },
  ],
  fields: [
    { key: 'source', type: 'choice', label: 'Hours from', default: 'hours', options: [
      { value: 'hours', label: 'Opening hours' }, { value: 'route', label: 'Your Route block' },
    ], help: 'With “Your Route block”, you are open during the times of your route stops.' },
    { key: 'hours', type: 'weeklyHours', label: 'Opening hours', max: 60, overnight: true, showIf: { key: 'source', equals: 'hours' },
      help: 'An end time earlier than the start runs past midnight (18:00–02:00).', fields: [
        { key: 'day', type: 'select', label: 'Day', default: 'mon', options: WEEKDAYS },
        { key: 'from', type: 'time', label: 'From', default: '11:00' },
        { key: 'to', type: 'time', label: 'To', default: '21:00' },
      ], default: ['tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day, i) => ({ id: `h${i}`, day, from: '11:00', to: '21:00' })) },
    { key: 'dateRules', type: 'dateRules', label: 'Days off & special dates', max: 150, showIf: { key: 'source', equals: 'hours' },
      help: 'Holidays, vacations or special hours on a date.' },
    { key: 'timezone', type: 'select', label: 'Your time zone', default: localTimeZone(), options: timeZoneOptions, showIf: { key: 'source', equals: 'hours' } },
    { key: 'style', type: 'choice', label: 'Look', default: 'pill', options: [
      { value: 'pill', label: 'Small label' }, { value: 'card', label: 'Card' },
    ] },
    { key: 'showNext', type: 'toggle', label: 'Show when you close or open next', default: true },
    { key: 'customTexts', type: 'toggle', label: 'Edit the texts', default: false, help: 'Write them in your page language.' },
    { key: 'openText', type: 'text', label: 'Open', default: 'Open now', max: 40, showIf: custom },
    { key: 'closedText', type: 'text', label: 'Closed', default: 'Closed', max: 40, showIf: custom },
    { key: 'closesText', type: 'text', label: 'Closes', default: 'Until {time}', max: 60, showIf: custom, help: '{time} = closing time.' },
    { key: 'opensTodayText', type: 'text', label: 'Opens today', default: 'Opens today at {time}', max: 60, showIf: custom },
    { key: 'opensTomorrowText', type: 'text', label: 'Opens tomorrow', default: 'Opens tomorrow at {time}', max: 60, showIf: custom },
    { key: 'opensLaterText', type: 'text', label: 'Opens another day', default: 'Opens {day} at {time}', max: 60, showIf: custom, help: '{day} = weekday.' },
  ],
  summary: (d) => (d.source === 'route' ? 'Hours from your route' : `${new Set((d.hours || []).map((h) => h.day)).size} days a week`),
  render(d, ctx) {
    return html(d, ctx.page, ctx.now);
  },
  hydrate(el, d, ctx) {
    // Pages stay open for hours: re-check every minute.
    const tick = () => {
      if (!el.isConnected) { clearInterval(timer); return; }
      const next = html(d, ctx.page, Date.now());
      const box = el.querySelector('.ol-status');
      if (box && box.outerHTML !== next) box.outerHTML = next;
    };
    const timer = setInterval(tick, 60_000);
  },
  css: `.ol-root .ol-b-status{display:flex;justify-content:center}
.ol-root .ol-status{--ol-st:#16a34a;display:inline-flex;align-items:center;flex-wrap:wrap;justify-content:center;gap:4px 8px;line-height:1.3}
.ol-root .ol-status.is-closed{--ol-st:#dc2626}
.ol-root .ol-status-pill{padding:7px 14px;border-radius:999px;background:var(--ol-surface);color:var(--ol-surface-fg);font-size:.88em}
.ol-root .ol-status-card{width:100%;padding:14px 16px;border-radius:var(--ol-surface-radius);background:var(--ol-surface);color:var(--ol-surface-fg)}
.ol-root .ol-status-dot{width:9px;height:9px;border-radius:50%;background:var(--ol-st);box-shadow:0 0 0 3px color-mix(in srgb,var(--ol-st) 25%,transparent);flex:none}
.ol-root .ol-status.is-open .ol-status-dot{animation:ol-st-pulse 2s ease-in-out infinite}
.ol-root .ol-status-text{font-weight:800;color:var(--ol-st)}
.ol-root .ol-status-card .ol-status-text{font-size:1.1em}
.ol-root .ol-status-detail{opacity:.8;font-weight:500}
.ol-root .ol-status-detail::before{content:"·";margin-right:8px;opacity:.6}
@keyframes ol-st-pulse{50%{box-shadow:0 0 0 6px color-mix(in srgb,var(--ol-st) 0%,transparent)}}`,
};
