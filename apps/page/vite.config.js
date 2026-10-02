import { defineConfig } from 'vite';

// Every path (/username) serves index.html; main.js reads the slug from the URL.
export default defineConfig({
  appType: 'spa',
  build: { target: 'es2020' },
});
