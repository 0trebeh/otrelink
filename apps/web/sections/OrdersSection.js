'use client';
// Pickup orders from the Catalog block: new → preparing → ready → picked up.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock, Phone, MessageCircle, Volume2, VolumeX, RotateCcw, ShoppingBag, StickyNote, ReceiptText } from 'lucide-react';
import { allowsSection } from '@otrelink/core';
import { OPEN_INVOICE_KEY } from './InvoicesSection';
import { flattenBlocks, formatMoney } from '@otrelink/core';
import { api, errorMessage } from '@/lib/client';
import { Panel, Button, cx } from '@/components/ui';
import { NotificationsCard } from './AgendaSection';

const COLUMNS = [
  { id: 'new', label: 'New', next: { status: 'preparing', label: 'Prepare' }, cls: 'border-l-amber-400' },
  { id: 'preparing', label: 'Preparing', next: { status: 'ready', label: 'Mark ready' }, back: 'new', cls: 'border-l-sky-400' },
  { id: 'ready', label: 'Ready', next: { status: 'done', label: 'Picked up' }, back: 'preparing', cls: 'border-l-teal' },
];
const FINAL = { done: { label: 'Picked up', cls: 'bg-teal/15 text-teal' }, cancelled: { label: 'Cancelled', cls: 'bg-danger/10 text-danger' } };
const SOUND_KEY = 'ol-orders-sound';

