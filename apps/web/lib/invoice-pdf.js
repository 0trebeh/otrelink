// PDF invoices (pdf-lib, pure JavaScript). Used for the invoices page owners
// make for their customers and for Otrelink's own subscription invoices.
//
// buildInvoicePdf(doc) → Uint8Array, where doc = {
//   lang: 'en' | 'es', color: '#111111', code: 'INV-0007', status: 'draft' | 'sent' | 'paid' | 'void',
//   issueDate, dueDate, paidDate,            // "YYYY-MM-DD" or ISO
//   seller: { name, lines: [...], logo?: { bytes, type: 'png' | 'jpg' } },
//   client: { name, lines: [...] },
//   meta: [[label, value]],                  // extra rows under the dates
//   lines: [{ description, qty, price, amount }],
//   totals: [{ label, value, strong? }],
//   notes, footer, money: (n) => '$25.00',
// }
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { INVOICE_WORDS } from '@otrelink/core';

const A4 = [595.28, 841.89];
const M = 48; // margin

const hex = (h) => {
  const s = String(h || '#111111').replace('#', '');
  const f = s.length === 3 ? s.split('').map((c) => c + c).join('') : s.slice(0, 6).padEnd(6, '0');
  return rgb(parseInt(f.slice(0, 2), 16) / 255, parseInt(f.slice(2, 4), 16) / 255, parseInt(f.slice(4, 6), 16) / 255);
};
const INK = rgb(0.09, 0.09, 0.11);
const MUTED = rgb(0.42, 0.43, 0.47);
const LINE = rgb(0.88, 0.88, 0.9);
const SOFT = rgb(0.965, 0.965, 0.975);

