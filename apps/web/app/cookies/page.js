import Link from 'next/link';
import LegalPage, { Contact } from '@/components/legal/LegalPage';
import { LEGAL_VERSIONS } from '@/lib/legal';

export const metadata = { title: 'Cookie Policy — Otrelink', description: 'The cookies and browser storage Otrelink uses, and why.' };

const OWN = [
  ['ol_session', 'Cookie', 'Dashboard', 'Keeps you signed in. Secure, HTTP-only, not readable by scripts.', 'Strictly necessary', '30 days'],
  ['ol-dashboard-theme', 'Local storage', 'Dashboard', 'Remembers light or dark mode, if you choose one.', 'Preference you set', 'Until you clear it'],
  ['ol-ref', 'Local storage', 'Sign-up page', 'Remembers the referral code of the invitation link you opened, so the friend who invited you gets credit.', 'Feature you asked for', '30 days'],
  ['Offline cache', 'Service worker', 'Dashboard', 'Lets the dashboard open faster and show an offline screen.', 'Strictly necessary', 'Until updated'],
  ['ol_v', 'Local storage', 'Otrelink pages', 'A random ID so the page owner’s statistics count a returning visitor once. Not set for visitors in the EEA, UK or Switzerland, or with Global Privacy Control on.', 'Statistics', 'Until you clear it'],
  ['ol_geo', 'Session storage', 'Otrelink pages', 'Remembers your approximate location while the tab is open (up to one hour), so the geolocation service is not called on every page. Not set in the cases above.', 'Statistics', 'Until the tab is closed (1 hour max)'],
];

export default function CookiesPage() {
  return (
    <LegalPage path="/cookies" title="Cookie Policy" version={LEGAL_VERSIONS.cookies}
      intro="Otrelink uses very few cookies and similar technologies (local storage and a service worker). There is no advertising and no cross-site tracking. This page lists everything we store, why, and how to control it.">
      <h2>1. What we store</h2>
      <div className="overflow-x-auto">
        <table>
          <thead><tr><th>Name</th><th>Type</th><th>Where</th><th>Purpose</th><th>Category</th><th>Kept for</th></tr></thead>
          <tbody>{OWN.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{i === 0 ? <code>{c}</code> : c}</td>)}</tr>)}</tbody>
        </table>
      </div>

      <h2>2. Third parties</h2>
      <ul>
        <li><strong>Payments:</strong> when you subscribe you are sent to Stripe or PayPal, which use their own cookies for security and fraud prevention on their pages.</li>
        <li><strong>Content on pages:</strong> page owners can add videos, music, maps and other embeds (YouTube, Spotify, Google Maps, SoundCloud and more). Those services may set their own cookies when the embed loads. YouTube videos use YouTube’s privacy-enhanced mode.</li>
        <li><strong>Fonts and map tiles</strong> are loaded from Google Fonts, OpenStreetMap or Esri, which receive your IP address but do not set cookies through Otrelink.</li>
        <li><strong>IP geolocation</strong> (GeoJS, ipwho.is, ipapi.co) is contacted without cookies, as described in the <Link href="/privacy">Privacy Policy</Link>.</li>
      </ul>

      <h2>3. Do we ask for permission?</h2>
      <p>Otrelink is based in Florida. U.S. federal law and Florida law do not require consent before using cookies; they require that we tell you what we use, which this page does.</p>
      <p>Visitors in the European Economic Area, the United Kingdom and Switzerland have stricter rules, which require consent for anything that is not strictly necessary. For them, Otrelink only uses strictly necessary storage: on Otrelink pages the statistics ID (<code>ol_v</code>) and the location cache (<code>ol_geo</code>) are not used. That is why we do not show a cookie banner. Embeds added by page owners are the page owner’s responsibility.</p>
      <p>Your browser’s Global Privacy Control signal is treated the same way, wherever you are.</p>

      <h2>4. How to control them</h2>
      <ul>
        <li>Every browser lets you see and delete cookies and site data, and block them for a site. Blocking <code>ol_session</code> will stop you from signing in; blocking the others does not break anything.</li>
        <li>Turn on Global Privacy Control in your browser (or an extension) to stop the visitor ID and geolocation on Otrelink pages.</li>
      </ul>

      <h2>5. Changes and contact</h2>
      <p>We update this list when we add or remove something. Questions: <Contact />.</p>
    </LegalPage>
  );
}
