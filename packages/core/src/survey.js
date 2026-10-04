// Survey helpers shared by the Survey block (browser) and the API (server).
// Answers are always validated on the server against the block's current questions.

export const QUESTION_TYPES = [
  { value: 'short', label: 'Short answer' },
  { value: 'long', label: 'Paragraph' },
  { value: 'single', label: 'One choice' },
  { value: 'multiple', label: 'Checkboxes (several choices)' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'rating', label: 'Rating (1–5 stars)' },
  { value: 'scale', label: 'Scale (0–10)' },
  { value: 'yesno', label: 'Yes / No' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
];

export const CHOICE_TYPES = ['single', 'multiple', 'dropdown'];
export const MAX_QUESTIONS = 30;

/** Options of a choice question (one per line in the dashboard). */
export const optionsOf = (q) => [...new Set(String(q?.options || '').split('\n').map((s) => s.trim().slice(0, 120)).filter(Boolean))].slice(0, 30);

const isEmpty = (v) => v === '' || v == null || (Array.isArray(v) && !v.length);
const text = (v, max) => String(v ?? '').replace(/\r\n/g, '\n').trim().slice(0, max);

/**
 * Clean one answer. Returns { value } (value is '' / [] when unanswered)
 * or { error } when the answer is not valid for the question.
 */
export function cleanAnswer(q, raw) {
  const one = Array.isArray(raw) ? raw[0] : raw;
  if (isEmpty(raw)) return { value: q.type === 'multiple' ? [] : '' };
  switch (q.type) {
    case 'short': return { value: text(one, 500).replace(/\n+/g, ' ') };
    case 'long': return { value: text(one, 5000) };
    case 'email': {
      const v = text(one, 254).toLowerCase();
      return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v) ? { value: v } : { error: 'Enter a valid email.' };
    }
    case 'number': {
      const n = Number(String(one).replace(',', '.'));
      return Number.isFinite(n) ? { value: n } : { error: 'Enter a number.' };
    }
    case 'date': {
      const v = String(one).trim();
      return /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) ? { value: v } : { error: 'Enter a valid date.' };
    }
    case 'single':
    case 'dropdown': {
      const v = String(one).trim();
      return optionsOf(q).includes(v) ? { value: v } : { error: 'Pick one of the options.' };
    }
    case 'multiple': {
      const opts = optionsOf(q);
      const list = (Array.isArray(raw) ? raw : [raw]).map((v) => String(v).trim());
      if (list.some((v) => !opts.includes(v))) return { error: 'Pick from the options.' };
      return { value: opts.filter((o) => list.includes(o)) }; // keep the owner's order, no duplicates
    }
    case 'rating':
    case 'scale': {
      const n = Number(one);
      const [min, max] = q.type === 'rating' ? [1, 5] : [0, 10];
      return Number.isInteger(n) && n >= min && n <= max ? { value: n } : { error: 'Pick a value.' };
    }
    case 'yesno': {
      const v = String(one).toLowerCase();
      return v === 'yes' || v === 'no' ? { value: v } : { error: 'Pick yes or no.' };
    }
    default: return { error: 'Unknown question.' };
  }
}

/**
 * Validate a submission against the questions.
 * input: { [questionId]: string | string[] | number }
 * → { answers: [{ id, label, type, value }], errors: [{ id, message }] }
 * Labels are copied into the answers so old responses still make sense after edits.
 */
export function validateAnswers(questions = [], input = {}) {
  const answers = [];
  const errors = [];
  for (const q of questions.slice(0, MAX_QUESTIONS)) {
    if (!q?.id || !q.label) continue;
    const res = cleanAnswer(q, input?.[q.id]);
    if (res.error) { errors.push({ id: q.id, message: res.error }); continue; }
    if (q.required && isEmpty(res.value)) { errors.push({ id: q.id, message: 'This question is required.' }); continue; }
    answers.push({ id: q.id, label: q.label, type: q.type, value: res.value });
  }
  return { answers, errors };
}

/** Text version of an answer (CSV, notifications). */
export function answerText(a) {
  if (Array.isArray(a?.value)) return a.value.join(', ');
  if (a?.type === 'rating' && a.value !== '') return `${a.value}/5`;
  if (a?.type === 'scale' && a.value !== '') return `${a.value}/10`;
  if (a?.type === 'yesno') return a.value === 'yes' ? 'Yes' : a.value === 'no' ? 'No' : '';
  return String(a?.value ?? '');
}

/** CSV (RFC 4180, with BOM so Excel opens accents correctly). */
export function responsesCsv(questions = [], responses = []) {
  const cell = (v) => {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // avoid formula injection in spreadsheets
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  // Current questions first, then questions that were removed but still have answers.
  const cols = questions.map((q) => ({ id: q.id, label: q.label }));
  for (const r of responses) for (const a of r.answers || []) if (!cols.some((c) => c.id === a.id)) cols.push({ id: a.id, label: a.label });
  const rows = [['Date', ...cols.map((c) => c.label)]];
  for (const r of responses) {
    const by = Object.fromEntries((r.answers || []).map((a) => [a.id, a]));
    rows.push([r.createdAt, ...cols.map((c) => (by[c.id] ? answerText(by[c.id]) : ''))]);
  }
  return `﻿${rows.map((row) => row.map(cell).join(',')).join('\r\n')}\r\n`;
}

/** Per-question summary for the dashboard. */
export function summarizeResponses(questions = [], responses = []) {
  return questions.map((q) => {
    const vals = responses.map((r) => (r.answers || []).find((a) => a.id === q.id)).filter((a) => a && !isEmpty(a.value)).map((a) => a.value);
    const base = { id: q.id, label: q.label, type: q.type, answered: vals.length };
    if (CHOICE_TYPES.includes(q.type) || q.type === 'yesno') {
      const keys = q.type === 'yesno' ? ['yes', 'no'] : optionsOf(q);
      const counts = Object.fromEntries(keys.map((k) => [k, 0]));
      for (const v of vals) for (const x of [].concat(v)) counts[x] = (counts[x] || 0) + 1;
      return { ...base, counts };
    }
    if (q.type === 'rating' || q.type === 'scale' || q.type === 'number') {
      const nums = vals.map(Number).filter(Number.isFinite);
      const counts = {};
      if (q.type !== 'number') for (let i = q.type === 'rating' ? 1 : 0; i <= (q.type === 'rating' ? 5 : 10); i++) counts[i] = 0;
      for (const n of nums) if (n in counts) counts[n]++;
      return { ...base, average: nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : null, counts };
    }
    return { ...base, latest: vals.slice(0, 5).map(String) };
  });
}
