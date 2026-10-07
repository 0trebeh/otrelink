// Events block: your agenda for visitors. Each event has a title, subtitle,
// description, a single day or a date range, all day or from–to hours, a
// place, an image and a link. Shown as banners, a carousel, a grid or a month
// calendar. Dates are written in the page language (Settings → Page language).
import { esc, safeUrl } from '../util/html.js';
import { icon } from '../icons.js';
import { localTimeZone, timeZoneOptions, zonedDateStr, isValidTimeZone } from '../booking.js';
import { pageLocale } from '../hours.js';

const toMin = (t) => { const m = String(t || '').match(/^(\d{1,2}):(\d{2})$/); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
const utc = (date) => new Date(`${date}T12:00:00Z`);
const today = (d, now) => zonedDateStr(new Date(now), isValidTimeZone(d.timezone) ? d.timezone : 'UTC');

/** Last day of an event ("YYYY-MM-DD"). */
export const eventEnd = (e) => (e.kind === 'range' && e.endDate && e.endDate >= e.date ? e.endDate : e.date);

/** Does an event happen on a date? */
export const eventOn = (e, date) => e.date && e.date <= date && date <= eventEnd(e);

/** Date options for each "Date format". */
const DATE_FORMATS = {
  long: { weekday: 'long', month: 'long', day: 'numeric' },
  medium: { weekday: 'short', month: 'short', day: 'numeric' },
  short: { month: 'short', day: 'numeric' },
  dayMonth: { day: 'numeric', month: 'long' },
  numeric: { day: '2-digit', month: '2-digit' },
};

/** "Friday, October 10" / "Oct 10 – 12, 2026" / "10/10/2026", in the page language. */
export function formatEventDate(e, d, { locale = 'en-US', now = Date.now() } = {}) {
  if (!e.date) return '';
  const end = eventEnd(e);
  const thisYear = String(new Date(now).getUTCFullYear());
  const showYear = d.showYear === 'always' || (d.showYear !== 'never' && (e.date.slice(0, 4) !== thisYear || end.slice(0, 4) !== thisYear));
  const opts = { ...(DATE_FORMATS[d.dateFormat] || DATE_FORMATS.long), ...(showYear ? { year: 'numeric' } : {}), timeZone: 'UTC' };
  const f = new Intl.DateTimeFormat(locale, opts);
  if (end === e.date) return f.format(utc(e.date));
  try { return f.formatRange(utc(e.date), utc(end)); } catch { return `${f.format(utc(e.date))} – ${f.format(utc(end))}`; }
}

/** "7:00 PM – 10:00 PM" / "19:00 – 22:00" / "" for all day. */
export function formatEventTime(e, d, locale = 'en-US') {
  if (e.allDay) return '';
  const a = toMin(e.from);
  const b = toMin(e.to);
  if (a === null) return '';
  const hc = d.timeFormat === '24h' ? { hourCycle: 'h23' } : d.timeFormat === '12h' ? { hourCycle: 'h12' } : {};
  const f = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC', ...hc });
  const t = (m) => f.format(new Date(Date.UTC(2020, 0, 1, Math.floor(m / 60) % 24, m % 60)));
  return b === null || b === a ? t(a) : `${t(a)} – ${t(b)}`;
}

/** Events to show, sorted by date (and start time), past ones removed or marked. */
export function visibleEvents(d, now = Date.now()) {
  const t = today(d, now);
  const list = (d.events || []).filter((e) => e.title && e.date)
    .map((e) => ({ ...e, past: eventEnd(e) < t, now: eventOn(e, t) }))
    .filter((e) => d.past !== 'hide' || !e.past)
    .sort((a, b) => a.date.localeCompare(b.date) || (toMin(a.from) ?? -1) - (toMin(b.from) ?? -1));
  // Past events (when shown) go after the upcoming ones, newest first.
  const ordered = d.past === 'end' ? [...list.filter((e) => !e.past), ...list.filter((e) => e.past).reverse()] : list;
  return Number(d.limit) ? ordered.slice(0, Number(d.limit)) : ordered;
}

// Date badge: day number + month (or "10–12 OCT" for a range).
function badge(e, locale) {
  const end = eventEnd(e);
  const day = (x) => String(Number(x.slice(8, 10)));
  const mon = (x) => new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }).format(utc(x)).replace('.', '');
  const sameMonth = end.slice(0, 7) === e.date.slice(0, 7);
  return `<span class="ol-ev-badge" aria-hidden="true"><b>${esc(end === e.date ? day(e.date) : sameMonth ? `${day(e.date)}–${day(end)}` : day(e.date))}</b>`
    + `<small>${esc(sameMonth ? mon(e.date) : `${mon(e.date)}–${mon(end)}`)}</small></span>`;
}

