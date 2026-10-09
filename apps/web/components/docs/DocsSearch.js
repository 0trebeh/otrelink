'use client';
// Local search for /docs: indexes the page's own sections (every h2/h3 with an id
// and the text below it) in the browser. No server, no external service.
// Ctrl+K or "/" focuses it; ↑ ↓ Enter to pick a result; Esc closes.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, CornerDownLeft } from 'lucide-react';

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const HL = 'ol-docs-search';

/** Sections of the docs: [{ id, title, parent, text }]. */
function buildIndex(root) {
  const heads = [...root.querySelectorAll('h2[id], h3[id]')];
  let parent = '';
  return heads.map((h, i) => {
    if (h.tagName === 'H2') parent = h.textContent.trim();
    const next = heads[i + 1];
    let text = '';
    for (let n = h.nextElementSibling; n && n !== next && !(n.matches?.('h2[id], h3[id]')); n = n.nextElementSibling) {
      if (n.querySelector?.('h2[id], h3[id]')) break;
      // innerText keeps the spaces between table cells, list items and paragraphs.
      text += ` ${n.innerText || n.textContent}`;
    }
    text = text.replace(/\s+/g, ' ').trim();
    return { id: h.id, title: h.textContent.trim(), parent: h.tagName === 'H3' ? parent : '', text, nTitle: norm(h.textContent), nText: norm(text) };
  });
}

function search(index, query) {
  const words = norm(query).split(/\s+/).filter((w) => w.length > 1 || /\d/.test(w));
  if (!words.length) return [];
  const out = [];
  for (const s of index) {
    let score = 0;
    let ok = true;
    for (const w of words) {
      const inTitle = s.nTitle.includes(w);
      const at = s.nText.indexOf(w);
      if (!inTitle && at < 0) { ok = false; break; }
      score += inTitle ? 10 : 0;
      // Found in the text: a little more when it's frequent for the section's size or near its start.
      if (at >= 0) {
        const density = (s.nText.split(w).length - 1) / Math.max(1, s.nText.length / 400);
        score += 1 + Math.min(2, density) + (at < 200 ? 1 : 0);
      }
    }
    if (!ok) continue;
    if (s.nTitle.startsWith(words[0])) score += 5;
    // The whole query, as typed, counts more than scattered words.
    const phrase = words.join(' ');
    if (words.length > 1 && s.nTitle.includes(phrase)) score += 12;
    else if (words.length > 1 && s.nText.includes(phrase)) score += 8;
    out.push({ ...s, score, snippet: snippet(s, words) });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 12);
}

/** ~140 characters of text around the first match. */
function snippet(s, words) {
  const at = words.map((w) => s.nText.indexOf(w)).filter((i) => i >= 0).sort((a, b) => a - b)[0];
  if (at === undefined) return s.text.slice(0, 140);
  const from = Math.max(0, at - 50);
  return `${from > 0 ? '…' : ''}${s.text.slice(from, from + 150)}${from + 150 < s.text.length ? '…' : ''}`;
}

/** The snippet with the query words wrapped in <mark>. */
function Marked({ text, words }) {
  if (!words.length) return text;
  const n = norm(text);
  const parts = [];
  let i = 0;
  while (i < text.length) {
    let hit = null;
    for (const w of words) {
      const at = n.indexOf(w, i);
      if (at >= 0 && (!hit || at < hit.at)) hit = { at, len: w.length };
    }
    if (!hit) { parts.push(text.slice(i)); break; }
    if (hit.at > i) parts.push(text.slice(i, hit.at));
    parts.push(<mark key={hit.at} className="bg-accent-soft text-ink rounded-sm">{text.slice(hit.at, hit.at + hit.len)}</mark>);
    i = hit.at + hit.len;
  }
  return parts;
}

