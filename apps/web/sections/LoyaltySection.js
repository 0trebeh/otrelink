'use client';
// Loyalty cards: scan a customer's QR (or type the code) to add stamps and give rewards.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ScanLine, Search, Gift, Undo2, X, Loader2, Stamp, Plus } from 'lucide-react';
import { parseCardCode, formatCardCode } from '@otrelink/core';
import { api, errorMessage } from '@/lib/client';
import { Panel, Button, Input, IconButton, cx } from '@/components/ui';

const since = (iso) => {
  if (!iso) return '';
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)} h ago`;
  return new Date(iso).toLocaleDateString([], { dateStyle: 'medium' });
};

export default function LoyaltySection({ ed }) {
  const { page } = ed;
  const [data, setData] = useState(null); // { cards, blocks, total }
  const [q, setQ] = useState('');
  const [card, setCard] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (query = '') => {
    try { setData(await api(`/api/loyalty?pageId=${page.id}&q=${encodeURIComponent(query)}`)); } catch (e) { setErr(errorMessage(e)); }
  }, [page.id]);
  useEffect(() => { const t = setTimeout(() => load(q), q ? 300 : 0); return () => clearTimeout(t); }, [q, load]);

  const open = async (text) => {
    const c = parseCardCode(text);
    if (!c) { setErr('That is not a loyalty card code.'); return; }
    setErr('');
    setBusy(true);
    try {
      const r = await api(`/api/loyalty?pageId=${page.id}&code=${c}`);
      setCard(r.card);
      setCode('');
      navigator.vibrate?.(60);
    } catch (e) {
      setErr(e?.status === 404 || /not.found/i.test(e?.message || '') ? `No card with the code ${formatCardCode(c)} on this page.` : errorMessage(e));
    } finally { setBusy(false); }
  };

  const block = (c) => data?.blocks.find((b) => b.id === c?.blockId) || data?.blocks[0];

  if (data && !data.blocks.length && !data.total) {
    return (
      <div className="space-y-5">
        <Header />
        <div className="rounded-3xl border border-dashed border-line p-10 text-center">
          <Stamp className="mx-auto text-muted" />
          <p className="font-display text-lg font-bold mt-3">Reward your regulars</p>
          <p className="text-sm text-muted mt-1 max-w-md mx-auto">Add a <b>Loyalty card</b> block to your page. Customers get a digital stamp card with a QR code; you scan it here to add stamps.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Header />
      <Panel title="Stamp a card">
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => { setScanning(true); setCard(null); setErr(''); }}><ScanLine size={17} /> Scan QR</Button>
          <form className="flex gap-2 flex-1 min-w-[220px]" onSubmit={(e) => { e.preventDefault(); open(code); }}>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Or type the code: K7Q-2MX" aria-label="Card code" className="font-mono uppercase" maxLength={9} />
            <Button type="submit" disabled={busy || !code}>{busy ? <Loader2 size={15} className="animate-spin" /> : 'Open'}</Button>
          </form>
        </div>
        {err && <p className="text-sm text-danger mt-2" role="alert">{err}</p>}
        {scanning && <Scanner onCode={(t) => { setScanning(false); open(t); }} onClose={() => setScanning(false)} />}
        {card && <CardPanel card={card} block={block(card)} onChange={(c) => { setCard(c); load(q); }} onClose={() => setCard(null)} />}
      </Panel>

      <Panel title="Cards" description={data ? `${data.total} card${data.total === 1 ? '' : 's'} in total.` : undefined}>
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find by name or code" className="pl-9" aria-label="Find a card" />
        </div>
        {!data ? <p className="text-sm text-muted">Loading…</p> : (
          <ul className="divide-y divide-line/70">
            {data.cards.map((c) => {
              const b = block(c);
              const ready = b && c.stamps >= b.stamps;
              return (
                <li key={c.id}>
                  <button type="button" onClick={() => { setCard(c); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="w-full flex items-center gap-3 py-2.5 text-left cursor-pointer hover:bg-soft/60 rounded-xl px-2 -mx-2">
                    <span className="size-9 rounded-xl bg-soft grid place-items-center text-lg shrink-0">{b?.icon || '⭐'}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold truncate">{c.name || 'No name'} <span className="font-mono text-xs text-muted">{formatCardCode(c.code)}</span></span>
                      <span className="block text-xs text-muted">{c.lastStampAt ? `Last stamp ${since(c.lastStampAt)}` : `Created ${since(c.createdAt)}`}{c.rewards ? ` · ${c.rewards} reward${c.rewards === 1 ? '' : 's'}` : ''}</span>
                    </span>
                    <span className={cx('text-sm font-bold tabular-nums', ready && 'text-teal')}>{c.stamps}/{b?.stamps ?? '?'}</span>
                  </button>
                </li>
              );
            })}
            {!data.cards.length && <p className="text-sm text-muted py-2">{q ? 'No cards found.' : 'No cards yet. They appear when customers get one on your page.'}</p>}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Loyalty</h1>
      <p className="text-sm text-muted mt-1">Scan your customer’s card when they pay. Works from your phone’s camera.</p>
    </div>
  );
}

function CardPanel({ card, block, onChange, onClose }) {
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');
  const goal = block?.stamps || 8;
  const ready = card.stamps >= goal;
  const act = async (action, extra = {}) => {
    if (action === 'stamp' && block?.oneStampEvery && card.lastStampAt && Date.now() - new Date(card.lastStampAt).getTime() < block.oneStampEvery * 60000
      && !window.confirm(`This card got a stamp ${since(card.lastStampAt)}. Add another one?`)) return;
    setBusy(action);
    setErr('');
    try {
      const r = await api(`/api/loyalty/${card.id}`, { method: 'POST', body: { action, ...extra } });
      onChange(r.card);
      navigator.vibrate?.(40);
    } catch (e) { setErr(errorMessage(e)); } finally { setBusy(''); }
  };
  return (
    <div className="mt-4 rounded-2xl border border-line p-4 relative">
      <IconButton label="Close card" onClick={onClose} className="absolute top-2 right-2"><X size={16} /></IconButton>
      <p className="text-xs text-muted font-mono">{formatCardCode(card.code)}</p>
      <p className="font-display text-xl font-extrabold">{card.name || 'No name'}</p>
      {block && <p className="text-xs text-muted">{block.title} · {goal} × {block.icon} = {block.reward}</p>}
      <ol className="flex flex-wrap gap-1.5 mt-3" aria-label={`${Math.min(card.stamps, goal)} of ${goal} stamps`}>
        {Array.from({ length: goal }, (_, i) => (
          <li key={i} className={cx('size-11 rounded-full grid place-items-center text-lg border-2', i < card.stamps ? 'border-ink bg-soft' : 'border-dashed border-line')}>{i < card.stamps ? block?.icon || '⭐' : ''}</li>
        ))}
      </ol>
      <p className="text-sm mt-3">
        {ready ? <b className="text-teal">Reward ready: {block?.reward}</b> : <>{goal - card.stamps} more for the reward.</>}
        {card.stamps > goal && <span className="text-muted"> ({card.stamps - goal} extra stamp{card.stamps - goal === 1 ? '' : 's'} carry over)</span>}
        {card.rewards > 0 && <span className="text-muted"> · {card.rewards} reward{card.rewards === 1 ? '' : 's'} given</span>}
      </p>
      <div className="flex flex-wrap gap-2 mt-4">
        <Button variant="primary" size="lg" onClick={() => act('stamp', { n: 1 })} disabled={Boolean(busy)}>
          {busy === 'stamp' ? <Loader2 size={17} className="animate-spin" /> : <Plus size={17} />} Add stamp
        </Button>
        <Button size="lg" onClick={() => act('stamp', { n: 2 })} disabled={Boolean(busy)} title="Two purchases at once">+2</Button>
        {ready && <Button size="lg" variant="dark" onClick={() => act('redeem')} disabled={Boolean(busy)}><Gift size={17} /> Give reward</Button>}
        {card.history?.length > 0 && <Button size="lg" variant="ghost" onClick={() => act('undo')} disabled={Boolean(busy)}><Undo2 size={16} /> Undo</Button>}
      </div>
      {err && <p className="text-sm text-danger mt-2" role="alert">{err}</p>}
      {card.history?.length > 0 && (
        <p className="text-xs text-muted mt-3">Last: {card.history[0].type === 'redeem' ? 'reward given' : `+${card.history[0].n} stamp${card.history[0].n === 1 ? '' : 's'}`} {since(card.history[0].at)}</p>
      )}
    </div>
  );
}

/** Camera QR scanner: BarcodeDetector when the browser has it, jsQR otherwise. */
function Scanner({ onCode, onClose }) {
  const video = useRef(null);
  const [msg, setMsg] = useState('Starting the camera…');
  const found = useRef(onCode);
  found.current = onCode;
  useEffect(() => {
    let stream;
    let stop = false;
    let raf;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (stop) return;
        const v = video.current;
        v.srcObject = stream;
        await v.play();
        setMsg('Point the camera at the QR code of the card.');
        let detect;
        if ('BarcodeDetector' in window && (await window.BarcodeDetector.getSupportedFormats?.())?.includes('qr_code')) {
          const d = new window.BarcodeDetector({ formats: ['qr_code'] });
          detect = async () => (await d.detect(v))[0]?.rawValue;
        } else {
          const { default: jsQR } = await import('jsqr');
          const canvas = document.createElement('canvas');
          const c2d = canvas.getContext('2d', { willReadFrequently: true });
          detect = async () => {
            const w = v.videoWidth; const h = v.videoHeight;
            if (!w) return null;
            const scale = Math.min(1, 640 / w);
            canvas.width = w * scale; canvas.height = h * scale;
            c2d.drawImage(v, 0, 0, canvas.width, canvas.height);
            return jsQR(c2d.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height)?.data;
          };
        }
        const loop = async () => {
          if (stop) return;
          const text = await detect().catch(() => null);
          if (text && parseCardCode(text)) { found.current(text); return; }
          raf = setTimeout(loop, 200);
        };
        loop();
      } catch (e) {
        setMsg(e?.name === 'NotAllowedError' ? 'Camera permission was denied. Allow it in your browser settings, or type the code.' : 'The camera could not start. Type the code instead.');
      }
    })();
    return () => { stop = true; clearTimeout(raf); stream?.getTracks().forEach((t) => t.stop()); };
  }, []);
  return (
    <div className="mt-4 rounded-2xl overflow-hidden bg-black relative">
      <video ref={video} playsInline muted className="w-full max-h-[60vh] object-cover" />
      <div className="absolute inset-0 grid place-items-center pointer-events-none"><div className="size-48 rounded-3xl border-4 border-white/80" /></div>
      <p className="absolute bottom-0 inset-x-0 text-center text-white text-sm bg-black/50 px-3 py-2">{msg}</p>
      <IconButton label="Close camera" onClick={onClose} className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70 hover:text-white"><X size={18} /></IconButton>
    </div>
  );
}