function card(e, d, ctx, opts) {
  const { locale, now } = opts;
  const date = formatEventDate(e, d, { locale, now });
  const time = formatEventTime(e, d, locale);
  const url = safeUrl(e.url);
  const img = e.image && d.layout !== 'calendar' ? `<span class="ol-ev-media"><img src="${esc(e.image)}" alt="" loading="lazy"></span>` : '';
  const meta = [
    `<span class="ol-ev-when">${icon('calendar', 14)}${esc(date)}${time ? ` · ${esc(time)}` : e.allDay && d.allDayLabel ? ` · ${esc(d.allDayLabel)}` : ''}</span>`,
    e.location ? `<span class="ol-ev-where">${icon('map', 14)}${esc(e.location)}</span>` : '',
  ].join('');
  return `<li class="ol-ev${e.past ? ' is-past' : ''}${e.now ? ' is-now' : ''}${img ? ' has-media' : ''}">${img}`
    + `<div class="ol-ev-body">${d.layout === 'banners' ? badge(e, locale) : ''}<div class="ol-ev-text">`
    + (e.now && d.todayLabel ? `<span class="ol-ev-tag">${esc(d.todayLabel)}</span>` : '')
    + `<p class="ol-ev-title">${esc(e.title)}</p>`
    + (e.subtitle ? `<p class="ol-ev-sub">${esc(e.subtitle)}</p>` : '')
    + `<p class="ol-ev-meta">${meta}</p>`
    + (e.description ? `<p class="ol-ev-desc">${esc(e.description)}</p>` : '')
    + (url ? `<a class="ol-ev-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer" data-ol-track="${esc(ctx.blockId)}">${esc(e.buttonLabel || 'More info')}${icon('arrowRight', 14)}</a>` : '')
    + '</div></div></li>';
}

/** Month calendar ("YYYY-MM") with the events of the selected day underneath. */
function monthHtml(d, ctx, opts, month, selected) {
  const { locale, now } = opts;
  const t = today(d, now);
  // A calendar always shows past days too (they are faded).
  const events = visibleEvents({ ...d, past: 'show', limit: 0 }, now);
  const [y, m] = month.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const startDow = (first.getUTCDay() + 6) % 7; // Monday first
  const title = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(first);
  const wd = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, 1 + i))));
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push('<span class="ol-cal-day is-empty"></span>');
  for (let n = 1; n <= days; n++) {
    const date = `${month}-${String(n).padStart(2, '0')}`;
    const count = events.filter((e) => eventOn(e, date)).length;
    cells.push(`<button type="button" class="ol-cal-day${count ? ' has-ev' : ''}${date === t ? ' is-today' : ''}${date === selected ? ' is-sel' : ''}${date < t ? ' is-past' : ''}" data-day="${date}" aria-pressed="${date === selected}"`
      + ` aria-label="${esc(new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeZone: 'UTC' }).format(utc(date)))}${count ? ` · ${count}` : ''}">${n}${count ? '<i aria-hidden="true"></i>' : ''}</button>`);
  }
  const dayEvents = events.filter((e) => eventOn(e, selected));
  const dayTitle = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(utc(selected));
  return `<div class="ol-cal-head"><button type="button" class="ol-cal-nav" data-month="-1" aria-label="Previous month">${icon('arrowLeft', 16)}</button>`
    + `<p class="ol-cal-title">${esc(title.charAt(0).toUpperCase() + title.slice(1))}</p>`
    + `<button type="button" class="ol-cal-nav" data-month="1" aria-label="Next month">${icon('arrowRight', 16)}</button></div>`
    + `<div class="ol-cal-grid">${wd.map((w) => `<span class="ol-cal-wd" aria-hidden="true">${esc(w)}</span>`).join('')}${cells.join('')}</div>`
    + `<p class="ol-cal-daytitle">${esc(dayTitle.charAt(0).toUpperCase() + dayTitle.slice(1))}</p>`
    + (dayEvents.length
      ? `<ul class="ol-ev-list">${dayEvents.map((e) => card(e, d, ctx, opts)).join('')}</ul>`
      : `<p class="ol-ev-empty">${esc(d.noEventsDay || 'No events this day.')}</p>`);
}

