// Legal documents (Terms, Privacy, Cookies, Refunds): who runs the service,
// the current version of each document, and the consent records kept in the
// database when someone accepts them.
//
// Change a document → bump its date below. Accounts that accepted an older
// version see a banner in the dashboard asking them to review and accept again.
import { config } from './config.js';
import { clientIp } from './ip.js';

/** Version (= date of the last change, YYYY-MM-DD) of each document. */
export const LEGAL_VERSIONS = {
  terms: '2026-10-15',
  privacy: '2026-10-15',
  cookies: '2026-10-15',
  refunds: '2026-10-15',
};

/** Documents a new account must accept (the cookie and refund policies are part of them). */
export const REQUIRED_DOCS = ['terms', 'privacy'];

/** Minimum age to open an account. */
export const MIN_AGE = 18;

const clean = (v) => String(v || '').trim();

/** Operator details shown in the documents (set them in the environment before going live). */
export const legalInfo = () => ({
  entity: clean(process.env.LEGAL_ENTITY_NAME) || config.billingCompanyName || 'Otrelink',
  address: clean(process.env.LEGAL_ADDRESS) || 'Orlando, Florida, United States',
  email: clean(process.env.LEGAL_CONTACT_EMAIL) || config.businessContactEmail || '',
  dmcaEmail: clean(process.env.LEGAL_DMCA_EMAIL) || clean(process.env.LEGAL_CONTACT_EMAIL) || config.businessContactEmail || '',
  state: 'Florida',
  county: 'Orange County',
  minAge: MIN_AGE,
});

/** True when the account accepted every current required document. */
export function hasCurrentConsent(user) {
  const l = user?.legal || {};
  return REQUIRED_DOCS.every((d) => l[d] === LEGAL_VERSIONS[d]);
}

/**
 * Store a consent record (kept even if the account is deleted later: it is
 * the proof of what was accepted, when and from where) and return the patch
 * for user.legal.
 */
export async function recordConsent(db, req, { userId, email, method }) {
  const now = new Date().toISOString();
  const docs = { ...LEGAL_VERSIONS };
  await db.consents.record({
    userId,
    email,
    method, // 'signup' | 'update'
    documents: docs,
    acceptedAt: now,
    ip: clientIp(req),
    userAgent: String(req.headers.get('user-agent') || '').slice(0, 300),
  });
  return { legal: { ...docs, acceptedAt: now } };
}
