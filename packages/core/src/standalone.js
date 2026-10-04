// Browser runtime for exported static sites (bundled to a classic script, so
// it also works when index.html is opened from disk with file://).
// The HTML is already rendered; this only adds behavior.
import { hydratePage } from './render.js';

const page = globalThis.__OTRELINK_PAGE__;
const root = document.getElementById('app');
if (page && root) hydratePage(root, page, { mode: 'export' });
