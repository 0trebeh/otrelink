// Page translation with the free Google Translate website widget
// (translate.google.com/translate_a/element.js). Otrelink stores nothing:
// the page says which language it is written in (Settings → Page language)
// and the ES / EN switch asks Google to translate it in the visitor's browser.
// Google remembers the choice in its "googtrans" cookie.
// Text inside translate="no" / .notranslate (prices, the switch) is left alone.

export const PAGE_LANGUAGES = {
  en: { label: 'English', short: 'EN' },
  es: { label: 'Español', short: 'ES' },
};

/** Language a page is written in. */
export const pageLanguage = (page) => (PAGE_LANGUAGES[page?.settings?.language] ? page.settings.language : 'en');
/** The other language the switch offers. */
export const otherLanguage = (lang) => (lang === 'es' ? 'en' : 'es');

const SCRIPT = 'https://translate.google.com/translate_a/element.js?cb=__olGoogleTranslate';
// Google's own bar, tooltips and spinner are hidden: the page has its own switch.
const HIDE_CSS = `.skiptranslate iframe,.goog-te-banner-frame,#goog-gt-tt,.goog-te-balloon-frame,.goog-te-spinner-pos,
iframe.VIpgJd-ZVi9od-ORHb-OEVmcd,.VIpgJd-ZVi9od-aZ2wEe-wOHMyf,.VIpgJd-yAWNEb-L7lbkb{display:none!important}
body{top:0!important;position:static!important}
font.VIpgJd-yAWNEb-VIpgJd-fmcmS-sn54Q,.goog-text-highlight{background:none!important;box-shadow:none!important}
#ol-gt{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}`;

/** Language Google is translating the page to right now (from its cookie), or ''. */
export function googleTarget(doc) {
  const m = String(doc?.cookie || '').match(/(?:^|;\s*)googtrans=\/[^/;]*\/([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

/** Load the widget once per document. Resolves with Google's hidden language <select>. */
function loadWidget(doc, source) {
  const win = doc.defaultView;
  if (win.__olGt) return win.__olGt;
  win.__olGt = new Promise((resolve, reject) => {
    const style = doc.createElement('style');
    style.textContent = HIDE_CSS;
    doc.head.append(style);
    const holder = doc.createElement('div');
    holder.id = 'ol-gt';
    holder.setAttribute('aria-hidden', 'true');
    doc.body.append(holder);
    win.__olGoogleTranslate = () => {
      try {
        // eslint-disable-next-line no-new
        new win.google.translate.TranslateElement({ pageLanguage: source, includedLanguages: Object.keys(PAGE_LANGUAGES).join(','), autoDisplay: false }, 'ol-gt');
      } catch (err) { reject(err); return; }
      // The <select> appears a moment later.
      let tries = 0;
      const wait = setInterval(() => {
        const select = doc.querySelector('#ol-gt select.goog-te-combo');
        if (select || ++tries > 100) { clearInterval(wait); select ? resolve(select) : reject(new Error('Google Translate did not start')); }
      }, 100);
    };
    const s = doc.createElement('script');
    s.src = SCRIPT;
    s.async = true;
    s.onerror = () => { win.__olGt = null; reject(new Error('Google Translate could not be loaded')); };
    doc.head.append(s);
  });
  return win.__olGt;
}

/** Pick a language in Google's widget. */
function choose(select, lang) {
  select.value = lang;
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

/** Back to the original text: Google's "Show original", else clear its cookie and reload. */
function showOriginal(doc) {
  const frame = doc.querySelector('iframe.goog-te-banner-frame, iframe.VIpgJd-ZVi9od-ORHb-OEVmcd');
  const btn = frame?.contentDocument?.querySelector('[id$=".restore"], button');
  if (btn) { btn.click(); return; }
  const host = doc.defaultView.location.hostname;
  const expired = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  doc.cookie = expired;
  if (host) {
    doc.cookie = `${expired}; domain=${host}`;
    doc.cookie = `${expired}; domain=.${host.split('.').slice(-2).join('.')}`;
  }
  doc.defaultView.location.reload();
}

/**
 * Wire the language switch of a rendered page. Returns a cleanup function.
 * Google translates the whole document, including text that blocks add later.
 */
export function setupTranslate(container, page) {
  const nav = container.querySelector('.ol-root .ol-lang');
  const doc = container.ownerDocument;
  if (!nav || !doc?.defaultView) return () => {};
  const source = pageLanguage(page);
  const target = otherLanguage(source);
  const buttons = [...nav.querySelectorAll('[data-ol-lang]')];
  const setPressed = (lang) => buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.olLang === lang)));
  const busy = (on) => nav.toggleAttribute('aria-busy', on);

  // A visitor who translated before: Google translates again on load (its cookie).
  const remembered = googleTarget(doc) === target;
  if (remembered) {
    setPressed(target);
    loadWidget(doc, source).catch(() => setPressed(source));
  }

  const onClick = async (e) => {
    const b = e.target.closest('[data-ol-lang]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    const lang = b.dataset.olLang;
    if (lang === source) {
      if (googleTarget(doc) === target || b.getAttribute('aria-pressed') !== 'true') { setPressed(source); showOriginal(doc); }
      return;
    }
    busy(true);
    setPressed(target);
    try {
      choose(await loadWidget(doc, source), target);
    } catch (err) {
      console.warn('[otrelink]', err.message);
      setPressed(source);
    } finally {
      busy(false);
    }
  };
  nav.addEventListener('click', onClick);
  return () => nav.removeEventListener('click', onClick);
}
