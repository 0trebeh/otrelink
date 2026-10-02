import { Logo } from '@/components/ui';
import ReloadButton from './ReloadButton';

export const metadata = { title: 'Offline — Otrelink' };
export const dynamic = 'force-static';

export default function Offline() {
  return (
    <main className="min-h-screen grid place-items-center p-6 text-center">
      <div className="max-w-sm">
        <Logo />
        <h1 className="font-display text-3xl font-extrabold tracking-tight mt-8">You&apos;re offline</h1>
        <p className="text-muted mt-2 mb-6">Otrelink needs a connection to load and save your pages. Reconnect and try again.</p>
        <ReloadButton />
      </div>
    </main>
  );
}
