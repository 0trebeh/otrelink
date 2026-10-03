import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { blockTypes, themes, wallpapers, buttonStyles, fonts, socials } from '@otrelink/core';
import { Logo } from '@/components/ui';
import LandingDemo from '@/components/LandingDemo';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getUser();
  const counts = [
    [blockTypes.list().length, 'block types'],
    [themes.list().length, 'themes'],
    [wallpapers.list().length, 'wallpaper styles'],
    [buttonStyles.list().length, 'button styles'],
    [fonts.list().length, 'fonts'],
    [socials.list().length, 'social platforms'],
  ];
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between h-16 px-4 sm:px-8 max-w-6xl mx-auto">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/docs" className="h-10 px-4 inline-flex items-center rounded-full text-sm font-semibold hover:bg-panel">Docs</Link>
          {user ? (
            <Link href="/dashboard" className="h-10 px-4 inline-flex items-center rounded-full bg-ink text-white text-sm font-semibold">Open dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="h-10 px-4 inline-flex items-center rounded-full text-sm font-semibold hover:bg-panel">Log in</Link>
              <Link href="/register" className="h-10 px-4 inline-flex items-center rounded-full bg-ink text-white text-sm font-semibold">Sign up free</Link>
            </>
          )}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-10 pb-20 grid lg:grid-cols-[1fr_auto] gap-14 items-center">
        <div>
          <h1 className="font-display font-extrabold tracking-[-0.03em] leading-[0.95] text-[clamp(2.75rem,7vw,5.5rem)] max-w-[11ch]">
            One link for everything you make.
          </h1>
          <p className="text-lg text-muted mt-6 max-w-[46ch]">
            Put your shop, videos, music, events and socials on one page. Change every color, font and button until it looks like you.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href={user ? '/dashboard' : '/register'} className="h-12 px-6 inline-flex items-center rounded-full bg-accent text-white font-semibold hover:bg-accent-ink">
              {user ? 'Go to your pages' : 'Claim your link'}
            </Link>
          </div>
          <dl className="grid grid-cols-3 gap-x-6 gap-y-4 mt-14 max-w-md">
            {counts.map(([n, label]) => (
              <div key={label}>
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="font-display text-2xl font-bold">{n}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="dot-canvas rounded-[48px] p-8 justify-self-center">
          <LandingDemo />
        </div>
      </main>
    </div>
  );
}
