// Survey block: a button that opens a form with your questions. Answers are
// sent to the API (/api/public/survey) and show up in the dashboard
// (Responses), where you can see a summary and download a CSV.
import { esc } from '../util/html.js';
import { icon } from '../icons.js';
import { QUESTION_TYPES, CHOICE_TYPES, MAX_QUESTIONS, optionsOf } from '../survey.js';

const STAR = '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="m12 2.8 2.8 5.7 6.3.9-4.55 4.43 1.07 6.27L12 17.13 6.38 20.1l1.07-6.27L2.9 9.4l6.3-.9z"/></svg>';

function questionHtml(q, i, uid) {
  const name = `q_${esc(q.id)}`;
  const id = `${uid}-${esc(q.id)}`;
  const req = q.required ? ' required' : '';
  const label = `${esc(q.label)}${q.required ? '<span class="ol-survey-req" aria-hidden="true"> *</span>' : ''}`;
  const hint = q.hint ? `<p class="ol-survey-hint" id="${id}-hint">${esc(q.hint)}</p>` : '';
  const desc = q.hint ? ` aria-describedby="${id}-hint"` : '';
  const opts = optionsOf(q);
  const wrap = (inner, group = true) => (group
    ? `<fieldset class="ol-survey-q" data-q="${esc(q.id)}" data-type="${esc(q.type)}"${q.required ? ' data-required' : ''}><legend class="ol-survey-label">${label}</legend>${hint}${inner}</fieldset>`
    : `<div class="ol-survey-q" data-q="${esc(q.id)}" data-type="${esc(q.type)}"${q.required ? ' data-required' : ''}><label class="ol-survey-label" for="${id}">${label}</label>${hint}${inner}</div>`);
  const pill = (type, value, text, n) => `<label class="ol-survey-opt"><input type="${type}" name="${name}" value="${esc(value)}"${type === 'radio' && n === 0 ? req : ''}><span>${esc(text)}</span></label>`;

  switch (q.type) {
    case 'long':
      return wrap(`<textarea id="${id}" name="${name}" maxlength="5000" rows="3"${req}${desc}></textarea>`, false);
    case 'email':
    case 'number':
    case 'date':
    case 'short': {
      const type = { email: 'email', number: 'number', date: 'date', short: 'text' }[q.type];
      const extra = q.type === 'number' ? ' step="any" inputmode="decimal"' : q.type === 'short' ? ' maxlength="500"' : q.type === 'email' ? ' autocomplete="email"' : '';
      return wrap(`<input id="${id}" type="${type}" name="${name}"${extra}${req}${desc}>`, false);
    }
    case 'dropdown':
      return wrap(`<select id="${id}" name="${name}"${req}${desc}><option value="">Choose…</option>${opts.map((o) => `<option>${esc(o)}</option>`).join('')}</select>`, false);
    case 'single':
      return wrap(`<div class="ol-survey-opts">${opts.map((o, n) => pill('radio', o, o, n)).join('')}</div>`);
    case 'multiple':
      return wrap(`<div class="ol-survey-opts">${opts.map((o, n) => pill('checkbox', o, o, n)).join('')}</div>`);
    case 'yesno':
      return wrap(`<div class="ol-survey-opts ol-survey-yesno">${pill('radio', 'yes', 'Yes', 0)}${pill('radio', 'no', 'No', 1)}</div>`);
    case 'scale':
      return wrap(`<div class="ol-survey-scale">${Array.from({ length: 11 }, (_, n) => pill('radio', n, n, n)).join('')}</div>`
        + '<div class="ol-survey-scale-ends" aria-hidden="true"><span>Not likely</span><span>Very likely</span></div>');
    case 'rating':
      // Reversed order + row-reverse lets CSS fill the stars up to the hovered/checked one.
      return wrap(`<div class="ol-survey-stars">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" id="${id}-${n}" name="${name}" value="${n}"${n === 5 ? req : ''}>`
        + `<label for="${id}-${n}" title="${n} of 5"><span class="ol-sr">${n} of 5</span>${STAR}</label>`).join('')}</div>`);
    default:
      return '';
  }
}

export default {
  type: 'survey',
  label: 'Survey',
  description: 'A button that opens a form with your questions. See the answers in Responses.',
  icon: 'survey',
  category: 'Contact',
  cssClasses: [
    { selector: '.ol-survey', description: 'Wrapper (details element, [open] when expanded)' },
    { selector: '.ol-survey > .ol-btn', description: 'The survey button' },
    { selector: '.ol-survey-card', description: 'Card with the form' },
    { selector: '.ol-survey-title', description: 'Title inside the card' },
    { selector: '.ol-survey-intro', description: 'Intro text' },
    { selector: '.ol-survey-q', description: 'One question ([data-type] = short, long, single, multiple, dropdown, rating, scale, yesno, email, number, date)' },
    { selector: '.ol-survey-label', description: 'Question text' },
    { selector: '.ol-survey-opt', description: 'One option (choices, yes/no, scale)' },
    { selector: '.ol-survey-stars', description: 'Star rating' },
    { selector: '.ol-survey-submit', description: 'Send button' },
    { selector: '.ol-survey-done', description: 'Thank-you message' },
  ],
  fields: [
    { key: 'buttonLabel', type: 'text', label: 'Button text', default: 'Take the survey' },
    { key: 'description', type: 'text', label: 'Button subtitle (optional)', placeholder: 'It takes 1 minute' },
    { key: 'title', type: 'text', label: 'Title inside the form (optional)', max: 120 },
    { key: 'intro', type: 'textarea', label: 'Intro text (optional)', max: 1000 },
    { key: 'questions', type: 'list', label: 'Questions', itemLabel: 'question', max: MAX_QUESTIONS, fields: [
      { key: 'label', type: 'text', label: 'Question', required: true, max: 200 },
      { key: 'type', type: 'select', label: 'Answer type', default: 'short', options: QUESTION_TYPES },
      { key: 'options', type: 'textarea', label: 'Options', max: 3000, help: 'One option per line.', showIf: { key: 'type', in: CHOICE_TYPES } },
      { key: 'hint', type: 'text', label: 'Help text (optional)', max: 200 },
      { key: 'required', type: 'toggle', label: 'Required', default: false },
    ], default: [
      { id: 'q1', label: 'How did you find me?', type: 'single', options: 'Instagram\nTikTok\nA friend\nOther', hint: '', required: true },
      { id: 'q2', label: 'How would you rate my content?', type: 'rating', options: '', hint: '', required: true },
      { id: 'q3', label: 'What would you like to see next?', type: 'long', options: '', hint: '', required: false },
    ] },
    { key: 'submitLabel', type: 'text', label: 'Send button text', default: 'Send' },
    { key: 'successMessage', type: 'text', label: 'Message after sending', default: 'Thanks for your answers!' },
    { key: 'oneResponse', type: 'toggle', label: 'One response per device', default: true, help: 'Hides the form after a visitor answers (it can be bypassed, not a strict limit).' },
    { key: 'notify', type: 'toggle', label: 'Notify me of new responses', default: true, help: 'Push notification on your devices (turn it on in Responses or Agenda).' },
    { key: 'startOpen', type: 'toggle', label: 'Show the form open', default: false },
  ],
  summary: (d) => `${d.questions.length} question${d.questions.length === 1 ? '' : 's'}`,
  render(d, ctx) {
    const label = esc(d.buttonLabel || 'Take the survey');
    const sub = d.description ? `<span class="ol-btn-sub">${esc(d.description)}</span>` : '';
    if (ctx.mode === 'export') {
      // Exported sites have no server: link to the live page.
      return ctx.liveUrl
        ? `<a class="ol-btn has-media" href="${esc(ctx.liveUrl)}" target="_blank" rel="noopener"><span class="ol-btn-icon">${icon('survey', 20)}</span>`
          + `<span class="ol-btn-label"><span class="ol-btn-title">${label}</span><span class="ol-btn-sub">Opens the online survey</span></span><span class="ol-btn-spacer"></span></a>`
        : '';
    }
    const uid = `ols-${esc(ctx.blockId)}`;
    const questions = (d.questions || []).filter((q) => q.label && (!CHOICE_TYPES.includes(q.type) || optionsOf(q).length));
    return `<details class="ol-survey"${d.startOpen ? ' open' : ''}>`
      + `<summary class="ol-btn has-media" data-ol-track="${esc(ctx.blockId)}"><span class="ol-btn-icon">${icon('survey', 20)}</span>`
      + `<span class="ol-btn-label"><span class="ol-btn-title">${label}</span>${sub}</span>`
      + `<span class="ol-btn-icon ol-survey-chevron">${icon('chevron', 18)}</span></summary>`
      + `<div class="ol-card ol-survey-card" data-api="${esc(ctx.apiBase)}" data-page="${esc(ctx.page?.id || '')}" data-block="${esc(ctx.blockId)}" data-mode="${esc(ctx.mode)}">`
      + (d.title ? `<p class="ol-survey-title">${esc(d.title)}</p>` : '')
      + (d.intro ? `<p class="ol-survey-intro">${esc(d.intro)}</p>` : '')
      + (questions.length
        ? `<form class="ol-survey-form" novalidate>${questions.map((q, i) => questionHtml(q, i, uid)).join('')}`
          + '<input name="website" class="ol-survey-hp" tabindex="-1" autocomplete="off" aria-hidden="true">'
          + '<p class="ol-survey-error" role="alert" hidden></p>'
          + `<button type="submit" class="ol-survey-submit">${esc(d.submitLabel || 'Send')}</button>`
          + (ctx.mode === 'preview' ? '<p class="ol-survey-note">Sending is disabled in the dashboard preview.</p>' : '')
          + '</form>'
        : '<p class="ol-survey-note">No questions yet.</p>')
      + '</div></details>';
  },
  hydrate(el, data) {
    const card = el.querySelector(':scope > .ol-survey > .ol-survey-card');
    const form = card?.querySelector('.ol-survey-form');
    if (!form) return;
    surveyApp(el.ownerDocument, card, form, data);
  },
  css: `.ol-root .ol-survey>summary{list-style:none}
.ol-root .ol-survey>summary::-webkit-details-marker{display:none}
.ol-root .ol-survey-chevron{transition:transform .2s}
.ol-root .ol-survey[open]>summary .ol-survey-chevron{transform:rotate(180deg)}
.ol-root .ol-survey-card{margin-top:8px;padding:18px 16px;text-align:left;display:flex;flex-direction:column;gap:12px;animation:ol-survey-in .2s ease}
@keyframes ol-survey-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.ol-root .ol-survey-title{margin:0;font-weight:800;font-size:1.15em}
.ol-root .ol-survey-intro{margin:0;font-size:.92em;opacity:.8;white-space:pre-line}
.ol-root .ol-survey-form{display:flex;flex-direction:column;gap:16px}
.ol-root .ol-survey-q{border:0;margin:0;padding:0;min-width:0;display:flex;flex-direction:column;gap:8px}
.ol-root .ol-survey-label{padding:0;font-weight:700;font-size:.95em}
.ol-root .ol-survey-req{opacity:.55}
.ol-root .ol-survey-hint,.ol-root .ol-survey-note{margin:0;font-size:.82em;opacity:.7}
.ol-root .ol-survey-q.is-invalid .ol-survey-label{color:#dc2626}
.ol-root .ol-survey-qerr,.ol-root .ol-survey-error{margin:0;font-size:.82em;color:#dc2626}
.ol-root .ol-survey-form :is(input[type=text],input[type=email],input[type=number],input[type=date],textarea,select){font:inherit;color:var(--ol-surface-fg);background:transparent;border:1.5px solid color-mix(in srgb,var(--ol-surface-fg) 18%,transparent);border-radius:10px;padding:10px 12px;width:100%;box-sizing:border-box;min-height:44px}
.ol-root .ol-survey-form select option{color:#111}
.ol-root .ol-survey-form textarea{resize:vertical;min-height:80px}
.ol-root .ol-survey-form :is(input,textarea,select):focus-visible{outline:2px solid var(--ol-surface-fg);outline-offset:1px}
.ol-root .ol-survey-opts{display:flex;flex-direction:column;gap:6px}
.ol-root .ol-survey-yesno{flex-direction:row}
.ol-root .ol-survey-yesno .ol-survey-opt{flex:1;justify-content:center}
.ol-root .ol-survey-opt{position:relative;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;border:1.5px solid color-mix(in srgb,var(--ol-surface-fg) 15%,transparent);cursor:pointer;font-size:.95em}
.ol-root .ol-survey-opt input{margin:0;accent-color:var(--ol-surface-fg);width:18px;height:18px;flex:none}
.ol-root .ol-survey-opt:has(input:checked){border-color:var(--ol-surface-fg);background:color-mix(in srgb,var(--ol-surface-fg) 7%,transparent)}
.ol-root .ol-survey-opt:has(input:focus-visible){outline:2px solid var(--ol-surface-fg);outline-offset:1px}
.ol-root .ol-survey-scale{display:grid;grid-template-columns:repeat(11,minmax(0,1fr));gap:4px}
.ol-root .ol-survey-scale .ol-survey-opt{padding:9px 0;justify-content:center;font-weight:700;font-variant-numeric:tabular-nums;border-radius:9px;font-size:.85em}
.ol-root .ol-survey-scale .ol-survey-opt input{position:absolute;opacity:0;pointer-events:none}
.ol-root .ol-survey-scale .ol-survey-opt:has(input:checked){background:var(--ol-surface-fg);color:var(--ol-surface)}
.ol-root .ol-survey-scale-ends{display:flex;justify-content:space-between;font-size:.75em;opacity:.6}
.ol-root .ol-survey-stars{display:flex;flex-direction:row-reverse;justify-content:flex-end;gap:2px}
.ol-root .ol-survey-stars input{position:absolute;opacity:0;width:1px;height:1px}
.ol-root .ol-survey-stars label{cursor:pointer;color:color-mix(in srgb,var(--ol-surface-fg) 22%,transparent);transition:color .12s,transform .12s;line-height:0;padding:2px;border-radius:6px}
.ol-root .ol-survey-stars input:checked~label,.ol-root .ol-survey-stars label:hover,.ol-root .ol-survey-stars label:hover~label{color:#f5b301}
.ol-root .ol-survey-stars label:hover{transform:scale(1.1)}
.ol-root .ol-survey-stars input:focus-visible+label{outline:2px solid var(--ol-surface-fg)}
.ol-root .ol-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.ol-root .ol-survey-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.ol-root .ol-survey-submit{font:inherit;cursor:pointer;border:0;border-radius:999px;min-height:46px;font-weight:700;background:var(--ol-surface-fg);color:var(--ol-surface)}
.ol-root .ol-survey-submit[disabled]{opacity:.5;cursor:default}
.ol-root .ol-survey-done{text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px;padding:8px 0}
.ol-root .ol-survey-done-icon{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:color-mix(in srgb,var(--ol-surface-fg) 9%,transparent)}
.ol-root .ol-survey-done strong{font-size:1.05em}`,
};

// ── Browser behavior ─────────────────────────────────────────────────────
function surveyApp(doc, card, form, data) {
  const api = card.dataset.api || '';
  const blockId = card.dataset.block;
  const preview = card.dataset.mode === 'preview';
  const storeKey = `ol-survey:${card.dataset.page}:${blockId}`;
  const errorBox = form.querySelector('.ol-survey-error');
  const button = form.querySelector('.ol-survey-submit');

  const showDone = (again) => {
    card.textContent = '';
    const box = doc.createElement('div');
    box.className = 'ol-survey-done';
    box.setAttribute('role', 'status');
    box.innerHTML = `<span class="ol-survey-done-icon">${icon('check', 22)}</span><strong></strong>`;
    box.querySelector('strong').textContent = again ? 'You already answered this survey. Thank you!' : (data.successMessage || 'Thanks for your answers!');
    card.append(box);
  };

  if (!preview && data.oneResponse) {
    try { if (localStorage.getItem(storeKey)) { showDone(true); return; } } catch { /* storage blocked */ }
  }

  const setError = (msg) => { errorBox.textContent = msg; errorBox.hidden = !msg; };
  const markInvalid = (qEl, msg) => {
    qEl.classList.add('is-invalid');
    let p = qEl.querySelector('.ol-survey-qerr');
    if (!p) { p = doc.createElement('p'); p.className = 'ol-survey-qerr'; qEl.append(p); }
    p.textContent = msg;
  };
  form.addEventListener('input', (e) => {
    const qEl = e.target.closest('.ol-survey-q');
    if (qEl?.classList.contains('is-invalid')) { qEl.classList.remove('is-invalid'); qEl.querySelector('.ol-survey-qerr')?.remove(); }
  });

  const collect = () => {
    const fd = new FormData(form);
    const answers = {};
    let firstBad = null;
    for (const qEl of form.querySelectorAll('.ol-survey-q')) {
      const id = qEl.dataset.q;
      const values = fd.getAll(`q_${id}`).map((v) => String(v).trim()).filter(Boolean);
      answers[id] = qEl.dataset.type === 'multiple' ? values : (values[0] || '');
      const field = qEl.querySelector('input:not([type=radio]):not([type=checkbox]),textarea,select');
      let msg = '';
      if (qEl.hasAttribute('data-required') && !values.length) msg = 'This question is required.';
      else if (field && values.length && !field.checkValidity()) msg = qEl.dataset.type === 'email' ? 'Enter a valid email.' : 'Check this answer.';
      if (msg) { markInvalid(qEl, msg); firstBad ||= qEl; }
    }
    return { answers, website: fd.get('website') || '', firstBad };
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setError('');
    const { answers, website, firstBad } = collect();
    if (firstBad) { firstBad.querySelector('input,textarea,select')?.focus(); return; }
    if (preview) { setError('Sending is disabled in the dashboard preview.'); return; }
    button.disabled = true;
    const label = button.textContent;
    button.textContent = 'Sending…';
    try {
      // text/plain keeps it a "simple" CORS request (no preflight).
      const res = await fetch(`${api}/api/public/survey`, {
        method: 'POST', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ pageId: card.dataset.page, blockId, answers, website }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 422 && json.errors?.length) {
        for (const er of json.errors) {
          const qEl = [...form.querySelectorAll('.ol-survey-q')].find((q) => q.dataset.q === er.id);
          if (qEl) markInvalid(qEl, er.message);
        }
        throw new Error('Check the highlighted answers.');
      }
      if (!res.ok) throw new Error(json.error === 'too_many_requests' ? 'Too many attempts. Try again later.' : 'Could not send. Try again.');
      if (data.oneResponse) { try { localStorage.setItem(storeKey, String(Date.now())); } catch { /* ignore */ } }
      showDone(false);
    } catch (err) {
      setError(err.message);
      button.disabled = false;
      button.textContent = label;
    }
  });
}
