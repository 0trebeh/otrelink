'use client';
import { useEffect, useMemo, useState } from 'react';
import { applyTheme, createDefaultPage, newBlock, themes, resolveDesign } from '@otrelink/core';
import Preview from './Preview';

// A demo page that cycles through every installed theme.
export default function LandingDemo() {
  const base = useMemo(() => {
    const p = createDefaultPage({ slug: 'mara.makes', title: 'Mara Okafor' });
    p.profile.bio = 'Ceramics, glaze experiments and studio days in Lisbon.';
    p.socials = [
      { id: 's1', platform: 'instagram', url: 'instagram.com/mara' },
      { id: 's2', platform: 'tiktok', url: 'tiktok.com/@mara' },
      { id: 's3', platform: 'youtube', url: 'youtube.com/@mara' },
    ];
    p.blocks = [
      newBlock('link', { title: 'Shop the spring collection', url: 'https://example.com' }),
      newBlock('link', { title: 'Book a wheel-throwing class', url: 'https://example.com' }),
      newBlock('countdown', { title: 'Next kiln opening', date: new Date(Date.now() + 3 * 864e5 + 5 * 36e5).toISOString() }),
      newBlock('link', { title: 'Studio newsletter', url: 'https://example.com' }),
    ];
    return p;
  }, []);
  const ids = themes.keys();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((n) => (n + 1) % ids.length), 2600);
    return () => clearInterval(t);
  }, [ids.length]);
  const page = useMemo(() => ({ ...base, design: applyTheme(resolveDesign({}), ids[i]) }), [base, i, ids]);

  return (
    <div className="flex flex-col items-center gap-3">
      <Preview page={page} scale={0.9} />
      <p className="text-sm text-muted" aria-live="polite">Theme: <span className="font-semibold text-ink">{themes.get(ids[i]).label}</span></p>
    </div>
  );
}
