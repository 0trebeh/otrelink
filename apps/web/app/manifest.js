// Web app manifest, served by Next.js at /manifest.webmanifest
export default function manifest() {
  return {
    id: '/dashboard',
    name: 'Otrelink',
    short_name: 'Otrelink',
    description: 'Build and edit your link-in-bio pages.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    orientation: 'any',
    background_color: '#edeef1',
    theme_color: '#edeef1',
    categories: ['productivity', 'social'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
    shortcuts: [
      { name: 'My pages', url: '/dashboard', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
    ],
  };
}
