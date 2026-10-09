'use client';
// Docs sidebar: scrolls on its own (long table of contents) and marks the
// section on screen, keeping it visible in the list.
import { useEffect, useRef, useState } from 'react';

export default function DocsToc({ items }) {
  const [current, setCurrent] = useState(items[0]?.id);
  const list = useRef(null);

  useEffect(() => {
    const heads = items.map((t) => document.getElementById(t.id)).filter(Boolean);
    let raf = 0;
    const update = () => {
      raf = 0;
      // The last heading above the top quarter of the screen.
      const line = window.innerHeight * 0.25;
      let id = heads[0]?.id;
      for (const h of heads) { if (h.getBoundingClientRect().top <= line) id = h.id; else break; }
      // At the very bottom, the last section wins.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) id = heads[heads.length - 1]?.id;
      setCurrent(id);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [items]);

  // Keep the current entry visible inside the sidebar's own scroll.
  useEffect(() => {
    const el = list.current?.querySelector(`[data-toc="${CSS.escape(current || '')}"]`);
    const box = list.current;
    if (!el || !box) return;
    const top = el.offsetTop - box.offsetTop;
    if (top < box.scrollTop + 24 || top > box.scrollTop + box.clientHeight - 48) {
      box.scrollTo({ top: Math.max(0, top - box.clientHeight / 3), behavior: 'smooth' });
    }
  }, [current]);

  return (
    <ul ref={list} className="space-y-0.5 text-sm max-h-[calc(100vh-10rem)] overflow-y-auto overscroll-contain pr-2 -mr-2 [scrollbar-width:thin]">
      {items.map((t) => {
        const on = t.id === current;
        return (
          <li key={t.id}>
            <a
              href={`#${t.id}`}
              data-toc={t.id}
              aria-current={on ? 'location' : undefined}
              className={`block py-1.5 px-2 rounded-lg transition-colors hover:text-ink hover:bg-soft ${t.sub ? 'pl-5 text-[13px]' : 'font-medium'} ${on ? 'bg-accent-soft text-accent-ink' : t.sub ? 'text-muted' : 'text-ink/80'}`}
            >
              {t.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
