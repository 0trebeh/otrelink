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

// The dashboard is designed in light colors: don't let the browser's dark mode repaint it.
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#edeef1', colorScheme: 'only light' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
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
