import Link from 'next/link';
import { Logo } from '@/components/ui';
import SiteFooter, { LEGAL_LINKS } from '@/components/SiteFooter';
import { legalInfo } from '@/lib/legal';

const fmt = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

/** Shared frame of the legal documents: header, tabs between documents, date, readable column. */
export default function LegalPage({ path, title, version, intro, children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between h-16 px-4 sm:px-8 max-w-6xl w-full mx-auto">
        <Link href="/"><Logo /></Link>
        <Link href="/register" className="h-10 px-4 inline-flex items-center rounded-full bg-ink text-white text-sm font-semibold">Sign up free</Link>
      </header>
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-8 pt-6 pb-16">
        <nav aria-label="Legal documents" className="flex flex-wrap gap-2 mb-8">
          {LEGAL_LINKS.map(([href, label]) => (
            <Link key={href} href={href} aria-current={href === path ? 'page' : undefined}
              className={`h-9 px-4 inline-flex items-center rounded-full text-sm font-semibold ${href === path ? 'bg-ink text-white' : 'bg-panel hover:bg-soft'}`}>{label}</Link>
          ))}
        </nav>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-sm text-muted mt-3">Last updated: {fmt(version)} · Version {version}</p>
        {intro && <p className="text-lg mt-6 leading-relaxed">{intro}</p>}
        <div className="legal-doc mt-8">{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

/** Contact line: the configured email, or a clear note while it is not set. */
export function Contact({ dmca = false }) {
  const info = legalInfo();
  const email = dmca ? info.dmcaEmail : info.email;
  if (email) return <a href={`mailto:${email}`}>{email}</a>;
  return process.env.NODE_ENV === 'production'
    ? <span>the contact details in your account settings</span>
    : <span className="text-danger">[set LEGAL_CONTACT_EMAIL]</span>;
}

export const Operator = () => {
  const info = legalInfo();
  return <>{info.entity}, {info.address}</>;
};
