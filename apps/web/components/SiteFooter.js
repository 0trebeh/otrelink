import Link from 'next/link';

export const LEGAL_LINKS = [
  ['/terms', 'Terms'],
  ['/privacy', 'Privacy'],
  ['/cookies', 'Cookies'],
  ['/refunds', 'Refunds'],
];

/** Small row of links to the legal documents. */
export function LegalLinks({ className = '' }) {
  return (
    <nav aria-label="Legal" className={`flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted ${className}`}>
      {LEGAL_LINKS.map(([href, label]) => <Link key={href} href={href} className="hover:text-ink underline-offset-2 hover:underline">{label}</Link>)}
    </nav>
  );
}

/** Footer of the public site (home, docs, legal pages). */
export default function SiteFooter() {
  return (
    <footer className="border-t border-line/70 mt-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted">
        <span>© {new Date().getFullYear()} Otrelink. Made in Orlando, Florida.</span>
        <LegalLinks className="sm:justify-end" />
      </div>
    </footer>
  );
}
