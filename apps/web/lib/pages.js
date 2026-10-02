// Page helpers shared by API routes.
import { sanitizePage } from '@otrelink/core';

/** Shape returned to the dashboard. */
export const toDashboardPage = (p) => ({
  id: p.id, slug: p.slug, profile: p.profile, socials: p.socials, blocks: p.blocks,
  design: p.design, settings: p.settings, createdAt: p.createdAt, updatedAt: p.updatedAt,
});

/** Shape returned to the public page app (no owner info). */
export const toPublicPage = (p) => {
  const clean = sanitizePage(p);
  return {
    id: p.id,
    slug: p.slug,
    ...clean,
    // Hide disabled blocks from the public payload entirely.
    blocks: clean.blocks.filter((b) => b.enabled),
  };
};
