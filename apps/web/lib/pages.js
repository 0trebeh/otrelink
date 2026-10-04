// Page helpers shared by API routes.
import { sanitizePage, stripPrivateFields } from '@otrelink/core';

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
    // Hide disabled blocks (at any depth) from the public payload entirely.
    // Private fields (e.g. a meeting link) never reach visitors through the page data.
    blocks: stripPrivateFields(onlyEnabled(clean.blocks)),
  };
};

function onlyEnabled(blocks) {
  return blocks.filter((b) => b.enabled).map((b) => (b.children ? { ...b, children: onlyEnabled(b.children) } : b));
}
