// Booking block: visitors pick a service, a day and a free time and book an
// appointment. Free times come from the API (/api/public/booking/slots) so
// they always reflect other bookings. The owner manages bookings in the
// dashboard (Agenda) and gets push notifications + reminders.
import { esc } from '../util/html.js';
import { icon } from '../icons.js';
import {
  WEEKDAYS, REMINDER_PRESETS, localTimeZone, timeZoneOptions, bookableDays, pickService, icsCalendar,
} from '../booking.js';

const DURATIONS = ['15', '20', '30', '45', '60', '90', '120', '180', '240'];

export default {
  type: 'booking',
  label: 'Booking',
  description: 'Let visitors book appointments in your free time slots.',
  icon: 'calendar',
  category: 'Contact',
  cssClasses: [
    { selector: '.ol-booking', description: 'Wrapper (details element, [open] when expanded)' },
    { selector: '.ol-booking > .ol-btn', description: 'The “Book” button' },
    { selector: '.ol-book', description: 'Card with the booking steps' },
    { selector: '.ol-book-step', description: 'Step title (Service, Day, Time, Your details)' },
    { selector: '.ol-book-services', description: 'List of services' },
    { selector: '.ol-book-days', description: 'Scrollable row of days' },
    { selector: '.ol-book-day', description: 'One day ([aria-pressed=true] when selected)' },
    { selector: '.ol-book-slots', description: 'Grid of free times' },
    { selector: '.ol-book-slot', description: 'One time button' },
    { selector: '.ol-book-form', description: 'Visitor details form' },
    { selector: '.ol-book-submit', description: 'Confirm button' },
    { selector: '.ol-book-done', description: 'Success message' },
  ],
  fields: [
    { key: 'buttonLabel', type: 'text', label: 'Button text', default: 'Book an appointment' },
    { key: 'description', type: 'text', label: 'Description (optional)', placeholder: 'Pick a time that works for you' },
    { key: 'services', type: 'list', label: 'Services', itemLabel: 'service', max: 20, fields: [
      { key: 'name', type: 'text', label: 'Name', required: true, max: 80 },
      { key: 'duration', type: 'select', label: 'Duration (minutes)', default: '30', options: DURATIONS },
      { key: 'price', type: 'text', label: 'Price (optional)', max: 30, placeholder: '$40' },
    ], default: [{ id: 's1', name: 'Consultation', duration: '30', price: '' }] },
    { key: 'hours', type: 'list', label: 'Available hours', itemLabel: 'time range', max: 40,
      help: 'Add several ranges for the same day for breaks (e.g. 9:00–13:00 and 14:00–18:00).', fields: [
        { key: 'day', type: 'select', label: 'Day', default: 'mon', options: WEEKDAYS },
        { key: 'from', type: 'time', label: 'From', default: '09:00' },
        { key: 'to', type: 'time', label: 'To', default: '17:00' },
      ], default: ['mon', 'tue', 'wed', 'thu', 'fri'].map((day, i) => ({ id: `h${i}`, day, from: '09:00', to: '17:00' })) },
    { key: 'timezone', type: 'select', label: 'Your time zone', default: localTimeZone(), options: timeZoneOptions, help: 'Visitors see the times in their own time zone.' },
    { key: 'slotStep', type: 'select', label: 'Start times every', default: 'service', options: [
      { value: 'service', label: 'Length of the service' }, { value: '15', label: '15 minutes' }, { value: '30', label: '30 minutes' }, { value: '60', label: '1 hour' },
    ] },
    { key: 'buffer', type: 'select', label: 'Break between appointments', default: '0', options: [
      { value: '0', label: 'None' }, { value: '5', label: '5 min' }, { value: '10', label: '10 min' }, { value: '15', label: '15 min' }, { value: '30', label: '30 min' },
    ] },
    { key: 'minNotice', type: 'select', label: 'Minimum notice', default: '2', options: [
      { value: '0', label: 'None' }, { value: '1', label: '1 hour' }, { value: '2', label: '2 hours' }, { value: '4', label: '4 hours' },
      { value: '12', label: '12 hours' }, { value: '24', label: '1 day' }, { value: '48', label: '2 days' },
    ] },
    { key: 'maxDays', type: 'range', label: 'Book up to (days ahead)', min: 1, max: 120, default: 30 },
    { key: 'confirmMode', type: 'select', label: 'New bookings', default: 'auto', options: [
      { value: 'auto', label: 'Confirm automatically' }, { value: 'manual', label: 'I confirm each one' },
    ] },
    { key: 'reminders', type: 'select', label: 'Reminders', default: '1d1h',
      options: Object.entries(REMINDER_PRESETS).map(([value, p]) => ({ value, label: p.label })),
      help: 'Push notifications to you. Visitors also get them by email when email is set up on the server.' },
    { key: 'askPhone', type: 'toggle', label: 'Ask for phone number', default: true },
    { key: 'askNote', type: 'toggle', label: 'Ask for a note', default: true },
    { key: 'startOpen', type: 'toggle', label: 'Show the calendar open', default: false },
    { key: 'successMessage', type: 'text', label: 'Message after booking', default: 'Thanks! Your appointment is booked.' },
  ],
  summary: (d) => `${d.services.length} service${d.services.length === 1 ? '' : 's'} · ${d.timezone}`,
  render(d, ctx) {
    const label = esc(d.buttonLabel || 'Book an appointment');
    if (ctx.mode === 'export') {
      // Exported sites have no server: link to the live page.
      return ctx.liveUrl
        ? `<a class="ol-btn has-media" href="${esc(ctx.liveUrl)}" target="_blank" rel="noopener"><span class="ol-btn-icon">${icon('calendar', 20)}</span>`
          + `<span class="ol-btn-label"><span class="ol-btn-title">${label}</span><span class="ol-btn-sub">Opens the online booking page</span></span><span class="ol-btn-spacer"></span></a>`
        : '';
    }
    return `<details class="ol-booking"${d.startOpen ? ' open' : ''}>`
      + `<summary class="ol-btn has-media" data-ol-track="${esc(ctx.blockId)}"><span class="ol-btn-icon">${icon('calendar', 20)}</span>`
      + `<span class="ol-btn-label"><span class="ol-btn-title">${label}</span>${d.description ? `<span class="ol-btn-sub">${esc(d.description)}</span>` : ''}</span>`
      + `<span class="ol-btn-icon ol-book-chevron">${icon('chevron', 18)}</span></summary>`
      + `<div class="ol-card ol-book" data-api="${esc(ctx.apiBase)}" data-page="${esc(ctx.page?.id || '')}" data-block="${esc(ctx.blockId)}" data-mode="${esc(ctx.mode)}">`
      + '<p class="ol-book-note">Loading…</p></div></details>';
  },
  hydrate(el, data) {
    const details = el.querySelector(':scope > .ol-booking');
    const box = details?.querySelector('.ol-book');
    if (!box) return;
    let started = false;
    const start = () => { if (!started) { started = true; bookingApp(el.ownerDocument, box, data); } };
    if (details.open) start();
    details.addEventListener('toggle', () => details.open && start());
  },
  css: `.ol-root .ol-booking>summary{list-style:none}
.ol-root .ol-booking>summary::-webkit-details-marker{display:none}
.ol-root .ol-book-chevron{transition:transform .2s}
.ol-root .ol-booking[open]>summary .ol-book-chevron{transform:rotate(180deg)}
.ol-root .ol-book{margin-top:8px;padding:16px;text-align:left;display:flex;flex-direction:column;gap:12px;animation:ol-book-in .2s ease}
@keyframes ol-book-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.ol-root .ol-book-step{margin:0;font-size:.8em;font-weight:700;opacity:.7}
.ol-root .ol-book-note{margin:0;font-size:.85em;opacity:.75}
.ol-root .ol-book-error{margin:0;font-size:.85em;color:#dc2626}
.ol-root .ol-book button{font:inherit;color:inherit;cursor:pointer}
.ol-root .ol-book-services{display:flex;flex-direction:column;gap:6px}
.ol-root .ol-book-service{display:flex;justify-content:space-between;gap:10px;align-items:center;text-align:left;padding:10px 12px;border-radius:12px;border:1.5px solid color-mix(in srgb,var(--ol-surface-fg) 15%,transparent);background:transparent}
.ol-root .ol-book-service small{opacity:.7}
.ol-root .ol-book-days{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
.ol-root .ol-book-days::-webkit-scrollbar{display:none}
.ol-root .ol-book-day{flex:0 0 58px;display:flex;flex-direction:column;align-items:center;gap:1px;padding:8px 0;border-radius:12px;border:1.5px solid color-mix(in srgb,var(--ol-surface-fg) 15%,transparent);background:transparent}
.ol-root .ol-book-day small{font-size:.7em;opacity:.7;text-transform:uppercase}
.ol-root .ol-book-day strong{font-size:1.15em}
.ol-root .ol-book-slots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.ol-root .ol-book-slot{padding:9px 0;border-radius:10px;border:1.5px solid color-mix(in srgb,var(--ol-surface-fg) 15%,transparent);background:transparent;font-weight:600;font-variant-numeric:tabular-nums}
.ol-root .ol-book [aria-pressed="true"]{background:var(--ol-surface-fg);color:var(--ol-surface);border-color:var(--ol-surface-fg)}
.ol-root .ol-book-form{display:flex;flex-direction:column;gap:8px}
.ol-root .ol-book-form input,.ol-root .ol-book-form textarea{font:inherit;color:var(--ol-surface-fg);background:transparent;border:1.5px solid color-mix(in srgb,var(--ol-surface-fg) 18%,transparent);border-radius:10px;padding:10px 12px;width:100%;box-sizing:border-box}
.ol-root .ol-book-form textarea{min-height:70px;resize:vertical}
.ol-root .ol-book-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.ol-root .ol-book-summary{margin:0;padding:10px 12px;border-radius:10px;background:color-mix(in srgb,var(--ol-surface-fg) 7%,transparent);font-size:.9em}
.ol-root .ol-book-submit,.ol-root .ol-book-cal{border:0;border-radius:999px;min-height:46px;font-weight:700;background:var(--ol-btn-bg);color:var(--ol-btn-fg)!important;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px}
.ol-root .ol-book-cal{background:color-mix(in srgb,var(--ol-surface-fg) 9%,transparent);color:var(--ol-surface-fg)!important}
.ol-root .ol-book-submit[disabled]{opacity:.5;cursor:default}
.ol-root .ol-book-back{align-self:center;border:0;background:transparent;padding:0;font-size:.85em;opacity:.75;text-decoration:underline}
.ol-root .ol-book-done{text-align:center;display:flex;flex-direction:column;gap:10px}
.ol-root .ol-book-done strong{font-size:1.1em}`,
};

