'use client';
import { useEffect, useRef } from 'react';
import { mountPage } from '@otrelink/core';
import { cx } from './ui';

// The preview is drawn inside the dashboard page, in a Shadow DOM, instead of
// an <iframe>. Some browsers (e.g. Edge with "Auto Dark Mode for Web Contents")
// darken every same-site iframe even when it asks for light colors, but they
// respect the dashboard itself, so the preview keeps the real colors here.
//
// Shadow DOM keeps the page CSS and the dashboard CSS apart. A few rules adapt
// the page to the phone frame:
//  • the host has a transform, so `position: fixed` (wallpaper, gate) sticks to the phone screen;
//  • the scroller is a size container, so the page fills the screen height (100cqh, not 100vh);
//  • `all: initial` stops the dashboard's inherited styles (line-height, font…) from leaking in.
const FRAME_CSS = `
:host{display:block;transform:translateZ(0);overflow:hidden;contain:layout paint style}
.pv{all:initial;display:block;position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;container-type:size;color-scheme:only light;background:#fff}
.pv::-webkit-scrollbar{display:none}
.pv-root{min-height:100%}
.pv .ol-root{min-height:100%}
.pv .ol-root .ol-main{min-height:100cqh}
`;

/** Load the page fonts in the document (fonts declared inside a shadow root are ignored). */
function adoptFonts(shadow) {
  for (const link of shadow.querySelectorAll('link[rel="stylesheet"]')) {
    const href = link.getAttribute('href');
    if (href && ![...document.head.querySelectorAll('link[rel="stylesheet"]')].some((l) => l.getAttribute('href') === href)) {
      const copy = document.createElement('link');
      copy.rel = 'stylesheet';
      copy.href = href;
      copy.dataset.olPreviewFont = '';
      document.head.append(copy);
    }
  }
}

/**
 * Live phone preview. Uses the exact same renderer as the public page,
 * so what you see here is what visitors get.
 */
export default function Preview({ page, replayKey = 0, className, scale = 1 }) {
  const hostRef = useRef(null);
  const rootRef = useRef(null);
  const lastReplay = useRef(replayKey);

  // Create the shadow root once.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || rootRef.current) return;
    const shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style>${FRAME_CSS}</style><div class="pv"><div class="pv-root"></div></div>`;
    rootRef.current = shadow.querySelector('.pv-root');
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const animate = lastReplay.current !== replayKey;
    lastReplay.current = replayKey;
    let cleanup;
    const raf = requestAnimationFrame(() => {
      cleanup = mountPage(root, page, { mode: 'preview', animate, interceptLinks: true, footerUrl: '#', colorScheme: false });
      adoptFonts(root.getRootNode());
    });
    return () => { cancelAnimationFrame(raf); cleanup?.(); };
  }, [page, replayKey]);

  return (
    <div className={cx('shrink-0', className)} style={{ width: 340 * scale, height: 700 * scale }}>
      <div className="relative rounded-[44px] bg-ink p-2.5 shadow-[0_30px_60px_-20px_rgba(23,23,31,.45)] origin-top-left" style={{ width: 340, height: 700, transform: `scale(${scale})` }}>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full bg-ink z-10" aria-hidden="true" />
        <div ref={hostRef} role="region" aria-label="Page preview" className="relative block size-full rounded-[36px] bg-white" />
      </div>
    </div>
  );
}
