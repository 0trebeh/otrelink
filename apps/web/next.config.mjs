/** @type {import('next').NextConfig} */
const nextConfig = {
  // The shared module system is plain ESM source; let Next compile it.
  transpilePackages: ['@otrelink/core'],
  // esbuild bundles the runtime of exported websites at request time (native binary).
  serverExternalPackages: ['esbuild'],
  images: { unoptimized: true },
  async headers() {
    return [
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
