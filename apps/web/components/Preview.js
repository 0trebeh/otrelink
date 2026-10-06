'use client';
import { useEffect, useRef, useState } from 'react';
import { mountPage } from '@otrelink/core';
import { cx } from './ui';

const SHELL = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="only light">
<style>html{color-scheme:only light}html,body{margin:0;height:100%}body{overflow-y:auto;scrollbar-width:none}body::-webkit-scrollbar{display:none}#root{min-height:100%}</style>
</head><body><div id="root"></div></body></html>`;

/**
 * Live phone preview. Uses the exact same renderer as the public page,
 * so what you see here is what visitors get.
 */
export default function Preview({ page, replayKey = 0, className, scale = 1 }) {
  const frameRef = useRef(null);
  const [ready, setReady] = useState(false);
  const lastReplay = useRef(replayKey);

  // srcDoc can finish loading before React attaches onLoad (SSR/hydration).
  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    if (doc?.readyState === 'complete' && doc.getElementById('root')) setReady(true);
  }, []);

  // Editor shortcuts (Ctrl+S, Ctrl+Z…) keep working after clicking inside the preview.
  useEffect(() => {
    if (!ready) return;
    const doc = frameRef.current?.contentDocument;
    if (!doc) return;
    const forward = (e) => {
      if (!(e.ctrlKey || e.metaKey) || !['s', 'z', 'y'].includes(e.key.toLowerCase())) return;
      e.preventDefault();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: e.key, ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey, cancelable: true }));
    };
    doc.addEventListener('keydown', forward);
    return () => doc.removeEventListener('keydown', forward);
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const doc = frameRef.current?.contentDocument;
    const root = doc?.getElementById('root');
    if (!root) return;
    const animate = lastReplay.current !== replayKey;
    lastReplay.current = replayKey;
    let cleanup;
    const raf = requestAnimationFrame(() => {
      cleanup = mountPage(root, page, { mode: 'preview', animate, interceptLinks: true, footerUrl: '#' });
    });
    return () => { cancelAnimationFrame(raf); cleanup?.(); };
  }, [page, ready, replayKey]);

  return (
    <div className={cx('shrink-0', className)} style={{ width: 340 * scale, height: 700 * scale }}>
      <div className="relative rounded-[44px] bg-ink p-2.5 shadow-[0_30px_60px_-20px_rgba(23,23,31,.45)] origin-top-left" style={{ width: 340, height: 700, transform: `scale(${scale})` }}>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full bg-ink z-10" aria-hidden="true" />
        <iframe
          ref={frameRef}
          title="Page preview"
          srcDoc={SHELL}
          onLoad={() => setReady(true)}
          className="block size-full rounded-[36px] bg-white"
          sandbox="allow-same-origin allow-scripts allow-popups"
        />
      </div>
    </div>
  );
}