const fmtDate = (d, lang) => {
  if (!d) return '';
  const t = new Date(/^\d{4}-\d{2}-\d{2}$/.test(d) ? `${d}T12:00:00Z` : d);
  if (Number.isNaN(t.getTime())) return '';
  return new Intl.DateTimeFormat(lang === 'es' ? 'es' : 'en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(t);
};

export async function buildInvoicePdf(doc) {
  const words = INVOICE_WORDS[doc.lang] || INVOICE_WORDS.en;
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${words.invoice} ${doc.code}`);
  pdf.setAuthor(doc.seller?.name || '');
  pdf.setCreator('Otrelink');
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const accent = hex(doc.color);

  // The standard PDF fonts only know Latin characters: anything else (emoji…) is left out.
  const ok = new Map();
  const safe = (s) => [...String(s ?? '').replace(/ | | /g, ' ')].map((ch) => {
    if (ch === '\n') return ch;
    if (!ok.has(ch)) { try { font.widthOfTextAtSize(ch, 10); bold.widthOfTextAtSize(ch, 10); ok.set(ch, true); } catch { ok.set(ch, false); } }
    return ok.get(ch) ? ch : '';
  }).join('');
  const width = (s, size, f = font) => f.widthOfTextAtSize(safe(s), size);
  const wrap = (s, size, max, f = font) => {
    const out = [];
    for (const para of safe(s).split('\n')) {
      let line = '';
      for (const word of para.split(/\s+/)) {
        const next = line ? `${line} ${word}` : word;
        if (width(next, size, f) <= max || !line) {
          // A single word longer than the line is cut.
          if (!line && width(word, size, f) > max) {
            let cut = '';
            for (const ch of word) { if (width(cut + ch, size, f) > max) { out.push(cut); cut = ''; } cut += ch; }
            line = cut;
          } else line = next;
        } else { out.push(line); line = word; }
      }
      out.push(line);
    }
    return out;
  };

  const pages = [];
  let page;
  let y;
  const newPage = () => { page = pdf.addPage(A4); pages.push(page); y = A4[1] - M; };
  const text = (s, x, yy, { size = 10, f = font, color = INK, align = 'left', maxWidth } = {}) => {
    let t = safe(s);
    if (maxWidth) while (t.length > 1 && width(t, size, f) > maxWidth) t = `${t.slice(0, -2)}…`;
    const w = width(t, size, f);
    page.drawText(t, { x: align === 'right' ? x - w : align === 'center' ? x - w / 2 : x, y: yy, size, font: f, color });
  };

  newPage();
  const right = A4[0] - M;

  // ── Header: logo + seller (left), title + number + dates (right) ──
  let leftY = y;
  if (doc.seller?.logo?.bytes) {
    try {
      const img = doc.seller.logo.type === 'png' ? await pdf.embedPng(doc.seller.logo.bytes) : await pdf.embedJpg(doc.seller.logo.bytes);
      const s = img.scaleToFit(140, 56);
      page.drawImage(img, { x: M, y: leftY - s.height, width: s.width, height: s.height });
      leftY -= s.height + 12;
    } catch { /* unsupported image: skip it */ }
  }
  if (doc.seller?.name) { text(doc.seller.name, M, leftY - 12, { size: 13, f: bold, maxWidth: 260 }); leftY -= 18; }
  for (const l of (doc.seller?.lines || []).filter(Boolean)) {
    for (const w of wrap(l, 9, 260)) { text(w, M, leftY - 10, { size: 9, color: MUTED }); leftY -= 12.5; }
  }

  let rightY = y;
  text(words.invoice.toUpperCase(), right, rightY - 22, { size: 24, f: bold, color: accent, align: 'right' });
  rightY -= 40;
  const rows = [
    [words.number, doc.code],
    [words.issueDate, fmtDate(doc.issueDate, doc.lang)],
    doc.dueDate ? [words.dueDate, fmtDate(doc.dueDate, doc.lang)] : null,
    ...(doc.meta || []),
  ].filter((r) => r && r[1]);
  for (const [k, v] of rows) {
    text(k, right - 120, rightY - 10, { size: 9, color: MUTED, align: 'right' });
    text(v, right, rightY - 10, { size: 9.5, f: bold, align: 'right', maxWidth: 110 });
    rightY -= 15;
  }
  // Paid / void stamp.
  if (doc.status === 'paid' || doc.status === 'void') {
    const label = (doc.status === 'paid' ? words.paid : words.void).toUpperCase();
    const c = doc.status === 'paid' ? rgb(0.09, 0.6, 0.3) : rgb(0.8, 0.15, 0.15);
    const w = width(label, 12, bold) + 20;
    page.drawRectangle({ x: right - w, y: rightY - 26, width: w, height: 20, borderColor: c, borderWidth: 1.5, color: rgb(1, 1, 1) });
    text(label, right - w / 2, rightY - 20.5, { size: 12, f: bold, color: c, align: 'center' });
    rightY -= 30;
    if (doc.status === 'paid' && doc.paidDate) { text(words.paidOn.replace('{date}', fmtDate(doc.paidDate, doc.lang)), right, rightY - 8, { size: 8.5, color: MUTED, align: 'right' }); rightY -= 14; }
  }
  y = Math.min(leftY, rightY) - 22;

  // ── Bill to ──
  if (doc.client?.name || doc.client?.lines?.length) {
    text(words.billTo.toUpperCase(), M, y - 9, { size: 8, f: bold, color: MUTED });
    y -= 22;
    if (doc.client.name) { text(doc.client.name, M, y - 2, { size: 11.5, f: bold, maxWidth: right - M }); y -= 16; }
    for (const l of (doc.client.lines || []).filter(Boolean)) {
      for (const w of wrap(l, 9.5, 300)) { text(w, M, y - 2, { size: 9.5, color: MUTED }); y -= 13; }
    }
    y -= 14;
  }

  // ── Items ──
  const col = { desc: M + 10, qty: right - 210, price: right - 100, amount: right - 10 };
  const descW = col.qty - 40 - col.desc;
  const header = () => {
    page.drawRectangle({ x: M, y: y - 24, width: right - M, height: 24, color: accent });
    const w = rgb(1, 1, 1);
    text(words.description, col.desc, y - 16, { size: 9, f: bold, color: w });
    text(words.qty, col.qty, y - 16, { size: 9, f: bold, color: w, align: 'right' });
    text(words.price, col.price, y - 16, { size: 9, f: bold, color: w, align: 'right' });
    text(words.amount, col.amount, y - 16, { size: 9, f: bold, color: w, align: 'right' });
    y -= 30;
  };
  header();
  const fmtQty = (q) => (Number.isInteger(Number(q)) ? String(Number(q)) : String(Math.round(Number(q) * 1000) / 1000));
  doc.lines.forEach((l, i) => {
    const lines = wrap(l.description || '—', 9.5, descW);
    const h = Math.max(lines.length * 13, 13) + 10;
    if (y - h < M + 60) { newPage(); header(); }
    if (i % 2 === 1) page.drawRectangle({ x: M, y: y - h + 6, width: right - M, height: h, color: SOFT });
    lines.forEach((t, k) => text(t, col.desc, y - 6 - k * 13, { size: 9.5 }));
    text(fmtQty(l.qty), col.qty, y - 6, { size: 9.5, align: 'right' });
    text(doc.money(l.price), col.price, y - 6, { size: 9.5, align: 'right' });
    text(doc.money(l.amount), col.amount, y - 6, { size: 9.5, f: bold, align: 'right' });
    y -= h;
  });
  page.drawLine({ start: { x: M, y: y + 2 }, end: { x: right, y: y + 2 }, thickness: 0.8, color: LINE });
  y -= 14;

  // ── Totals ──
  if (y - (doc.totals.length * 18 + 30) < M + 40) newPage();
  for (const t of doc.totals) {
    if (t.strong) {
      page.drawRectangle({ x: right - 230, y: y - 22, width: 230, height: 26, color: SOFT });
      text(t.label, right - 220, y - 13, { size: 11, f: bold });
      text(t.value, right - 10, y - 13, { size: 12.5, f: bold, color: accent, align: 'right' });
      y -= 32;
    } else {
      text(t.label, right - 220, y - 8, { size: 9.5, color: MUTED });
      text(t.value, right - 10, y - 8, { size: 9.5, align: 'right' });
      y -= 17;
    }
  }
  y -= 10;

  // ── Notes ──
  if (doc.notes) {
    const lines = wrap(doc.notes, 9.5, right - M);
    if (y - (lines.length * 13 + 24) < M + 30) newPage();
    text(words.notes.toUpperCase(), M, y - 9, { size: 8, f: bold, color: MUTED });
    y -= 22;
    for (const l of lines) {
      if (y < M + 30) newPage();
      text(l, M, y - 2, { size: 9.5 });
      y -= 13;
    }
  }

  // ── Footer on every page ──
  pages.forEach((p, i) => {
    page = p;
    page.drawLine({ start: { x: M, y: M - 6 }, end: { x: right, y: M - 6 }, thickness: 0.6, color: LINE });
    if (doc.footer) text(doc.footer, M, M - 20, { size: 8.5, color: MUTED, maxWidth: right - M - 90 });
    text(words.page.replace('{n}', i + 1).replace('{m}', pages.length), right, M - 20, { size: 8.5, color: MUTED, align: 'right' });
  });

  return pdf.save();
}

/** PDF response (inline, or as a download with ?download=1). */
export function pdfResponse(bytes, filename, download) {
  const name = String(filename).replace(/[^\w.-]+/g, '-');
  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${name}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
