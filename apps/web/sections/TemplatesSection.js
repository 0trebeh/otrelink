'use client';
// Templates: start the page from a ready-made design and blocks.
import { useState } from 'react';
import { buildTemplatePage, TEMPLATES } from '@otrelink/core';
import TemplatePicker from '@/components/TemplatePicker';
import { Toggle } from '@/components/ui';

export default function TemplatesSection({ ed }) {
  const [keepProfile, setKeepProfile] = useState(true);
  const [done, setDone] = useState('');

  const apply = (id) => {
    const t = buildTemplatePage(id);
    ed.set((p) => ({
      ...p,
      blocks: t.blocks,
      design: t.design,
      ...(keepProfile ? {} : { profile: t.profile, socials: t.socials }),
    }));
    setDone(TEMPLATES.find((x) => x.id === id)?.name || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">Templates</h1>
        <p className="text-sm text-muted mt-1">Pick a template to see it, then use it as the base of this page. Everything stays editable.</p>
      </div>
      {done && (
        <p className="rounded-2xl bg-teal/10 text-teal px-4 py-3 text-sm" role="status">
          <b>{done}</b> applied. Edit the blocks in <i>Links</i>, then press <b>Save</b>. Changed your mind? Undo with Ctrl+Z.
        </p>
      )}
      <TemplatePicker
        onUse={apply}
        useLabel="Use as the base of this page"
        note="Replaces your blocks and design (unsaved until you press Save). Settings, analytics and activity stay as they are."
        extra={(
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-soft p-3">
            <span className="text-sm"><b className="block text-[13px]">Keep my profile</b><span className="text-xs text-muted">Title, bio, picture and social icons.</span></span>
            <Toggle checked={keepProfile} onChange={setKeepProfile} label="Keep my profile" />
          </div>
        )}
      />
    </div>
  );
}
