'use client';
import { useMemo, useRef, useState } from 'react';
import { CalendarOff, Clock, Copy, Plus, Trash2, X } from 'lucide-react';
import { WEEKDAYS, DATE_RULE_KINDS, zonedDateStr, isValidTimeZone } from '@otrelink/core';
import { Button, IconButton, Input, Toggle, cx } from '../ui';

const rid = () => Math.random().toString(36).slice(2, 10);
const toMin = (t) => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + m; };
// "00:00" as an end time means midnight.
const badRange = (r) => r.from && r.to && (toMin(r.to) || 1440) <= toMin(r.from);
const SHORT = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

/** List of from–to time ranges. */
export function TimeRanges({ ranges, onChange, max = 8, addLabel = 'Add hours', idPrefix, overnight = false }) {
  const set = (i, patch) => onChange(ranges.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const add = () => {
    const last = ranges[ranges.length - 1];
    // Next range starts one hour after the last one ends.
    const start = last ? Math.min(toMin(last.to) + 60, 22 * 60) : 9 * 60;
    const fmt = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    onChange([...ranges, { from: fmt(start), to: fmt(Math.min(start + 4 * 60, 24 * 60)) }]);
  };
  return (
    <div className="grid gap-1.5">
      {ranges.map((r, i) => (
        <div key={i}>
          <div className="flex items-center gap-1.5">
            <Input type="time" aria-label="From" id={i === 0 ? idPrefix : undefined} value={r.from} onChange={(e) => set(i, { from: e.target.value })} className="h-9 w-auto min-w-0 flex-1 px-2" />
            <span className="text-muted text-sm" aria-hidden="true">–</span>
            <Input type="time" aria-label="To" value={r.to} onChange={(e) => set(i, { to: e.target.value })} className="h-9 w-auto min-w-0 flex-1 px-2" />
            <IconButton label="Remove these hours" onClick={() => onChange(ranges.filter((_, j) => j !== i))}><X size={15} /></IconButton>
          </div>
          {badRange(r) && (overnight
            ? <p className="text-xs text-muted mt-0.5">Ends after midnight, the next day.</p>
            : <p className="text-xs text-danger mt-0.5">The end time must be after the start time.</p>)}
        </div>
      ))}
      {ranges.length < max && (
        <button type="button" onClick={add} className="justify-self-start inline-flex items-center gap-1 text-xs font-semibold text-accent-ink hover:underline cursor-pointer py-1">
          <Plus size={13} /> {addLabel}
        </button>
      )}
    </div>
  );
}

/**
 * Weekly hours, edited day by day. Stored as a flat list of
 * { id, day, from, to } (several ranges per day = breaks).
 */
export function WeeklyHoursField({ id, value = [], onChange, field }) {
  const remembered = useRef({});
  const [copyFrom, setCopyFrom] = useState(null);
  const [copyTo, setCopyTo] = useState([]);
  const byDay = useMemo(() => Object.fromEntries(WEEKDAYS.map((d) => [d.value, value.filter((h) => h.day === d.value)])), [value]);
  const max = field.max ?? 60;

  const setDay = (day, ranges) => {
    const next = [];
    for (const d of WEEKDAYS) {
      const list = d.value === day ? ranges.map((r) => ({ id: r.id || rid(), day, from: r.from, to: r.to })) : byDay[d.value];
      next.push(...list);
    }
    onChange(next.slice(0, max));
  };
  const toggleDay = (day, on) => {
    if (on) setDay(day, remembered.current[day] || [{ from: '09:00', to: '17:00' }]);
    else { remembered.current[day] = byDay[day]; setDay(day, []); }
  };
  const applyCopy = () => {
    const src = byDay[copyFrom];
    const next = [];
    for (const d of WEEKDAYS) {
      const list = copyTo.includes(d.value) ? src.map((r) => ({ id: rid(), day: d.value, from: r.from, to: r.to })) : byDay[d.value];
      next.push(...list);
    }
    onChange(next.slice(0, max));
    setCopyFrom(null);
  };

  return (
    <div id={id} className="rounded-2xl border border-line divide-y divide-line/70">
      {WEEKDAYS.map((d) => {
        const ranges = byDay[d.value];
        const open = ranges.length > 0;
        return (
          <div key={d.value} className="p-2.5 sm:px-3">
            <div className="grid grid-cols-[3.25rem_minmax(0,1fr)_auto] items-start gap-2">
              <div className="flex items-center gap-2 h-9">
                <Toggle size="sm" checked={open} onChange={(on) => toggleDay(d.value, on)} label={`Open on ${d.label}`} />
              </div>
              <div className="min-w-0">
                <p className={cx('text-[13px] font-semibold leading-9 -mb-0.5', !open && 'text-muted')}>{d.label}{!open && <span className="font-normal"> · Closed</span>}</p>
                {open && <TimeRanges ranges={ranges} onChange={(r) => setDay(d.value, r)} addLabel="Add a range (break)" overnight={field.overnight} />}
              </div>
              {open && (
                <IconButton label={`Copy ${d.label} hours to other days`} onClick={() => { setCopyFrom(d.value); setCopyTo([]); }}><Copy size={15} /></IconButton>
              )}
            </div>
            {copyFrom === d.value && (
              <div className="mt-2 rounded-xl bg-soft p-2.5 grid gap-2" role="group" aria-label={`Copy ${d.label} hours to`}>
                <p className="text-xs font-semibold">Copy these hours to:</p>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.filter((x) => x.value !== d.value).map((x) => (
                    <button key={x.value} type="button" aria-pressed={copyTo.includes(x.value)}
                      onClick={() => setCopyTo((c) => (c.includes(x.value) ? c.filter((v) => v !== x.value) : [...c, x.value]))}
                      className={cx('h-7 px-2.5 rounded-full text-xs font-semibold border cursor-pointer', copyTo.includes(x.value) ? 'bg-ink text-white border-ink' : 'bg-panel border-line text-muted hover:text-ink')}>
                      {SHORT[x.value]}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="primary" disabled={!copyTo.length} onClick={applyCopy}>Copy</Button>
                  <Button size="sm" variant="ghost" onClick={() => setCopyTo(['mon', 'tue', 'wed', 'thu', 'fri'].filter((v) => v !== d.value))}>Weekdays</Button>
                  <Button size="sm" variant="ghost" onClick={() => setCopyTo(WEEKDAYS.map((x) => x.value).filter((v) => v !== d.value))}>All days</Button>
                  <Button size="sm" variant="ghost" onClick={() => setCopyFrom(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const fmtDate = (d, opts = { weekday: 'short', month: 'short', day: 'numeric' }) =>
  (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString([], { timeZone: 'UTC', ...opts }) : '');
const KIND_ICON = { closed: CalendarOff, block: Clock, open: Clock };

/** One line that says what a rule does, e.g. "Closed · Wed, Dec 24 – Fri, Dec 26". */
export function ruleSummary(r) {
  const when = r.to && r.to !== r.from ? `${fmtDate(r.from)} – ${fmtDate(r.to)}` : fmtDate(r.from, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const hours = (r.ranges || []).map((x) => `${x.from}–${x.to}`).join(', ');
  if (r.kind === 'closed') return `Closed · ${when}`;
  if (r.kind === 'block') return `Blocked ${hours || '(no hours yet)'} · ${when}`;
  return `Open only ${hours || '(no hours yet)'} · ${when}`;
}

/**
 * Special dates: closed days, blocked hours or special hours for one date or a range of dates.
 * Dates are calendar days in the block's time zone.
 */
export function DateRulesField({ id, value = [], onChange, field, values }) {
  const tz = isValidTimeZone(values?.timezone) ? values.timezone : undefined;
  const today = zonedDateStr(new Date(), tz || 'UTC');
  const [showPast, setShowPast] = useState(false);
  const max = field.max ?? 150;
  const set = (rid_, patch) => onChange(value.map((r) => (r.id === rid_ ? { ...r, ...patch } : r)));
  const add = (kind) => onChange([...value, {
    id: rid(), from: today, to: today, kind, note: '',
    ranges: kind === 'closed' ? [] : [kind === 'block' ? { from: '12:00', to: '13:00' } : { from: '10:00', to: '14:00' }],
  }]);
  const past = value.filter((r) => (r.to || r.from) < today);
  const current = value.filter((r) => (r.to || r.from) >= today);

  return (
    <div id={id} className="grid gap-2">
      {current.length === 0 && (
        <p className="text-xs text-muted rounded-2xl border border-dashed border-line px-3 py-3">No days off or special dates. Your weekly hours apply every week.</p>
      )}
      {current.map((r) => <RuleCard key={r.id} r={r} today={today} onChange={(p) => set(r.id, p)} onRemove={() => onChange(value.filter((x) => x.id !== r.id))} />)}

      {value.length < max && (
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" onClick={() => add('closed')}><CalendarOff size={14} /> Day off</Button>
          <Button size="sm" onClick={() => add('block')}><Clock size={14} /> Block hours</Button>
          <Button size="sm" onClick={() => add('open')}><Plus size={14} /> Special hours</Button>
        </div>
      )}

      {past.length > 0 && (
        <div className="text-xs text-muted flex flex-wrap items-center gap-x-3 gap-y-1">
          <button type="button" className="font-semibold hover:text-ink cursor-pointer" onClick={() => setShowPast((s) => !s)} aria-expanded={showPast}>
            {showPast ? 'Hide' : 'Show'} {past.length} past date{past.length === 1 ? '' : 's'}
          </button>
          <button type="button" className="font-semibold hover:text-danger cursor-pointer" onClick={() => onChange(current)}>Remove past dates</button>
        </div>
      )}
      {showPast && past.map((r) => (
        <div key={r.id} className="flex items-center gap-2 rounded-xl bg-soft/60 px-3 py-1.5 text-xs text-muted">
          <span className="flex-1 min-w-0 truncate">{ruleSummary(r)}{r.note ? ` · ${r.note}` : ''}</span>
          <IconButton label="Remove" className="size-7" onClick={() => onChange(value.filter((x) => x.id !== r.id))}><Trash2 size={13} /></IconButton>
        </div>
      ))}
    </div>
  );
}

function RuleCard({ r, today, onChange, onRemove }) {
  const several = r.to && r.to !== r.from;
  const Icon = KIND_ICON[r.kind] || CalendarOff;
  const setKind = (kind) => onChange({
    kind,
    ranges: kind === 'closed' ? [] : r.ranges?.length ? r.ranges : [kind === 'block' ? { from: '12:00', to: '13:00' } : { from: '10:00', to: '14:00' }],
  });
  return (
    <div className="rounded-2xl border border-line bg-soft/50 p-3 grid gap-2.5">
      <div className="flex items-center gap-2">
        <Icon size={15} className={r.kind === 'closed' ? 'text-danger' : 'text-muted'} aria-hidden="true" />
        <p className="flex-1 min-w-0 text-[13px] font-semibold truncate">{ruleSummary(r)}</p>
        <IconButton label="Remove" onClick={onRemove}><Trash2 size={15} /></IconButton>
      </div>

      <div className="inline-flex flex-wrap rounded-full bg-panel border border-line p-0.5 justify-self-start" role="group" aria-label="Type">
        {Object.entries(DATE_RULE_KINDS).map(([k, info]) => (
          <button key={k} type="button" title={info.help} aria-pressed={r.kind === k} onClick={() => setKind(k)}
            className={cx('h-7 px-3 rounded-full text-xs font-semibold cursor-pointer', r.kind === k ? 'bg-ink text-white' : 'text-muted hover:text-ink')}>
            {info.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted -mt-1">{DATE_RULE_KINDS[r.kind]?.help}.</p>

      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 min-w-0">
          <span className="text-xs font-semibold">{several ? 'From' : 'Date'}</span>
          <Input type="date" className="h-9 px-2" min={today} value={r.from}
            onChange={(e) => { const from = e.target.value; if (from) onChange({ from, to: !several || (r.to && r.to < from) ? from : r.to }); }} />
        </label>
        {several ? (
          <label className="grid gap-1 min-w-0">
            <span className="text-xs font-semibold">To</span>
            <Input type="date" className="h-9 px-2" min={r.from} value={r.to} onChange={(e) => e.target.value && onChange({ to: e.target.value < r.from ? r.from : e.target.value })} />
          </label>
        ) : <span />}
      </div>
      <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer justify-self-start">
        <Toggle size="sm" checked={several} label="Several days" onChange={(on) => onChange({ to: on ? addDay(r.from) : r.from })} />
        Several days
      </label>

      {r.kind !== 'closed' && (
        <div className="grid gap-1">
          <span className="text-xs font-semibold">{r.kind === 'block' ? 'Hours to block' : 'Open hours'}{several ? ' (every day in the range)' : ''}</span>
          <TimeRanges ranges={r.ranges || []} onChange={(ranges) => onChange({ ranges })} addLabel="Add more hours" />
          {!r.ranges?.length && <p className="text-xs text-amber-700">{r.kind === 'open' ? 'Without hours these days are closed.' : 'Add the hours to block.'}</p>}
        </div>
      )}

      <Input value={r.note || ''} maxLength={100} placeholder="Private note (e.g. Vacation) – only you see it" aria-label="Private note" className="h-9"
        onChange={(e) => onChange({ note: e.target.value })} />
    </div>
  );
}

function addDay(d) {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10);
}
