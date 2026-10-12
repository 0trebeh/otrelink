// Browser runtime for exported static sites (bundled to a classic script, so
// it also works when index.html is opened from disk with file://).
// The HTML is already rendered; this only adds behavior.
import { hydratePage, mountPage } from './render.js';
import { pickLanguage, pageLanguage } from './translate.js';

const page = globalThis.__OTRELINK_PAGE__;
const root = document.getElementById('app');
if (page && root) {
  // The HTML is in the page's own language; a visitor who prefers the second one gets it re-rendered.
  const lang = pickLanguage(page, window);
  if (lang !== pageLanguage(page)) mountPage(root, page, { mode: 'export', lang });
  else hydratePage(root, page, { mode: 'export' });
}
