import './globals.css';
import { PwaRegister } from '@/components/Pwa';

export const metadata = {
  title: 'Otrelink — one link for everything you do',
  description: 'Build a customizable link-in-bio page in minutes.',
  applicationName: 'Otrelink',
  appleWebApp: { capable: true, title: 'Otrelink', statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/icons/icon.svg', type: 'image/svg+xml' }, { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  formatDetection: { telephone: false },
};

// "light dark" keeps the browser's forced dark mode away from the dashboard and its
// iframes (see globals.css); the dashboard itself always uses its light colors.
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#edeef1', colorScheme: 'light dark' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Keep the real colors: no recoloring by dark-mode extensions (Dark Reader). */}
        <meta name="darkreader-lock" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@500&display=swap"
        />
      </head>
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
