'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardList, Download, Star, Trash2 } from 'lucide-react';
import { flattenBlocks, sanitizeBlock, summarizeResponses, answerText } from '@otrelink/core';
import { api, errorMessage } from '@/lib/client';
import { Panel, Button, IconButton, cx } from '@/components/ui';
import { NotificationsCard } from './AgendaSection';

const surveyName = (b) => b.data.title || b.data.buttonLabel || 'Survey';
const when = (iso) => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export default function ResponsesSection({ ed }) {
  const { page } = ed;
  const surveys = useMemo(() => flattenBlocks(page.blocks).filter((b) => b.type === 'survey').map((b) => sanitizeBlock(b)), [page.blocks]);
  const [active, setActive] = useState(surveys[0]?.id || null);
  const survey = surveys.find((s) => s.id === active) || surveys[0];
  const [view, setView] = useState('summary');
  const [counts, setCounts] = useState({});
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    if (!survey) return;
    try {
      const [c, r] = await Promise.all([
        api(`/api/responses?pageId=${page.id}`),
        api(`/api/responses?pageId=${page.id}&blockId=${survey.id}`),
      ]);
      setCounts(c.counts || {});
      setItems(r.responses);
      setErr('');
    } catch (e) { setErr(errorMessage(e)); }
  }, [page.id, survey?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setItems(null);
    load();
    const t = setInterval(load, 60_000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, [load]);

  const removeOne = async (r) => {
    if (!window.confirm('Delete this response?')) return;
    try { await api(`/api/responses/${r.id}`, { method: 'DELETE' }); load(); } catch (e) { window.alert(errorMessage(e)); }
  };
  const removeAll = async () => {
    if (!window.confirm(`Delete all ${items?.length || 0} responses of “${surveyName(survey)}”? This can't be undone.`)) return;
    try { await api(`/api/responses?pageId=${page.id}&blockId=${survey.id}`, { method: 'DELETE' }); load(); } catch (e) { window.alert(errorMessage(e)); }
  };

  const summary = useMemo(() => (survey && items ? summarizeResponses(survey.data.questions, items) : []), [survey, items]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight">Responses</h2>
        {survey && (
          <div className="inline-flex rounded-full bg-panel border border-line p-1" role="group" aria-label="Show">
            {[['summary', 'Summary'], ['list', 'Individual']].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setView(id)} aria-pressed={view === id}
                className={cx('h-8 px-3.5 rounded-full text-[13px] font-semibold cursor-pointer', view === id ? 'bg-ink text-white' : 'text-muted hover:text-ink')}>
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {!survey && (
        <Panel>
          <p className="font-semibold">Ask your visitors</p>
          <p className="text-sm text-muted mt-1">Add a <b>Survey</b> block in <i>Links</i>, write your questions and save. Answers will show up here.</p>
        </Panel>
      )}

      {surveys.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Survey">
          {surveys.map((s) => (
            <button key={s.id} type="button" onClick={() => setActive(s.id)} aria-pressed={s.id === survey?.id}
              className={cx('h-9 px-4 rounded-full border text-sm font-semibold cursor-pointer inline-flex items-center gap-2',
                s.id === survey?.id ? 'bg-accent-soft border-accent/40 text-accent-ink' : 'bg-panel border-line text-muted hover:text-ink')}>
              {surveyName(s)} <span className="text-xs tabular-nums opacity-70">{counts[s.id] ?? '–'}</span>
            </button>
          ))}
        </div>
      )}

      {survey && (
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-3xl font-extrabold tabular-nums leading-none">{items ? items.length : '–'}</p>
              <p className="text-sm text-muted mt-1">response{items?.length === 1 ? '' : 's'} · {surveyName(survey)}</p>
            </div>
            <div className="flex gap-2">
              <a href={`/api/responses?pageId=${page.id}&blockId=${survey.id}&format=csv`} download
                className={cx('inline-flex items-center justify-center rounded-full font-semibold h-10 px-4 text-sm gap-2 bg-panel text-ink border border-line hover:border-ink/30', !items?.length && 'pointer-events-none opacity-50')}
                aria-disabled={!items?.length}>
                <Download size={16} /> Download CSV
              </a>
              <Button variant="danger" onClick={removeAll} disabled={!items?.length}><Trash2 size={16} /> Delete all</Button>
            </div>
          </div>
          {!survey.enabled && <p className="text-sm text-amber-700 mt-3">This survey is hidden on your page.</p>}
        </Panel>
      )}

      {err && <Panel><p className="text-sm text-danger">{err}</p></Panel>}
      {survey && !items && !err && <div className="h-40 rounded-3xl bg-panel/60 animate-pulse" />}
      {survey && items?.length === 0 && (
        <div className="rounded-3xl border border-dashed border-line p-10 text-center">
          <ClipboardList className="mx-auto text-muted" />
          <p className="font-semibold mt-2">No responses yet</p>
          <p className="text-sm text-muted mt-1">Share your page to start getting answers.</p>
        </div>
      )}

      {survey && items?.length > 0 && view === 'summary' && (
        <div className="space-y-3">
          {summary.map((s, i) => <QuestionSummary key={s.id} s={s} n={i + 1} total={items.length} />)}
        </div>
      )}

      {survey && items?.length > 0 && view === 'list' && (
        <ul className="space-y-2.5">
          {items.map((r, i) => (
            <li key={r.id} className="rounded-3xl bg-panel border border-line/80 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm font-semibold">#{items.length - i} <span className="font-normal text-muted">· {when(r.createdAt)}{r.country ? ` · ${r.country}` : ''}</span></p>
                <IconButton label="Delete response" onClick={() => removeOne(r)}><Trash2 size={16} /></IconButton>
              </div>
              <dl className="grid gap-3">
                {r.answers.map((a) => (
                  <div key={a.id} className="min-w-0">
                    <dt className="text-xs font-semibold text-muted">{a.label}</dt>
                    <dd className="text-sm mt-0.5 whitespace-pre-line break-words">{answerText(a) || <span className="text-muted">—</span>}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}

      {survey && <NotificationsCard />}
    </div>
  );
}

function Bar({ label, count, max, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1">
      <span className="text-sm truncate">{label}</span>
      <span className="text-xs text-muted tabular-nums">{count} · {pct}%</span>
      <span className="col-span-2 h-2 rounded-full bg-soft overflow-hidden">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${max ? (count / max) * 100 : 0}%` }} />
      </span>
    </li>
  );
}

function QuestionSummary({ s, n, total }) {
  const entries = Object.entries(s.counts || {});
  const max = Math.max(0, ...entries.map(([, c]) => c));
  const label = (k) => (s.type === 'yesno' ? (k === 'yes' ? 'Yes' : 'No') : s.type === 'rating' ? `${k} ★` : k);
  return (
    <Panel>
      <p className="text-xs font-semibold text-muted">Question {n} · {s.answered} of {total} answered</p>
      <p className="font-semibold mt-1">{s.label}</p>
      <div className="mt-4">
        {(s.type === 'rating' || s.type === 'scale' || s.type === 'number') && s.average != null && (
          <p className="flex items-center gap-2 mb-3">
            <span className="font-display text-3xl font-extrabold tabular-nums">{s.average.toFixed(1)}</span>
            <span className="text-sm text-muted">average{s.type === 'rating' ? ' of 5' : s.type === 'scale' ? ' of 10' : ''}</span>
            {s.type === 'rating' && <Star size={20} className="text-amber-400 fill-amber-400" />}
          </p>
        )}
        {s.type === 'scale' && (
          <div className="grid grid-cols-11 gap-1.5 items-end h-28" aria-label="Answers per value">
            {entries.map(([k, c]) => (
              <div key={k} className="flex flex-col items-center justify-end h-full gap-1" title={`${k}: ${c}`}>
                <span className="text-[11px] text-muted tabular-nums">{c || ''}</span>
                <span className="w-full rounded-md bg-accent" style={{ height: `${max ? Math.max((c / max) * 70, c ? 6 : 2) : 2}%`, opacity: c ? 1 : 0.15 }} />
                <span className="text-xs font-semibold tabular-nums">{k}</span>
              </div>
            ))}
          </div>
        )}
        {entries.length > 0 && s.type !== 'number' && s.type !== 'scale' && (
          <ul className="grid gap-2.5">
            {(s.type === 'rating' ? [...entries].reverse() : entries).map(([k, c]) => <Bar key={k} label={label(k)} count={c} max={max} total={s.answered} />)}
          </ul>
        )}
        {s.latest && (s.latest.length
          ? (
            <ul className="grid gap-2">
              {s.latest.map((t, i) => <li key={i} className="text-sm rounded-2xl bg-soft px-3 py-2 whitespace-pre-line break-words">{t}</li>)}
              {s.answered > s.latest.length && <li className="text-xs text-muted">See all answers in <i>Individual</i> or in the CSV.</li>}
            </ul>
          )
          : <p className="text-sm text-muted">No answers yet.</p>)}
      </div>
    </Panel>
  );
}
