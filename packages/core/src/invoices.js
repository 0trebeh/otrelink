// Invoices made by page owners for their customers (dashboard → Invoices),
// and the shape shared with the PDF builder (apps/web/lib/invoice-pdf.js),
// which also prints Otrelink's own subscription invoices.
//
// page.invoicing = { businessName, address, taxId, email, phone, website, logo, color,
//                    prefix, currency, currencyPosition, numberFormat, taxRate, taxLabel,
//                    dueDays, notes, footer, language }
// invoice = { number, status, issueDate, dueDate, client: {…}, items: [{ id, description, qty, price }],
//             discount, taxRate, taxLabel, notes, money: { currency, currencyPosition, numberFormat }, … }
import { sanitizeFields, defaultsFor } from './fields.js';
import { formatMoney } from './blocks/catalog.js';

export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'void'];

const moneyFields = [
  { key: 'currency', type: 'text', label: 'Currency', default: '$', max: 6, placeholder: '$, €, Bs., USD' },
  { key: 'currencyPosition', type: 'select', label: 'Currency position', default: 'before', options: [
    { value: 'before', label: 'Before the amount ($25)' }, { value: 'after', label: 'After the amount (25 €)' },
  ] },
  { key: 'numberFormat', type: 'select', label: 'Number format', default: 'dot', options: [
    { value: 'dot', label: '1,234.50' }, { value: 'comma', label: '1.234,50' },
  ] },
];

/** Your business details and defaults for new invoices (dashboard → Invoices → Settings). */
export const invoiceSettingsFields = [
  { key: 'businessName', type: 'text', label: 'Business name', max: 100 },
  { key: 'address', type: 'textarea', label: 'Address', max: 300, placeholder: 'Street, city, country' },
  { key: 'taxId', type: 'text', label: 'Tax ID (optional)', max: 40, placeholder: 'RIF / NIT / VAT / EIN' },
  { key: 'email', type: 'email', label: 'Email (optional)' },
  { key: 'phone', type: 'tel', label: 'Phone (optional)' },
  { key: 'website', type: 'text', label: 'Website (optional)', max: 100 },
  { key: 'logo', type: 'image', label: 'Logo (optional)', help: 'PNG or JPG. Defaults to your profile picture.' },
  { key: 'color', type: 'color', label: 'Accent color', default: '#111111' },
  { key: 'prefix', type: 'text', label: 'Number prefix', default: 'INV-', max: 12, help: 'Invoices are numbered INV-0001, INV-0002…' },
  ...moneyFields,
  { key: 'taxLabel', type: 'text', label: 'Tax name', default: 'Tax', max: 20, placeholder: 'Tax, VAT, IVA…' },
  { key: 'taxRate', type: 'number', label: 'Default tax rate (%)', min: 0, max: 100, step: 0.01, default: 0 },
  { key: 'dueDays', type: 'number', label: 'Due after (days)', min: 0, max: 365, default: 15, help: '0 = no due date.' },
  { key: 'notes', type: 'textarea', label: 'Default notes', max: 1000, placeholder: 'Payment instructions, bank account…' },
  { key: 'footer', type: 'text', label: 'Footer (optional)', max: 200, placeholder: 'Thank you for your business!' },
  { key: 'language', type: 'select', label: 'Invoice language', default: 'page', options: [
    { value: 'page', label: 'Same as the page' }, { value: 'en', label: 'English' }, { value: 'es', label: 'Español' },
  ] },
];

export const invoiceClientFields = [
  { key: 'name', type: 'text', label: 'Client name', max: 100 },
  { key: 'email', type: 'email', label: 'Email' },
  { key: 'phone', type: 'tel', label: 'Phone' },
  { key: 'taxId', type: 'text', label: 'Tax ID', max: 40 },
  { key: 'address', type: 'textarea', label: 'Address', max: 300 },
];

