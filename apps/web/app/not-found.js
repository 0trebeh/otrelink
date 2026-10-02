import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center p-6 text-center">
      <div>
        <p className="font-display text-6xl font-extrabold">404</p>
        <p className="text-muted mt-2 mb-6">This page doesn&apos;t exist or you don&apos;t have access to it.</p>
        <Link href="/dashboard" className="h-10 px-4 inline-flex items-center rounded-full bg-ink text-white text-sm font-semibold">Back to your pages</Link>
      </div>
    </main>
  );
}