const ago = (iso) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} h ${m % 60} min ago` : new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
};
const pickupText = (p) => (p === 'asap' ? 'As soon as possible' : `At ${new Date(`2020-01-01T${p}:00`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`);

/** Short "ding" for new orders (no audio file needed). */
function ding() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.18);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + i * 0.18 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.18 + 0.4);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.18);
      o.stop(ctx.currentTime + i * 0.18 + 0.45);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch { /* no audio */ }
}

export default function OrdersSection({ ed }) {
  const { page } = ed;
  const pickupBlocks = useMemo(() => flattenBlocks(page.blocks).filter((b) => b.type === 'catalog' && b.data?.ordering === 'pickup'), [page.blocks]);
  const [scope, setScope] = useState('active');
  const [orders, setOrders] = useState(null);
  const [err, setErr] = useState('');
  const [sound, setSound] = useState(false);
  const [, tick] = useState(0);
  const seen = useRef(null);

  useEffect(() => { try { setSound(localStorage.getItem(SOUND_KEY) === '1'); } catch { /* private mode */ } }, []);
  const toggleSound = () => {
    const v = !sound;
    setSound(v);
    try { localStorage.setItem(SOUND_KEY, v ? '1' : '0'); } catch { /* private mode */ }
    if (v) ding();
  };

  const load = useCallback(async () => {
    try {
      const r = await api(`/api/orders?pageId=${page.id}&scope=${scope}`);
      setOrders(r.orders);
      setErr('');
      if (scope === 'active') {
        const ids = new Set(r.orders.filter((o) => o.status === 'new').map((o) => o.id));
        if (seen.current && [...ids].some((id) => !seen.current.has(id)) && sound) ding();
        seen.current = ids;
        ed.setPendingOrders?.(ids.size);
      }
    } catch (e) { setErr(errorMessage(e)); }
  }, [page.id, scope, sound]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setOrders(null);
    load();
    const t = setInterval(() => { load(); tick((n) => n + 1); }, 15_000);
    return () => clearInterval(t);
  }, [load]);

  // "Invoice" on an order: a draft invoice with its items, opened in Invoices.
  const canInvoice = allowsSection(ed.plan, 'invoices');
  const toInvoice = async (o) => {
    try {
      const r = await api('/api/invoices', { method: 'POST', body: { pageId: page.id, fromOrder: o.id } });
      try { sessionStorage.setItem(OPEN_INVOICE_KEY, r.invoice.id); } catch { /* private mode */ }
      window.location.hash = 'invoices';
    } catch (e) { setErr(errorMessage(e)); }
  };

  const move = async (o, status) => {
    if (status === 'cancelled' && !window.confirm(`Cancel order #${o.code}? The customer sees it as cancelled.`)) return;
    setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, status } : x)));
    try {
      await api(`/api/orders/${o.id}`, { method: 'PATCH', body: { status } });
      load();
      ed.refreshPending?.();
    } catch (e) { setErr(errorMessage(e)); load(); }
  };

  if (!pickupBlocks.length && orders && !orders.length) {
    return (
      <div className="space-y-5">
        <Header />
        <div className="rounded-3xl border border-dashed border-line p-10 text-center">
          <ShoppingBag className="mx-auto text-muted" />
          <p className="font-display text-lg font-bold mt-3">Take pickup orders</p>
          <p className="text-sm text-muted mt-1 max-w-md mx-auto">Add a Catalog block (or open yours) and set <b>How visitors order</b> to <b>Pickup orders</b>. Orders arrive here, with a notification on your phone.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Header>
        <Button size="sm" onClick={toggleSound} aria-pressed={sound} title="Play a sound when a new order arrives (keep this tab open)">
          {sound ? <Volume2 size={15} /> : <VolumeX size={15} />} Sound {sound ? 'on' : 'off'}
        </Button>
      </Header>
      <div className="inline-flex p-1 rounded-full bg-soft" role="tablist">
        {[['active', 'In progress'], ['done', 'Completed']].map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={scope === id} onClick={() => setScope(id)}
            className={cx('h-8 px-4 rounded-full text-sm font-semibold cursor-pointer', scope === id ? 'bg-panel shadow-sm' : 'text-muted')}>{label}</button>
        ))}
      </div>
      {err && <p className="text-sm text-danger" role="alert">{err}</p>}
      {!orders ? <p className="text-sm text-muted">Loading…</p>
        : scope === 'active' ? (
          <div className="grid md:grid-cols-3 gap-4 items-start">
            {COLUMNS.map((c) => {
              const list = orders.filter((o) => o.status === c.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
              return (
                <section key={c.id} aria-label={c.label}>
                  <h2 className="flex items-center gap-2 text-sm font-bold mb-2">{c.label}<span className="min-w-5 h-5 px-1.5 rounded-full bg-soft text-xs grid place-items-center">{list.length}</span></h2>
                  <div className="space-y-3">
                    {list.map((o) => <OrderCard key={o.id} o={o} col={c} onMove={move} onInvoice={canInvoice ? toInvoice : null} />)}
                    {!list.length && <p className="text-xs text-muted rounded-2xl border border-dashed border-line p-4 text-center">No orders</p>}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => <OrderCard key={o.id} o={o} onMove={move} onInvoice={canInvoice ? toInvoice : null} />)}
            {!orders.length && <p className="text-sm text-muted">No completed orders yet.</p>}
          </div>
        )}
      <NotificationsCard />
    </div>
  );
}

function Header({ children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Orders</h1>
        <p className="text-sm text-muted mt-1">Pickup orders from your catalog. The customer sees each change on your page.</p>
      </div>
      {children}
    </div>
  );
}

function OrderCard({ o, col, onMove, onInvoice }) {
  const money = (n) => formatMoney(n, o.money || {});
  const wa = o.phone.replace(/\D/g, '');
  const final = FINAL[o.status];
  return (
    <article className={cx('rounded-2xl bg-panel border border-line/80 p-4 border-l-4', col?.cls || 'border-l-line')}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-2xl font-extrabold leading-none">#{o.code}</p>
          <p className="text-xs text-muted mt-1">{ago(o.createdAt)}</p>
        </div>
        {final
          ? <span className={cx('text-xs font-semibold px-2 py-1 rounded-full', final.cls)}>{final.label}</span>
          : <span className={cx('inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full text-right', o.pickup === 'asap' ? 'bg-amber-100 text-amber-800' : 'bg-soft')}><Clock size={12} />{pickupText(o.pickup)}</span>}
      </div>
      <p className="font-semibold mt-3">{o.name}</p>
      {o.phone && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          <a href={`tel:${o.phone}`} className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-soft text-xs font-medium hover:bg-line/60"><Phone size={12} />{o.phone}</a>
          {wa.length > 6 && <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`#${o.code}`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-soft text-xs font-medium hover:bg-line/60"><MessageCircle size={12} />WhatsApp</a>}
        </div>
      )}
      <ul className="mt-3 space-y-1 text-sm">
        {o.lines.map((l, i) => (
          <li key={i} className="flex gap-2">
            <b className="tabular-nums shrink-0">{l.qty}×</b>
            <span className="flex-1 min-w-0">{l.name}{l.extras?.length > 0 && <span className="block text-xs text-muted">+ {l.extras.map((e) => e.name).join(', ')}</span>}</span>
            {l.total > 0 && <span className="tabular-nums text-muted shrink-0">{money(l.total)}</span>}
          </li>
        ))}
      </ul>
      {o.note && <p className="mt-3 flex gap-1.5 text-sm rounded-xl bg-amber-50 text-amber-800 px-3 py-2"><StickyNote size={15} className="shrink-0 mt-0.5" />{o.note}</p>}
      <p className="flex justify-between font-semibold mt-3 pt-3 border-t border-line/70"><span>Total</span><span className="tabular-nums">{money(o.total)}</span></p>
      <div className="flex flex-wrap gap-2 mt-3">
        {col?.next && <Button variant="primary" size="sm" className="w-full whitespace-nowrap" onClick={() => onMove(o, col.next.status)}>{col.next.label}</Button>}
        {col?.back && <Button size="sm" onClick={() => onMove(o, col.back)} title="Move back"><RotateCcw size={14} /></Button>}
        {col && <Button size="sm" variant="ghost" onClick={() => onMove(o, 'cancelled')} className="text-danger">Cancel</Button>}
        {!col && <Button size="sm" onClick={() => onMove(o, o.status === 'cancelled' ? 'new' : 'ready')}><RotateCcw size={14} /> Reopen</Button>}
        {onInvoice && o.status !== 'cancelled' && <Button size="sm" variant="ghost" onClick={() => onInvoice(o)} title="Make an invoice from this order"><ReceiptText size={14} /> Invoice</Button>}
      </div>
    </article>
  );
}
