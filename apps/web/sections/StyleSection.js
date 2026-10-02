'use client';
import { useMemo } from 'react';
import { designGroups, fonts, googleFontsHref } from '@otrelink/core';
import { Panel } from '@/components/ui';
import FieldList from '@/components/fields/FieldList';

// One panel per design group declared in @otrelink/core (design.js).
// New design options added there appear here automatically.
export default function StyleSection({ ed }) {
  const { page, set } = ed;
  const fontsHref = useMemo(() => googleFontsHref(fonts.keys()), []);
  return (
    <div className="space-y-5">
      <link rel="stylesheet" href={fontsHref} />
      {designGroups.map((g) => (
        <Panel key={g.id} title={g.label} description={g.help}>
          <FieldList
            fields={g.fields}
            values={page.design}
            onChange={(k, v) => set((p) => ({ ...p, design: { ...p.design, theme: 'custom', [k]: v } }), `design:${k}`)}
          />
        </Panel>
      ))}
    </div>
  );
}