/** Highlight the query words in a section of the page (CSS Custom Highlight API, when available). */
function highlightSection(id, words) {
  if (typeof CSS === 'undefined' || !CSS.highlights || typeof Highlight === 'undefined') return;
  CSS.highlights.delete(HL);
  const head = document.getElementById(id);
  if (!head || !words.length) return;
  const ranges = [];
  const stop = (n) => n !== head && n.matches?.('h2[id], h3[id]');
  for (let el = head; el && (el === head || !stop(el)); el = el.nextElementSibling) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      const n = norm(t.data);
      for (const w of words) {
        let at = n.indexOf(w);
        while (at >= 0 && ranges.length < 200) {
          const r = new Range();
          r.setStart(t, at); r.setEnd(t, at + w.length);
          ranges.push(r);
          at = n.indexOf(w, at + w.length);
        }
      }
    }
  }
  if (ranges.length) CSS.highlights.set(HL, new Highlight(...ranges));
}

export default function DocsSearch({ rootId = 'docs-content' }) {
  const [index, setIndex] = useState([]);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef(null);
  const box = useRef(null);

  useEffect(() => {
    const root = document.getElementById(rootId);
    if (root) setIndex(buildIndex(root));
  }, [rootId]);

  // Ctrl+K / ⌘K or "/" focuses the search.
  useEffect(() => {
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        input.current?.focus();
        input.current?.select();
        setOpen(true);
      }
    };
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown); };
  }, []);

  const words = useMemo(() => norm(q).split(/\s+/).filter((w) => w.length > 1 || /\d/.test(w)), [q]);
  const results = useMemo(() => search(index, q), [index, q]);
  useEffect(() => { setActive(0); }, [q]);

  const go = (r) => {
    if (!r) return;
    setOpen(false);
    const el = document.getElementById(r.id);
    if (!el) return;
    el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', `#${r.id}`);
    highlightSection(r.id, words);
    input.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
    else if (e.key === 'Escape') { setOpen(false); input.current?.blur(); }
  };

  const showList = open && q.trim().length > 0;

  return (
    <div ref={box} className="relative w-full">
      <label className="flex items-center gap-2 h-9 rounded-full border border-line bg-panel px-3 text-sm focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/15">
        <Search size={15} className="text-muted shrink-0" aria-hidden="true" />
        <input
          ref={input}
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search the docs"
          aria-label="Search the docs"
          role="combobox"
          aria-expanded={showList}
          aria-controls="docs-search-results"
          aria-activedescendant={showList && results[active] ? `docs-r-${results[active].id}` : undefined}
          autoComplete="off"
          spellCheck={false}
          className="flex-1 min-w-0 bg-transparent !outline-none !ring-0 !shadow-none !border-0 p-0 placeholder:text-muted/80 [&::-webkit-search-cancel-button]:hidden"
        />
        {q ? (
          <button type="button" onClick={() => { setQ(''); input.current?.focus(); if (typeof CSS !== 'undefined') CSS.highlights?.delete(HL); }} aria-label="Clear search" className="text-muted hover:text-ink cursor-pointer"><X size={14} /></button>
        ) : (
          <kbd className="hidden sm:inline text-[10px] font-semibold text-muted border border-line rounded px-1.5 py-0.5">Ctrl K</kbd>
        )}
      </label>
      {showList && (
        <div id="docs-search-results" role="listbox" className="fixed sm:absolute z-30 left-3 right-3 top-[3.75rem] sm:top-auto sm:left-auto sm:right-auto sm:w-[26rem] mt-0 sm:mt-2 max-h-[min(70vh,28rem)] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-panel shadow-xl p-1.5">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted">No results for “{q}”.</p>
          ) : results.map((r, i) => (
            <button
              key={r.id}
              id={`docs-r-${r.id}`}
              type="button"
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r)}
              className={`w-full text-left rounded-xl px-3 py-2.5 cursor-pointer ${i === active ? 'bg-soft' : ''}`}
            >
              <span className="flex items-center gap-2">
                <span className="font-semibold text-sm text-ink truncate"><Marked text={r.title} words={words} /></span>
                {r.parent && <span className="text-[11px] text-muted truncate">in {r.parent}</span>}
                {i === active && <CornerDownLeft size={13} className="ml-auto text-muted shrink-0" aria-hidden="true" />}
              </span>
              {r.snippet && <span className="block text-[12.5px] leading-5 text-muted mt-0.5 line-clamp-2"><Marked text={r.snippet} words={words} /></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
