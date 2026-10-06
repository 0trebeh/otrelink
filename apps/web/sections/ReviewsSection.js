'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, EyeOff, MessageSquareReply, Star, Trash2, Eye } from 'lucide-react';
import { flattenBlocks, sanitizeBlock } from '@otrelink/core';
import { api, errorMessage } from '@/lib/client';
import { Panel, Button, Textarea, cx } from '@/components/ui';
import { NotificationsCard } from './AgendaSection';

const VIEWS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'To approve' },
  { id: 'published', label: 'Published' },
  { id: 'hidden', label: 'Hidden' },
];
const STATUS = {
  pending: { label: 'To approve', cls: 'bg-amber-100 text-amber-800' },
  published: { label: 'Published', cls: 'bg-teal/15 text-teal' },
  hidden: { label: 'Hidden', cls: 'bg-soft text-muted' },
};
const when = (iso) => new Date(iso).toLocaleDateString([], { dateStyle: 'medium' });

function Stars({ value, size = 15 }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} className={n <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-line fill-line'} />
      ))}
    </span>
  );
}

export default function ReviewsSection({ ed }) {
  const { page } = ed;
  const blocks = useMemo(() => flattenBlocks(page.blocks).filter((b) => b.type === 'reviews').map((b) => sanitizeBlock(b)), [page.blocks]);
  const [active, setActive] = useState(blocks[0]?.id || null);
  const block = blocks.find((b) => b.id === active) || blocks[0];
  const [view, setView] = useState('all');
  const [res, setRes] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!block) return;
    try {
      setRes(await api(`/api/reviews?pageId=${page.id}&blockId=${block.id}&status=${view}`));
      setErr('');
    } catch (e) { setErr(errorMessage(e)); }
  }, [page.id, block?.id, view]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setRes(null);
    load();
    const t = setInterval(load, 60_000);
    window.addEventListener('focus', load);
    return () => { clearInterval(t); window.removeEventListener('focus', load); };
  }, [load]);

  const patch = async (r, body) => {
    try { await api(`/api/reviews/${r.id}`, { method: 'PATCH', body }); await load(); ed.refreshPending?.(); } catch (e) { window.alert(errorMessage(e)); }
  };
  const remove = async (r) => {
    if (!window.confirm('Delete this review? This can’t be undone.')) return;
    try { await api(`/api/reviews/${r.id}`, { method: 'DELETE' }); await load(); ed.refreshPending?.(); } catch (e) { window.alert(errorMessage(e)); }
  };

  const counts = res?.counts || {};
  const stats = res?.stats;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight">Reviews</h2>
        {block && (
          <div className="inline-flex flex-wrap rounded-full bg-panel border border-line p-1" role="group" aria-label="Show">
            {VIEWS.map((v) => (
              <button key={v.id} type="button" onClick={() => setView(v.id)} aria-pressed={view === v.id}
                className={cx('h-8 px-3.5 rounded-full text-[13px] font-semibold cursor-pointer inline-flex items-center gap-1.5', view === v.id ? 'bg-ink text-white' : 'text-muted hover:text-ink')}>
                {v.label}
                {counts[v.id] > 0 && <span className={cx('text-[11px] tabular-nums', v.id === 'pending' && view !== v.id && 'text-amber-700 font-bold')}>{counts[v.id]}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {!block && (
        <Panel>
          <p className="font-semibold">Collect reviews</p>
          <p className="text-sm text-muted mt-1">Add a <b>Reviews</b> block in <i>Links</i> and save. Your clients can rate you with stars and a comment, and everybody can read the reviews.</p>
        </Panel>
      )}

      {blocks.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Reviews block">
          {blocks.map((b) => (
            <button key={b.id} type="button" onClick={() => setActive(b.id)} aria-pressed={b.id === block?.id}
              className={cx('h-9 px-4 rounded-full border text-sm font-semibold cursor-pointer',
                b.id === block?.id ? 'bg-accent-soft border-accent/40 text-accent-ink' : 'bg-panel border-line text-muted hover:text-ink')}>
              {b.data.title || b.data.buttonLabel || 'Reviews'}
            </button>
          ))}
        </div>
      )}

      {block && stats && (
        <Panel>
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-center min-w-24">
              <p className="font-display text-4xl font-extrabold tabular-nums leading-none">{stats.count ? stats.average.toFixed(1) : '–'}</p>
              <div className="mt-1.5"><Stars value={stats.average} /></div>
              <p className="text-xs text-muted mt-1">{stats.count} published</p>
            </div>
            <ul className="flex-1 min-w-48 grid gap-1.5">
              {[5, 4, 3, 2, 1].map((n) => (
                <li key={n} className="grid grid-cols-[2.2rem_minmax(0,1fr)_2rem] items-center gap-2 text-xs tabular-nums">
                  <span className="text-muted">{n} ★</span>
                  <span className="h-2 rounded-full bg-soft overflow-hidden"><span className="block h-full bg-amber-400 rounded-full" style={{ width: `${stats.count ? (stats.dist[n] / stats.count) * 100 : 0}%` }} /></span>
                  <span className="text-right text-muted">{stats.dist[n]}</span>
                </li>
              ))}
            </ul>
          </div>
          {!block.enabled && <p className="text-sm text-amber-700 mt-3">This block is hidden on your page.</p>}
          {block.data.moderation === 'manual' && <p className="text-sm text-muted mt-3">New reviews wait for your approval before they appear on your page.</p>}
        </Panel>
      )}

      {err && <Panel><p className="text-sm text-danger">{err}</p></Panel>}
      {block && !res && !err && <div className="h-40 rounded-3xl bg-panel/60 animate-pulse" />}
      {res && res.reviews.length === 0 && (
        <div className="rounded-3xl border border-dashed border-line p-10 text-center">
          <Star className="mx-auto text-muted" />
          <p className="font-semibold mt-2">{{ all: 'No reviews yet', pending: 'Nothing to approve', published: 'No published reviews', hidden: 'No hidden reviews' }[view]}</p>
        </div>
      )}

      {res?.reviews.length > 0 && (
        <ul className="space-y-2.5">
          {res.reviews.map((r) => <ReviewCard key={r.id} r={r} onPatch={patch} onRemove={remove} />)}
        </ul>
      )}

      {block && <NotificationsCard />}
    </div>
  );
}

function ReviewCard({ r, onPatch, onRemove }) {
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState(r.reply);
  const [saving, setSaving] = useState(false);
  const s = STATUS[r.status] || STATUS.published;

  const saveReply = async (text) => {
    setSaving(true);
    await onPatch(r, { reply: text });
    setSaving(false);
    setReplying(false);
  };

  return (
    <li className="rounded-3xl bg-panel border border-line/80 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="size-9 shrink-0 rounded-full bg-soft grid place-items-center text-sm font-bold" aria-hidden="true">{(r.name || 'A').charAt(0).toUpperCase()}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold truncate">{r.name || 'Anonymous'}</p>
            <span className={cx('text-[11px] font-semibold px-2 py-0.5 rounded-full', s.cls)}>{s.label}</span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
            <Stars value={r.rating} size={14} /> <span>{when(r.createdAt)}{r.editedAt ? ' · edited by the author' : ''}{r.country ? ` · ${r.country}` : ''}</span>
          </div>
          {r.comment ? <p className="text-sm mt-2 whitespace-pre-line break-words">{r.comment}</p> : <p className="text-sm mt-2 text-muted italic">No comment</p>}

          {r.reply && !replying && (
            <div className="mt-3 rounded-2xl bg-soft px-3 py-2">
              <p className="text-xs font-semibold text-muted">Your reply</p>
              <p className="text-sm whitespace-pre-line break-words">{r.reply}</p>
            </div>
          )}
          {replying && (
            <div className="mt-3 space-y-2">
              <Textarea value={reply} onChange={(e) => setReply(e.target.value)} maxLength={1000} placeholder="Thank them or answer their comment. Your reply is public." autoFocus />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="primary" disabled={saving || !reply.trim()} onClick={() => saveReply(reply)}>{saving ? 'Saving…' : 'Publish reply'}</Button>
                {r.reply && <Button size="sm" variant="ghost" disabled={saving} onClick={() => { setReply(''); saveReply(''); }}>Remove reply</Button>}
                <Button size="sm" variant="ghost" onClick={() => { setReply(r.reply); setReplying(false); }}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {r.status !== 'published' && <Button size="sm" variant="primary" onClick={() => onPatch(r, { status: 'published' })}>{r.status === 'pending' ? <><Check size={15} /> Approve</> : <><Eye size={15} /> Show</>}</Button>}
            {r.status !== 'hidden' && <Button size="sm" onClick={() => onPatch(r, { status: 'hidden' })}><EyeOff size={15} /> Hide</Button>}
            {!replying && <Button size="sm" onClick={() => setReplying(true)}><MessageSquareReply size={15} /> {r.reply ? 'Edit reply' : 'Reply'}</Button>}
            <Button size="sm" variant="danger" onClick={() => onRemove(r)}><Trash2 size={15} /> Delete</Button>
          </div>
        </div>
      </div>
    </li>
  );
}