const itemFields = [
  { key: 'description', type: 'textarea', label: 'Description', max: 500 },
  { key: 'qty', type: 'number', label: 'Quantity', min: 0, max: 1000000, step: 0.001, default: 1 },
  { key: 'price', type: 'number', label: 'Unit price', min: -100000000, max: 100000000, step: 0.01, default: 0 },
];

const invoiceFields = [
  { key: 'status', type: 'select', default: 'draft', options: INVOICE_STATUSES },
  { key: 'issueDate', type: 'date' },
  { key: 'dueDate', type: 'date' },
  { key: 'items', type: 'list', max: 100, fields: itemFields, default: [] },
  { key: 'discount', type: 'number', min: 0, max: 100, step: 0.01, default: 0 },
  { key: 'taxRate', type: 'number', min: 0, max: 100, step: 0.01, default: 0 },
  { key: 'taxLabel', type: 'text', max: 20, default: 'Tax' },
  { key: 'notes', type: 'textarea', max: 2000 },
  { key: 'footer', type: 'text', max: 200 },
];

export const defaultInvoiceSettings = () => defaultsFor(invoiceSettingsFields);
export const sanitizeInvoiceSettings = (input) => sanitizeFields(invoiceSettingsFields, input && typeof input === 'object' ? input : {});

/** Clean an invoice sent by the dashboard (number, owner and ids are set by the server). */
export function sanitizeInvoice(input = {}) {
  const v = input && typeof input === 'object' ? input : {};
  return {
    ...sanitizeFields(invoiceFields, v),
    client: sanitizeFields(invoiceClientFields, v.client || {}),
    money: sanitizeFields(moneyFields, v.money || {}),
  };
}

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** { lines: [{ …item, amount }], subtotal, discount, taxable, tax, total } */
export function invoiceTotals(inv = {}) {
  const lines = (inv.items || []).filter((i) => i.description || Number(i.price)).map((i) => ({ ...i, amount: round2(Number(i.qty || 0) * Number(i.price || 0)) }));
  const subtotal = round2(lines.reduce((s, l) => s + l.amount, 0));
  const discount = round2(subtotal * (Number(inv.discount) || 0) / 100);
  const taxable = round2(subtotal - discount);
  const tax = round2(taxable * (Number(inv.taxRate) || 0) / 100);
  return { lines, subtotal, discount, taxable, tax, total: round2(taxable + tax) };
}

/** "INV-0007" */
export const invoiceCode = (prefix, number) => `${prefix || ''}${String(number).padStart(4, '0')}`;

/** Money of an invoice as text. */
export const invoiceMoney = (n, money = {}) => (Number(n) < 0 ? `-${formatMoney(-Number(n), money)}` : formatMoney(n, money));

/** Words printed on invoices. */
export const INVOICE_WORDS = {
  en: {
    invoice: 'Invoice', billTo: 'Bill to', number: 'Invoice number', issueDate: 'Date', dueDate: 'Due date',
    description: 'Description', qty: 'Qty', price: 'Unit price', amount: 'Amount', subtotal: 'Subtotal',
    discount: 'Discount', total: 'Total', notes: 'Notes', taxId: 'Tax ID', paid: 'Paid', void: 'Void',
    page: 'Page {n} of {m}', balance: 'Amount due', paidOn: 'Paid on {date}', period: 'Period', method: 'Payment method',
  },
  es: {
    invoice: 'Factura', billTo: 'Facturar a', number: 'Número de factura', issueDate: 'Fecha', dueDate: 'Vencimiento',
    description: 'Descripción', qty: 'Cant.', price: 'Precio unit.', amount: 'Importe', subtotal: 'Subtotal',
    discount: 'Descuento', total: 'Total', notes: 'Notas', taxId: 'ID fiscal', paid: 'Pagada', void: 'Anulada',
    page: 'Página {n} de {m}', balance: 'Total a pagar', paidOn: 'Pagada el {date}', period: 'Período', method: 'Método de pago',
  },
};
