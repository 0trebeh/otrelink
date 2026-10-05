'use client';
import { useCallback, useEffect, useState } from 'react';
import {
  Bell, BellOff, CalendarDays, Check, Clock, Copy, Mail, MessageCircle, Phone, RefreshCw, X, Loader2,
} from 'lucide-react';
import { flattenBlocks, formatInZone } from '@otrelink/core';
import { api, errorMessage } from '@/lib/client';
import { Panel, Button, Input, cx } from '@/components/ui';

const VIEWS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'pending', label: 'Pending' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
];

const STATUS = {
  pending: { label: 'Pending', cls: 'bg-amber-100 text-amber-800' },
  confirmed: { label: 'Confirmed', cls: 'bg-teal/15 text-teal' },
  cancelled: { label: 'Cancelled', cls: 'bg-soft text-muted' },
};

const time = (iso, tz) => formatInZone(iso, tz, { hour: '2-digit', minute: '2-digit' });
const dayTitle = (iso, tz) => formatInZone(iso, tz, { weekday: 'long', month: 'long', day: 'numeric' });

export default function AgendaSection({ ed }) {
  const { page } = ed;
  const hasBookingBlock = flattenBlocks(page.blocks).some((b) => b.type === 'booking');
  const [view, setView] = useState('upcoming');
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await api(`/api/bookings?pageId=${page.id}&view=${view}`);
      setItems(r.bookings);
      setErr('');
    } catch (e) { setErr(errorMessage(e)); }
  }, [page.id, view]);

  useEffect(() => {
    setItems(null);
    load();
    const t = setInterval(load, 60_000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, [load]);

  const act = async (b, body) => {
    try {
      await api(`/api/bookings/${b.id}`, { method: 'PATCH', body });
      await load();
      ed.refreshPending?.();
    } catch (e) {
      window.alert(e.code === 'slot_taken' ? 'There is already a booking at that time.' : errorMessage(e));
    }
  };

  // Group by day (in the booking's time zone).
  const groups = [];
  for (const b of items || []) {
    const key = dayTitle(b.start, b.timezone);
    const g = groups[groups.length - 1];
    if (g?.key === key) g.items.push(b); else groups.push({ key, items: [b] });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight">Agenda</h2>
        <div className="inline-flex rounded-full bg-panel border border-line p-1" role="group" aria-label="Show">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" onClick={() => setView(v.id)} aria-pressed={view === v.id}
              className={cx('h-8 px-3.5 rounded-full text-[13px] font-semibold cursor-pointer', view === v.id ? 'bg-ink text-white' : 'text-muted hover:text-ink')}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {!hasBookingBlock && (
        <Panel>
          <p className="font-semibold">Start taking appointments</p>
          <p className="text-sm text-muted mt-1">Add a <b>Booking</b> block in <i>Links</i>, set your services and hours, and save. Appointments will show up here.</p>
        </Panel>
      )}

      {err && <Panel><p className="text-sm text-danger">{err}</p></Panel>}
      {!items && !err && <div className="h-40 rounded-3xl bg-panel/60 animate-pulse" />}
      {items && items.length === 0 && (
        <div className="rounded-3xl border border-dashed border-line p-10 text-center">
          <CalendarDays className="mx-auto text-muted" />
          <p className="font-semibold mt-2">{{ upcoming: 'No upcoming appointments', pending: 'Nothing waiting for confirmation', past: 'No past appointments yet', cancelled: 'No cancelled appointments' }[view]}</p>
        </div>
      )}

      {groups.map((g) => (
        <section key={g.key}>
          <h3 className="text-sm font-semibold text-muted mb-2 capitalize">{g.key}</h3>
          <ul className="space-y-2.5">
            {g.items.map((b) => <BookingCard key={b.id} b={b} view={view} onAction={act} />)}
          </ul>
        </section>
      ))}

      <div className="grid lg:grid-cols-2 gap-5">
        <NotificationsCard />
        <CalendarFeedCard />
      </div>
    </div>
  );
}

function BookingCard({ b, view, onAction }) {
  const [moving, setMoving] = useState(false);
  const [when, setWhen] = useState('');
  const s = STATUS[b.status] || STATUS.confirmed;
  const digits = b.phone.replace(/\D/g, '');
  const editable = view !== 'past' && b.status !== 'cancelled';

  return (
    <li className="rounded-3xl bg-panel border border-line/80 p-4 flex gap-4">
      <div className="w-16 shrink-0 text-center">
        <p className="font-display text-lg font-bold tabular-nums leading-tight">{time(b.start, b.timezone)}</p>
        <p className="text-xs text-muted tabular-nums">{time(b.end, b.timezone)}</p>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold truncate">{b.name}</p>
          <span className={cx('text-[11px] font-semibold px-2 py-0.5 rounded-full', s.cls)}>{b.status === 'cancelled' && b.cancelledBy === 'visitor' ? 'Cancelled by visitor' : s.label}</span>
        </div>
        <p className="text-sm text-muted">{b.serviceName} · {b.duration} min</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[13px]">
          <a href={`mailto:${b.email}`} className="inline-flex items-center gap-1.5 hover:underline"><Mail size={14} /> {b.email}</a>
          {b.phone && <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1.5 hover:underline"><Phone size={14} /> {b.phone}</a>}
          {digits.length > 6 && <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:underline"><MessageCircle size={14} /> WhatsApp</a>}
        </div>
        {b.note && <p className="text-sm mt-2 bg-soft rounded-xl px-3 py-2">{b.note}</p>}
        {b.visitorTimezone && b.visitorTimezone !== b.timezone && (
          <p className="text-xs text-muted mt-1.5">Their time: {formatInZone(b.start, b.visitorTimezone, { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })}</p>
        )}

        {editable && (
          <div className="flex flex-wrap gap-2 mt-3">
            {b.status === 'pending' && <Button size="sm" variant="primary" onClick={() => onAction(b, { status: 'confirmed' })}><Check size={15} /> Confirm</Button>}
            <Button size="sm" onClick={() => setMoving((v) => !v)}><Clock size={15} /> Reschedule</Button>
            <Button size="sm" variant="danger" onClick={() => window.confirm(`Cancel ${b.name}'s appointment?`) && onAction(b, { status: 'cancelled' })}><X size={15} /> Cancel</Button>
          </div>
        )}
        {moving && (
          <form className="flex flex-wrap items-center gap-2 mt-3" onSubmit={(e) => { e.preventDefault(); if (when) { onAction(b, { start: new Date(when).toISOString() }); setMoving(false); } }}>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-auto" required aria-label="New date and time" />
            <Button size="sm" variant="dark" type="submit">Move</Button>
            <span className="text-xs text-muted">In your device&apos;s time zone. Same duration.</span>
          </form>
        )}
      </div>
    </li>
  );
}

// ── Push notifications on this device ─────────────────────────────────────
const b64ToBytes = (b64) => {
  const s = (b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
};

export function NotificationsCard() {
  const [state, setState] = useState('loading'); // loading | unsupported | ios | no-key | no-sw | denied | off | on
  const [key, setKey] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const check = useCallback(async () => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      return setState(ios && !standalone ? 'ios' : 'unsupported');
    }
    const { publicKey } = await api('/api/push/key').catch(() => ({}));
    if (!publicKey) return setState('no-key');
    setKey(publicKey);
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return setState('no-sw');
    if (Notification.permission === 'denied') return setState('denied');
    const sub = await reg.pushManager.getSubscription();
    setState(sub ? 'on' : 'off');
  }, []);
  useEffect(() => { check(); }, [check]);

  const enable = async () => {
    setBusy(true); setMsg('');
    try {
      if ((await Notification.requestPermission()) !== 'granted') { setState('denied'); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key) });
      await api('/api/push/subscribe', { method: 'POST', body: { subscription: sub.toJSON() } });
      setState('on');
    } catch (e) { setMsg(e?.message || 'Could not enable notifications.'); } finally { setBusy(false); }
  };
  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) { await api('/api/push/unsubscribe', { method: 'POST', body: { endpoint: sub.endpoint } }); await sub.unsubscribe(); }
      setState('off');
    } finally { setBusy(false); }
  };
  const test = async () => {
    setMsg('');
    try { const r = await api('/api/push/test', { method: 'POST' }); setMsg(`Sent to ${r.sent} of ${r.devices} device${r.devices === 1 ? '' : 's'}.`); } catch (e) { setMsg(errorMessage(e)); }
  };

  const text = {
    loading: 'Checking…',
    unsupported: 'This browser does not support push notifications.',
    ios: 'On iPhone/iPad, first install the app: Share → “Add to Home Screen”, then open it from there.',
    'no-key': 'Push notifications are not set up on the server yet (VAPID keys).',
    'no-sw': 'Notifications work in the installed app / production build (npm run build && npm start).',
    denied: 'Notifications are blocked for this site. Allow them in your browser settings and reload.',
    off: 'Get an alert for every new booking, review or survey response, and reminders before each appointment.',
    on: 'This device gets alerts for new bookings and reminders.',
  }[state];

  return (
    <Panel title="Notifications on this device">
      <p className="text-sm text-muted">{text}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        {state === 'off' && <Button size="sm" variant="primary" onClick={enable} disabled={busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : <Bell size={15} />} Turn on</Button>}
        {state === 'on' && <>
          <Button size="sm" onClick={test}><Bell size={15} /> Send a test</Button>
          <Button size="sm" variant="ghost" onClick={disable} disabled={busy}><BellOff size={15} /> Turn off</Button>
        </>}
      </div>
      {msg && <p className="text-xs text-muted mt-2">{msg}</p>}
    </Panel>
  );
}

// ── Calendar feed (Google / Apple / Outlook) ──────────────────────────────
function CalendarFeedCard() {
  const [url, setUrl] = useState(undefined);
  const [copied, setCopied] = useState(false);
  useEffect(() => { api('/api/bookings/calendar').then((r) => setUrl(r.url)).catch(() => setUrl(null)); }, []);
  const create = async () => {
    if (url && !window.confirm('Create a new link? The current one will stop working.')) return;
    const r = await api('/api/bookings/calendar', { method: 'POST' });
    setUrl(r.url);
  };
  return (
    <Panel title="See bookings in your calendar">
      <p className="text-sm text-muted">Subscribe to this private link from Google Calendar (Other calendars → From URL), Apple Calendar or Outlook. Keep it secret.</p>
      {url && (
        <div className="flex gap-2 mt-3">
          <Input readOnly value={url} onFocus={(e) => e.target.select()} className="font-mono text-xs" />
          <Button size="sm" className="shrink-0 mt-1" onClick={async () => { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1400); }}>
            {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      )}
      {url !== undefined && (
        <Button size="sm" className="mt-3" onClick={create}><RefreshCw size={15} /> {url ? 'Reset link' : 'Create link'}</Button>
      )}
    </Panel>
  );
}
