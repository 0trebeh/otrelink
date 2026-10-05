// Scheduling helpers shared by the Booking block (browser), the API (server)
// and the tests. Dates are stored in UTC; business hours are wall-clock times
// in the block's IANA time zone (e.g. "America/Caracas").

export const WEEKDAYS = [
  { value: 'mon', label: 'Monday' }, { value: 'tue', label: 'Tuesday' }, { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' }, { value: 'fri', label: 'Friday' }, { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' },
];
const JS_DAY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** Reminder presets (minutes before the appointment). */
export const REMINDER_PRESETS = {
  none: { label: 'No reminders', minutes: [] },
  '1h': { label: '1 hour before', minutes: [60] },
  '1d': { label: '1 day before', minutes: [1440] },
  '1d1h': { label: '1 day and 1 hour before', minutes: [1440, 60] },
  '1d1h15m': { label: '1 day, 1 hour and 15 min before', minutes: [1440, 60, 15] },
};

export const ACTIVE_STATUSES = ['pending', 'confirmed'];

export function isValidTimeZone(tz) {
  if (!tz) return false;
  try { new Intl.DateTimeFormat('en', { timeZone: tz }); return true; } catch { return false; }
}

export function localTimeZone() {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
}

export function timeZoneOptions() {
  const list = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
  const all = list.includes('UTC') ? list : ['UTC', ...list];
  // The current default must always be a valid option.
  const here = localTimeZone();
  if (!all.includes(here)) all.push(here);
  return all.map((z) => ({ value: z, label: z.replace(/_/g, ' ') }));
}

/** Offset (ms) of `tz` from UTC at a given instant. */
function tzOffsetMs(date, tz) {
  const parts = {};
  for (const p of new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(date)) parts[p.type] = p.value;
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Wall-clock date ("YYYY-MM-DD") + minutes after midnight in `tz` -> Date (UTC). DST safe. */
export function zonedToUtc(dateStr, minutes, tz) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, Math.floor(minutes / 60), minutes % 60);
  let t = guess - tzOffsetMs(new Date(guess), tz);
  const again = tzOffsetMs(new Date(t), tz);
  if (guess - again !== t) t = guess - again;
  return new Date(t);
}

/** "YYYY-MM-DD" of an instant as seen in `tz`. */
export function zonedDateStr(date, tz) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export const weekdayOf = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return JS_DAY[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
};

const toMin = (hhmm) => { const [h, m] = String(hhmm || '0:0').split(':').map(Number); return h * 60 + m; };
const tzOf = (data) => (isValidTimeZone(data.timezone) ? data.timezone : 'UTC');

/** The service chosen (by id) or the first one. */
/** Minutes an appointment takes. Services without a duration use the "Start times every" step (or 30 min). */
export function serviceMinutes(data, service) {
  return Math.max(5, Number(service?.duration) || Number(data?.slotStep) || 30);
}

export function pickService(data, serviceId) {
  return (data.services || []).find((s) => s.id === serviceId) || (data.services || [])[0] || null;
}

/** Days (in the block's zone) that can be booked: from today to maxDays ahead, with hours set. */
export function bookableDays(data, now = new Date()) {
  const tz = tzOf(data);
  const open = new Set((data.hours || []).map((h) => h.day));
  const today = zonedDateStr(now, tz);
  const out = [];
  for (let i = 0; i <= (Number(data.maxDays) || 30); i++) {
    const day = addDays(today, i);
    if (open.has(weekdayOf(day))) out.push(day);
  }
  return out;
}

/**
 * Free start times (ISO strings, UTC) for one service on one date.
 * @param {object} p
 * @param {object} p.data      Booking block data
 * @param {string} p.serviceId
 * @param {string} p.date      "YYYY-MM-DD" in the block's zone
 * @param {Array}  p.bookings  existing active bookings [{ start, end }]
 * @param {Date}   p.now
 */
export function computeSlots({ data, serviceId, date, bookings = [], now = new Date() }) {
  const tz = tzOf(data);
  const service = pickService(data, serviceId);
  if (!service || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return [];
  const duration = serviceMinutes(data, service);
  const step = data.slotStep === 'service' || !Number(data.slotStep) ? duration : Number(data.slotStep);
  const buffer = Number(data.buffer) || 0;
  const today = zonedDateStr(now, tz);
  if (date < today || date > addDays(today, Number(data.maxDays) || 30)) return [];
  const earliest = now.getTime() + (Number(data.minNotice) || 0) * 3600e3;
  const busy = bookings.map((b) => [new Date(b.start).getTime() - buffer * 60e3, new Date(b.end).getTime() + buffer * 60e3]);
  const day = weekdayOf(date);
  const slots = new Set();
  for (const range of (data.hours || []).filter((h) => h.day === day)) {
    const from = toMin(range.from);
    const to = toMin(range.to);
    for (let m = from; m + duration <= to; m += step) {
      const start = zonedToUtc(date, m, tz).getTime();
      const end = start + duration * 60e3;
      if (start < earliest) continue;
      if (busy.some(([a, b]) => start < b && end > a)) continue;
      slots.add(new Date(start).toISOString());
    }
  }
  return [...slots].sort();
}

/** Format an instant in a zone, e.g. "Fri, Oct 10, 10:00". */
export function formatInZone(date, tz, opts = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) {
  return new Intl.DateTimeFormat('en', { timeZone: isValidTimeZone(tz) ? tz : 'UTC', ...opts }).format(new Date(date));
}

// ── iCalendar (.ics) ────────────────────────────────────────────────────
const icsText = (v) => String(v || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`);
const icsDate = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function icsEvent({ uid, start, end, title, description = '', location = '', url = '', status = 'CONFIRMED', alarms = [] }) {
  return ['BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${icsDate(Date.now())}`, `DTSTART:${icsDate(start)}`, `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(title)}`, description && `DESCRIPTION:${icsText(description)}`, location && `LOCATION:${icsText(location)}`,
    url && `URL:${url}`, `STATUS:${status}`,
    ...alarms.flatMap((min) => ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(title)}`, `TRIGGER:-PT${min}M`, 'END:VALARM']),
    'END:VEVENT'].filter(Boolean).join('\r\n');
}

export function icsCalendar(events, name = 'Otrelink') {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Otrelink//Bookings//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsText(name)}`, ...events.map(icsEvent), 'END:VCALENDAR'].join('\r\n') + '\r\n';
}
