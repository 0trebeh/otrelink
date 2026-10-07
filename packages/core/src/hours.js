// Opening hours for food businesses: "open now?", today's route stop and
// time formatting in the business time zone. Shared by the Open / Closed,
// Route and Location blocks (browser) and the tests.
//
// Hours are { day: 'mon'…'sun', from: 'HH:MM', to: 'HH:MM' } in the block's
// time zone. A range that ends earlier than it starts runs past midnight
// (18:00–02:00 = until 2 AM the next day). Special dates use the same
// dateRules as the Booking block (closed / block hours / special hours).

import { isValidTimeZone, zonedDateStr, addDays, weekdayOf, rulesOn, WEEKDAYS } from './booking.js';

const toMin = (t) => { const m = String(t || '').match(/^(\d{1,2}):(\d{2})$/); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };
const tzOf = (tz) => (isValidTimeZone(tz) ? tz : 'UTC');

/** Minutes after midnight of an instant in `tz`. */
export function zonedMinutes(date, tz) {
  const p = {};
  for (const x of new Intl.DateTimeFormat('en-US', { timeZone: tzOf(tz), hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).formatToParts(date)) p[x.type] = x.value;
  return (Number(p.hour) % 24) * 60 + Number(p.minute);
}

/** Ranges [from, to] (minutes) of a list of { from, to }; overnight ranges are split: [from, 1440] + the tail for the next day. */
function split(list) {
  const own = [];
  const tail = [];
  for (const r of list || []) {
    const a = toMin(r.from);
    let b = toMin(r.to);
    if (a === null || b === null) continue;
    if (b === 0) b = 1440;
    if (b > a) own.push([a, b]);
    else if (b < a) { own.push([a, 1440]); tail.push([0, b]); }
  }
  return { own, tail };
}

/** Hours listed for a date: special hours, or the weekly hours of its weekday (null = closed all day). */
function listedFor(data, date) {
  const rules = rulesOn(data, date);
  if (rules.some((r) => r.kind === 'closed')) return null;
  const special = rules.filter((r) => r.kind === 'open');
  if (special.length) return special.flatMap((r) => r.ranges || []);
  const day = weekdayOf(date);
  return (data.hours || []).filter((h) => h.day === day || h.day === 'daily');
}

const merge = (ranges) => {
  const sorted = ranges.filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  const out = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]); else out.push([...r]);
  }
  return out;
};

const subtract = (ranges, cuts) => {
  let out = ranges;
  for (const [x, y] of cuts) {
    out = out.flatMap(([a, b]) => (y <= a || x >= b ? [[a, b]] : [[a, Math.min(b, x)], [Math.max(a, y), b]].filter(([p, q]) => q > p)));
  }
  return out;
};

/** Open ranges of a date in minutes after midnight (includes the overnight tail of the day before). */
export function dayRanges(data, date) {
  const today = listedFor(data, date);
  const before = listedFor(data, addDays(date, -1));
  const ranges = [...(today ? split(today).own : []), ...(before ? split(before).tail : [])];
  const blocked = rulesOn(data, date).filter((r) => r.kind === 'block').flatMap((r) => split(r.ranges).own);
  return merge(subtract(ranges, blocked));
}

/**
 * Is the business open at `now`?
 * → { open, closesAt: { date, min } | null, opensAt: { date, min } | null }
 *   closesAt follows ranges that continue past midnight.
 */
export function openStatus(data, now = new Date()) {
  const tz = tzOf(data.timezone);
  const date = zonedDateStr(now, tz);
  const min = zonedMinutes(now, tz);
  const ranges = dayRanges(data, date);
  const cur = ranges.find(([a, b]) => min >= a && min < b);
  if (cur) {
    let closes = { date, min: cur[1] };
    // Runs until midnight and the next day starts at 00:00 → it closes later.
    for (let i = 1; closes.min === 1440 && i < 3; i++) {
      const next = dayRanges(data, addDays(date, i)).find(([a]) => a === 0);
      closes = next ? { date: addDays(date, i), min: next[1] } : { date: addDays(date, i), min: 0 };
    }
    return { open: true, closesAt: closes, opensAt: null };
  }
  for (let i = 0; i <= 14; i++) {
    const d = addDays(date, i);
    const next = dayRanges(data, d).find(([a]) => i > 0 || a > min);
    if (next) return { open: false, closesAt: null, opensAt: { date: d, min: next[0] } };
  }
  return { open: false, closesAt: null, opensAt: null };
}

/** "9:00 PM" / "21:00" for minutes after midnight, in the page locale. */
export function formatMinutes(min, locale = 'en-US') {
  const m = ((min % 1440) + 1440) % 1440;
  return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(2020, 0, 1, Math.floor(m / 60), m % 60)));
}

/** Weekday name of a "YYYY-MM-DD" date in the page locale ("Friday" / "viernes"). */
export function formatWeekday(date, locale = 'en-US', style = 'long') {
  return new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
}

/** Locale for dates and times of a page (its "Page language"). */
export const pageLocale = (page) => (page?.settings?.language === 'es' ? 'es' : 'en-US');

/** Today's date ("YYYY-MM-DD") in a zone. */
export const todayIn = (tz, now = new Date()) => zonedDateStr(now, tzOf(tz));

/** Route stops of a date, in time order, with `now: true` on the stop happening at `min`. */
export function stopsOn(stops = [], date, min = -1) {
  const day = weekdayOf(date);
  return stops
    .filter((s) => s.place && (s.day === day || s.day === 'daily'))
    .map((s) => {
      const a = toMin(s.from);
      let b = toMin(s.to);
      if (b === 0) b = 1440;
      const now = a !== null && b !== null && (b > a ? min >= a && min < b : min >= a);
      return { ...s, now };
    })
    .sort((x, y) => (toMin(x.from) ?? 0) - (toMin(y.from) ?? 0));
}

/** The stop to show for "now": the current one, else the next one today. */
export function currentStop(stops = [], tz, now = new Date()) {
  const date = todayIn(tz, now);
  const min = zonedMinutes(now, tzOf(tz));
  const list = stopsOn(stops, date, min);
  const later = (s) => { const b = toMin(s.to); return b === null || b === 0 || b > min || b < toMin(s.from); };
  return list.find((s) => s.now) || list.find((s) => (toMin(s.from) ?? 0) > min) || list.find(later) || null;
}

/** Weekday options with "Every day" (for route stops). */
export const ROUTE_DAYS = [{ value: 'daily', label: 'Every day' }, ...WEEKDAYS];

/** Links to get directions to a place: Google Maps and Waze. */
export function directionsUrls({ lat, lon, address, place }) {
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lon);
  const q = [place, address].filter(Boolean).join(', ');
  if (!hasPoint && !q) return null;
  return {
    google: hasPoint ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}` : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`,
    waze: hasPoint ? `https://waze.com/ul?ll=${lat},${lon}&navigate=yes` : `https://waze.com/ul?q=${encodeURIComponent(q)}&navigate=yes`,
    embed: `https://maps.google.com/maps?q=${hasPoint ? `${lat},${lon}` : encodeURIComponent(q)}&z=16&output=embed`,
  };
}