/** Month and day a calendar opens on: today, or the next event when this month has none left. */
function startOf(d, now) {
  const t = today(d, now);
  const next = visibleEvents({ ...d, past: 'hide', limit: 0 }, now)[0];
  if (next && next.date.slice(0, 7) !== t.slice(0, 7) && !next.now) return { month: next.date.slice(0, 7), day: next.date };
  return { month: t.slice(0, 7), day: next?.now ? t : next && next.date.slice(0, 7) === t.slice(0, 7) ? next.date : t };
}

const LAYOUTS = [
  { value: 'banners', label: 'Banners' }, { value: 'carousel', label: 'Carousel' },
  { value: 'grid', label: 'Grid' }, { value: 'calendar', label: 'Month calendar' },
];

export default {
  type: 'events',
  label: 'Events calendar',
  description: 'Your agenda: events with dates, hours, place and details, as banners, a carousel, a grid or a month calendar.',
  icon: 'calendar',
  category: 'Content',
  cssClasses: [
    { selector: '.ol-events', description: 'Wrapper (.is-banners, .is-carousel, .is-grid, .is-calendar)' },
    { selector: '.ol-ev', description: 'One event (.is-past, .is-now)' },
    { selector: '.ol-ev-badge', description: 'Day and month badge (banners)' },
    { selector: '.ol-ev-title / .ol-ev-sub / .ol-ev-desc', description: 'Title, subtitle and description' },
    { selector: '.ol-ev-meta', description: 'Date, hours and place' },
    { selector: '.ol-ev-link', description: 'Event link button' },
    { selector: '.ol-cal-grid', description: 'Month calendar days (.ol-cal-day.has-ev, .is-today, .is-sel)' },
  ],
  fields: [
    { key: 'title', type: 'text', label: 'Title (optional)', max: 80, placeholder: 'Upcoming events' },
    { key: 'layout', type: 'choice', label: 'Show as', default: 'banners', options: LAYOUTS },
    { key: 'events', type: 'list', label: 'Events', itemLabel: 'event', max: 100, fields: [
      { key: 'title', type: 'text', label: 'Title', required: true, max: 100 },
      { key: 'subtitle', type: 'text', label: 'Subtitle (optional)', max: 120 },
      { key: 'kind', type: 'choice', label: 'Dates', default: 'single', options: [
        { value: 'single', label: 'One day' }, { value: 'range', label: 'Several days (range)' },
      ] },
      { key: 'date', type: 'date', label: 'Date', required: true },
      { key: 'endDate', type: 'date', label: 'Until', showIf: { key: 'kind', equals: 'range' } },
      { key: 'allDay', type: 'toggle', label: 'All day', default: false },
      { key: 'from', type: 'time', label: 'From', default: '19:00', showIf: { key: 'allDay', equals: false } },
      { key: 'to', type: 'time', label: 'To', default: '22:00', showIf: { key: 'allDay', equals: false } },
      { key: 'location', type: 'text', label: 'Place (optional)', max: 120 },
      { key: 'description', type: 'textarea', label: 'Description (optional)', max: 1000 },
      { key: 'image', type: 'image', label: 'Image (optional)' },
      { key: 'url', type: 'url', label: 'Link (optional)', help: 'Tickets, sign-up, map…' },
      { key: 'buttonLabel', type: 'text', label: 'Link text', default: 'More info', max: 30, showIf: { key: 'url', truthy: true } },
    ], default: [
      { id: 'e1', title: 'Live music night', subtitle: 'Acoustic set', kind: 'single', date: '', endDate: '', allDay: false, from: '19:00', to: '22:00', location: 'Main stage', description: '', image: '', url: '', buttonLabel: 'More info' },
    ] },
    { key: 'dateFormat', type: 'select', label: 'Date format', default: 'long', options: [
      { value: 'long', label: 'Friday, October 10' }, { value: 'medium', label: 'Fri, Oct 10' }, { value: 'short', label: 'Oct 10' },
      { value: 'dayMonth', label: '10 October' }, { value: 'numeric', label: '10/10 (numbers)' },
    ], help: 'Written in your page language (Settings → Page language).' },
    { key: 'showYear', type: 'select', label: 'Year', default: 'auto', options: [
      { value: 'auto', label: 'Only when it’s not this year' }, { value: 'always', label: 'Always' }, { value: 'never', label: 'Never' },
    ] },
    { key: 'timeFormat', type: 'select', label: 'Hours', default: 'auto', options: [
      { value: 'auto', label: 'Like the page language' }, { value: '12h', label: '12 hours (7:00 PM)' }, { value: '24h', label: '24 hours (19:00)' },
    ] },
    { key: 'past', type: 'select', label: 'Past events', default: 'hide', options: [
      { value: 'hide', label: 'Hide them' }, { value: 'show', label: 'Show them (faded)' }, { value: 'end', label: 'Show them at the end' },
    ] },
    { key: 'limit', type: 'range', label: 'Show at most', min: 0, max: 50, default: 0, help: '0 = all.' },
    { key: 'timezone', type: 'select', label: 'Your time zone', default: localTimeZone(), options: timeZoneOptions, help: 'Decides when an event is “today” or past.' },
    { key: 'todayLabel', type: 'text', label: '“Today” label', default: 'Today', max: 20 },
    { key: 'allDayLabel', type: 'text', label: '“All day” text', default: 'All day', max: 20 },
    { key: 'emptyText', type: 'text', label: 'Text when there are no events', default: 'No upcoming events.', max: 120 },
  ],
  summary: (d) => {
    const n = (d.events || []).filter((e) => e.title).length;
    return `${LAYOUTS.find((l) => l.value === d.layout)?.label || 'Banners'} · ${n} event${n === 1 ? '' : 's'}`;
  },
  render(d, ctx) {
    const now = ctx.now ?? Date.now();
    const opts = { locale: pageLocale(ctx.page), now };
    const head = d.title ? `<p class="ol-ev-heading">${esc(d.title)}</p>` : '';
    if (d.layout === 'calendar') {
      const s = startOf(d, now);
      return `<div class="ol-events is-calendar" data-cal-month="${s.month}" data-cal-day="${s.day}">${head}<div class="ol-cal">${monthHtml(d, ctx, opts, s.month, s.day)}</div></div>`;
    }
    const list = visibleEvents(d, now);
    if (!list.length) {
      const hint = ctx.mode === 'preview' && !(d.events || []).some((e) => e.date) ? 'Add events with a date.' : d.emptyText;
      return `<div class="ol-events is-${esc(d.layout)}">${head}<p class="ol-ev-empty">${esc(hint)}</p></div>`;
    }
    const arrows = d.layout === 'carousel' && list.length > 1
      ? `<div class="ol-ev-arrows"><button type="button" class="ol-ev-arrow is-prev" aria-label="Previous">${icon('arrowLeft', 18)}</button><button type="button" class="ol-ev-arrow is-next" aria-label="Next">${icon('arrowRight', 18)}</button></div>` : '';
    return `<div class="ol-events is-${esc(d.layout)}">${head}<div class="ol-ev-wrap"><ul class="ol-ev-list">${list.map((e) => card(e, d, ctx, opts)).join('')}</ul>${arrows}</div></div>`;
  },
  hydrate(el, d, ctx) {
    const box = el.querySelector('.ol-events');
    if (!box) return;
    // Carousel arrows.
    const track = box.classList.contains('is-carousel') ? box.querySelector('.ol-ev-list') : null;
    if (track) box.querySelectorAll('.ol-ev-arrow').forEach((b) => b.addEventListener('click', () => {
      const step = (track.querySelector('.ol-ev')?.getBoundingClientRect().width || track.clientWidth) + 12;
      track.scrollBy({ left: b.classList.contains('is-next') ? step : -step, behavior: 'smooth' });
    }));
    // Month calendar: change month, pick a day.
    const cal = box.querySelector('.ol-cal');
    if (!cal) return;
    const opts = { locale: pageLocale(ctx.page), now: Date.now() };
    let month = box.dataset.calMonth;
    let day = box.dataset.calDay;
    const draw = () => { cal.innerHTML = monthHtml(d, { blockId: ctx.blockId, mode: ctx.mode, page: ctx.page }, opts, month, day); };
    cal.addEventListener('click', (e) => {
      const nav = e.target.closest('.ol-cal-nav');
      const pick = e.target.closest('.ol-cal-day[data-day]');
      if (nav) {
        const [y, m] = month.split('-').map(Number);
        const next = new Date(Date.UTC(y, m - 1 + Number(nav.dataset.month), 1));
        month = next.toISOString().slice(0, 7);
        // Select the first day with events in that month (or the 1st).
        const first = Array.from({ length: 31 }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)
          .find((x) => x.slice(0, 7) === month && (d.events || []).some((ev) => ev.title && eventOn(ev, x)));
        day = first || `${month}-01`;
        draw();
      } else if (pick) {
        day = pick.dataset.day;
        draw();
        cal.querySelector(`[data-day="${day}"]`)?.focus({ preventScroll: true });
      }
    });
  },
  css: `.ol-root .ol-events{text-align:left}
.ol-root .ol-ev-heading{margin:0 0 10px;font-family:var(--ol-title-font);font-weight:800;font-size:1.15em;color:var(--ol-title-color);text-align:center}
.ol-root .ol-ev-list{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.ol-root .ol-ev{background:var(--ol-surface);color:var(--ol-surface-fg);border-radius:var(--ol-surface-radius);overflow:hidden;display:flex;flex-direction:column;min-width:0}
.ol-root .ol-ev.is-past{opacity:.55}
.ol-root .ol-ev.is-now{box-shadow:inset 0 0 0 2px var(--ol-surface-fg)}
.ol-root .ol-ev-media{display:block;aspect-ratio:16/9;overflow:hidden;background:color-mix(in srgb,var(--ol-surface-fg) 7%,transparent)}
.ol-root .ol-ev-media img{width:100%;height:100%;object-fit:cover;display:block}
.ol-root .ol-ev-body{display:flex;gap:14px;padding:14px 16px;flex:1;min-width:0}
.ol-root .ol-ev-text{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.ol-root .ol-ev-badge{flex:none;width:58px;align-self:flex-start;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 4px;border-radius:calc(var(--ol-surface-radius)*.6);background:var(--ol-surface-fg);color:var(--ol-surface);line-height:1.05;text-align:center}
.ol-root .ol-ev-badge b{font-family:var(--ol-title-font);font-size:1.35em;font-weight:800;white-space:nowrap}
.ol-root .ol-ev-badge small{font-size:.68em;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-top:3px;white-space:nowrap}
.ol-root .ol-ev-tag{align-self:flex-start;font-size:.7em;font-weight:800;padding:2px 8px;border-radius:999px;background:#16a34a;color:#fff;margin-bottom:2px}
.ol-root .ol-ev-title{margin:0;font-weight:800;font-size:1.05em;line-height:1.25;overflow-wrap:anywhere}
.ol-root .ol-ev-sub{margin:0;font-size:.88em;opacity:.8;overflow-wrap:anywhere}
.ol-root .ol-ev-meta{margin:4px 0 0;display:flex;flex-direction:column;gap:3px;font-size:.8em;font-weight:600;opacity:.85}
.ol-root .ol-ev-meta span{display:flex;align-items:flex-start;gap:6px}
.ol-root .ol-ev-meta svg{flex:none;margin-top:1px}
.ol-root .ol-ev-desc{margin:6px 0 0;font-size:.85em;line-height:1.45;opacity:.85;white-space:pre-line;overflow-wrap:anywhere}
.ol-root .ol-ev-link{align-self:flex-start;margin-top:8px;display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;font-weight:700;font-size:.82em;text-decoration:none;background:var(--ol-surface-fg);color:var(--ol-surface)!important}
.ol-root .ol-ev-empty{margin:0;padding:16px;border-radius:var(--ol-surface-radius);background:var(--ol-surface);color:var(--ol-surface-fg);opacity:.8;text-align:center;font-size:.9em}
.ol-root .is-grid .ol-ev-list{grid-template-columns:repeat(2,minmax(0,1fr))}
.ol-root .is-grid .ol-ev-body,.ol-root .is-carousel .ol-ev-body{padding:12px 14px}
.ol-root .is-grid .ol-ev-desc,.ol-root .is-carousel .ol-ev-desc{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.ol-root .ol-events.is-grid{container-type:inline-size}
@container (max-width:340px){.ol-root .is-grid .ol-ev-list{grid-template-columns:minmax(0,1fr)}}
.ol-root .ol-ev-wrap{position:relative}
.ol-root .is-carousel .ol-ev-list{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:2px}
.ol-root .is-carousel .ol-ev-list::-webkit-scrollbar{display:none}
.ol-root .is-carousel .ol-ev{flex:0 0 80%;scroll-snap-align:start}
.ol-root .is-carousel .ol-ev:only-child{flex-basis:100%}
.ol-root .ol-ev-arrows{display:flex;justify-content:flex-end;gap:8px;margin-top:8px}
.ol-root .ol-ev-arrow{width:34px;height:34px;border-radius:50%;border:0;display:grid;place-items:center;cursor:pointer;background:var(--ol-surface);color:var(--ol-surface-fg)}
@media (hover:none){.ol-root .ol-ev-arrows{display:none}}
.ol-root .ol-cal{background:var(--ol-surface);color:var(--ol-surface-fg);border-radius:var(--ol-surface-radius);padding:14px}
.ol-root .ol-cal-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
.ol-root .ol-cal-title{margin:0;font-weight:800;font-family:var(--ol-title-font)}
.ol-root .ol-cal-nav{width:34px;height:34px;border:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;background:color-mix(in srgb,var(--ol-surface-fg) 8%,transparent);color:inherit}
.ol-root .ol-cal-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px;text-align:center}
.ol-root .ol-cal-wd{font-size:.7em;font-weight:700;opacity:.55;padding:4px 0}
.ol-root .ol-cal-day{position:relative;aspect-ratio:1;border:0;border-radius:10px;font:inherit;font-size:.88em;cursor:pointer;background:transparent;color:inherit;display:grid;place-items:center}
.ol-root .ol-cal-day.is-empty{cursor:default}
.ol-root .ol-cal-day.is-past{opacity:.45}
.ol-root .ol-cal-day.has-ev{font-weight:800}
.ol-root .ol-cal-day i{position:absolute;bottom:5px;left:50%;width:5px;height:5px;margin-left:-2.5px;border-radius:50%;background:currentColor}
.ol-root .ol-cal-day.is-today{box-shadow:inset 0 0 0 1.5px currentColor}
.ol-root .ol-cal-day:hover:not(.is-empty){background:color-mix(in srgb,var(--ol-surface-fg) 8%,transparent)}
.ol-root .ol-cal-day.is-sel{background:var(--ol-surface-fg);color:var(--ol-surface);opacity:1}
.ol-root .ol-cal-daytitle{margin:14px 0 8px;font-weight:700;font-size:.9em}
.ol-root .ol-cal .ol-ev{background:color-mix(in srgb,var(--ol-surface-fg) 6%,transparent)}
.ol-root .ol-cal .ol-ev-empty{background:none;padding:6px 0;text-align:left}`,
};