// ── Browser app (vanilla DOM) ────────────────────────────────────────────
function bookingApp(doc, box, data) {
  const api = box.dataset.api || '';
  const pageId = box.dataset.page;
  const blockId = box.dataset.block;
  const preview = box.dataset.mode === 'preview';
  const visitorTz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return ''; } })();
  const services = data.services || [];
  const st = { service: services.length === 1 ? services[0].id : null, day: null, slot: null, slots: null, error: '', loading: false, done: null };

  const h = (tag, attrs = {}, ...kids) => {
    const n = doc.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'on') for (const [ev, fn] of Object.entries(v)) n.addEventListener(ev, fn);
      else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat()) if (k != null && k !== false && k !== '') n.append(k.nodeType ? k : doc.createTextNode(String(k)));
    return n;
  };
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtWhen = (iso) => new Date(iso).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' });
  const fmtDay = (day, opts) => new Date(`${day}T12:00:00Z`).toLocaleDateString([], { timeZone: 'UTC', ...opts });

  async function loadSlots() {
    st.loading = true; st.slots = null; st.slot = null; st.error = ''; draw();
    try {
      const q = new URLSearchParams({ pageId, blockId, serviceId: st.service, date: st.day });
      const res = await fetch(`${api}/api/public/booking/slots?${q}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error === 'not_found' && preview ? 'Save the page to see the available times here.' : 'Could not load the available times.');
      }
      st.slots = json.slots || [];
    } catch (err) { st.error = err.message; st.slots = []; }
    st.loading = false; draw();
  }

  async function submit(form) {
    st.error = ''; st.loading = true; draw();
    try {
      const body = { pageId, blockId, serviceId: st.service, start: st.slot, visitorTimezone: visitorTz, ...Object.fromEntries(new FormData(form)) };
      // text/plain keeps it a "simple" CORS request (no preflight).
      const res = await fetch(`${api}/api/public/booking`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409) { st.loading = false; await loadSlots(); st.error = 'That time was just taken. Please pick another one.'; return draw(); }
      if (!res.ok) throw new Error(json.error === 'too_many_requests' ? 'Too many attempts. Try again later.' : 'Could not book. Check your details and try again.');
      st.done = json.booking;
    } catch (err) { st.error = err.message; }
    st.loading = false; draw();
  }

  function draw() {
    box.textContent = '';
    if (st.done) { box.append(doneView()); return; }
    if (!services.length) { box.append(h('p', { class: 'ol-book-note' }, 'No services available yet.')); return; }

    if (services.length > 1) {
      box.append(h('p', { class: 'ol-book-step' }, 'Service'));
      box.append(h('div', { class: 'ol-book-services' }, services.map((s) => h('button', {
        type: 'button', class: 'ol-book-service', 'aria-pressed': String(st.service === s.id),
        on: { click: () => { st.service = s.id; st.slot = null; if (st.day) loadSlots(); else draw(); } },
      }, h('span', {}, s.name), h('small', {}, [`${s.duration} min`, s.price].filter(Boolean).join(' · '))))));
      if (!st.service) return;
    }

    const days = bookableDays(data);
    box.append(h('p', { class: 'ol-book-step' }, 'Day'));
    if (!days.length) { box.append(h('p', { class: 'ol-book-note' }, 'No available days right now.')); return; }
    box.append(h('div', { class: 'ol-book-days' }, days.map((day) => h('button', {
      type: 'button', class: 'ol-book-day', 'aria-pressed': String(st.day === day), 'aria-label': fmtDay(day, { dateStyle: 'full' }),
      on: { click: () => { st.day = day; loadSlots(); } },
    }, h('small', {}, fmtDay(day, { weekday: 'short' })), h('strong', {}, fmtDay(day, { day: 'numeric' })), h('small', {}, fmtDay(day, { month: 'short' }))))));
    if (!st.day) return;

    box.append(h('p', { class: 'ol-book-step' }, 'Time'));
    if (st.loading && !st.slots) { box.append(h('p', { class: 'ol-book-note' }, 'Loading available times…')); return; }
    if (st.error && !st.slot) box.append(h('p', { class: 'ol-book-error', role: 'alert' }, st.error));
    if (st.slots && !st.slots.length && !st.error) box.append(h('p', { class: 'ol-book-note' }, 'No free times this day. Try another one.'));
    if (st.slots?.length) {
      box.append(h('div', { class: 'ol-book-slots' }, st.slots.map((iso) => h('button', {
        type: 'button', class: 'ol-book-slot', 'aria-pressed': String(st.slot === iso),
        on: { click: () => { st.slot = iso; st.error = ''; draw(); } },
      }, fmtTime(iso)))));
      if (visitorTz) box.append(h('p', { class: 'ol-book-note' }, `Times shown in your time zone (${visitorTz.replace(/_/g, ' ')}).`));
    }
    if (!st.slot) return;

    const svc = pickService(data, st.service);
    box.append(h('p', { class: 'ol-book-step' }, 'Your details'));
    box.append(h('p', { class: 'ol-book-summary' }, `${svc.name} · ${fmtWhen(st.slot)}`));
    box.append(h('form', { class: 'ol-book-form', on: { submit: (e) => { e.preventDefault(); if (!preview) submit(e.target); } } },
      h('input', { name: 'name', required: true, maxlength: '80', placeholder: 'Your name', autocomplete: 'name', 'aria-label': 'Your name' }),
      h('input', { name: 'email', type: 'email', required: true, maxlength: '254', placeholder: 'Email', autocomplete: 'email', 'aria-label': 'Email' }),
      data.askPhone && h('input', { name: 'phone', type: 'tel', maxlength: '32', placeholder: 'Phone', autocomplete: 'tel', 'aria-label': 'Phone' }),
      data.askNote && h('textarea', { name: 'note', maxlength: '500', placeholder: 'Anything we should know? (optional)', 'aria-label': 'Note' }),
      h('input', { name: 'website', class: 'ol-book-hp', tabindex: '-1', autocomplete: 'off', 'aria-hidden': 'true' }),
      st.error && h('p', { class: 'ol-book-error', role: 'alert' }, st.error),
      h('button', { type: 'submit', class: 'ol-book-submit', disabled: st.loading || preview }, st.loading ? 'Booking…' : 'Confirm booking'),
      preview && h('p', { class: 'ol-book-note' }, 'Booking is disabled in the dashboard preview.'),
    ));
  }

  function doneView() {
    const b = st.done;
    const ics = icsCalendar([{ uid: `${b.id}@otrelink`, start: b.start, end: b.end, title: b.serviceName, alarms: [60] }], b.serviceName);
    return h('div', { class: 'ol-book-done' },
      h('strong', {}, b.status === 'pending' ? 'Request sent!' : (data.successMessage || 'Booked!')),
      h('p', { class: 'ol-book-note' }, `${b.serviceName} · ${fmtWhen(b.start)}`),
      b.status === 'pending' && h('p', { class: 'ol-book-note' }, 'You will receive a confirmation soon.'),
      h('a', { class: 'ol-book-cal', href: `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`, download: 'appointment.ics' }, 'Add to my calendar'),
      h('button', { type: 'button', class: 'ol-book-back', on: { click: () => { st.done = null; st.slot = null; st.day = null; draw(); } } }, 'Book another time'),
    );
  }

  draw();
}
