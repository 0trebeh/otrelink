/** @type {import('next').NextConfig} */
const nextConfig = {
  // The shared module system is plain ESM source; let Next compile it.
  transpilePackages: ['@otrelink/core'],
  // esbuild bundles the runtime of exported websites at request time (native binary).
  serverExternalPackages: ['esbuild'],
  images: { unoptimized: true },
  poweredByHeader: false,
  async headers() {
    // Security headers for the dashboard, landing and API.
    const security = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
    ];
    // No other site may show these pages in a frame (stops clickjacking).
    const noFraming = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
    ];
    return [
      { source: '/:path*', headers: security },
      // Uploaded files (PDFs, images) can be shown inside the public pages, so they are excluded.
      // The dashboard's phone preview frame may only be framed by the dashboard itself.
      { source: '/((?!api/assets/|preview-frame\\.html).*)', headers: noFraming },
      {
        source: '/preview-frame.html',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'" },
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
