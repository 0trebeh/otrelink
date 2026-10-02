import { defineConfig } from 'vite';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

// VITE_BASE: sub-path where the site is served.
//   "/" for a custom domain or Render/Netlify, "/otrelink/" for GitHub Pages.
const base = process.env.VITE_BASE || '/';

// Static hosts without rewrites (GitHub Pages) serve 404.html for unknown
// paths like /otrelink/username, so 404.html is a copy of the app.
const spaFallback = () => ({
  name: 'otrelink-spa-404',
  apply: 'build',
  closeBundle() {
    const dist = resolve(import.meta.dirname, 'dist');
    copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'));
  },
});

export default defineConfig({
  base,
  appType: 'spa',
  build: { target: 'es2020' },
  plugins: [spaFallback()],
});
