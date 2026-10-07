// Country names and flags for Analytics.
let names;
try { names = new Intl.DisplayNames(['en'], { type: 'region' }); } catch { names = null; }

export const countryName = (cc) => {
  if (!cc) return '';
  try { return names?.of(cc.toUpperCase()) || cc; } catch { return cc; }
};

/** Emoji flag for a 2-letter country code. */
export const flag = (cc) => (/^[A-Za-z]{2}$/.test(cc || '')
  ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
  : '🌐');
