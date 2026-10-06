'use client';
// Field type -> input component. Keys match fieldTypes in @otrelink/core.
// To add a field type: add it in packages/core/src/fields.js and map it here.

import { fieldOptions } from '@otrelink/core';
import { Input, Textarea, Select, Toggle } from '../ui';
import ColorField from './ColorField';
import ImageField from './ImageField';
import FileField from './FileField';
import ListField from './ListField';
import FontField from './FontField';
import ChoiceField from './ChoiceField';
import ImageAdjustField from './ImageAdjustField';
import { WeeklyHoursField, DateRulesField } from './ScheduleFields';

const toLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const fieldInputs = {
  text: ({ value, onChange, field, id }) => <Input id={id} value={value ?? ''} maxLength={field.max} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />,
  url: ({ value, onChange, field, id }) => <Input id={id} type="url" inputMode="url" value={value ?? ''} placeholder={field.placeholder || 'https://'} onChange={(e) => onChange(e.target.value)} />,
  email: ({ value, onChange, field, id }) => <Input id={id} type="email" value={value ?? ''} placeholder={field.placeholder || 'you@example.com'} onChange={(e) => onChange(e.target.value)} />,
  tel: ({ value, onChange, field, id }) => <Input id={id} type="tel" value={value ?? ''} placeholder={field.placeholder || '+1 555 123 4567'} onChange={(e) => onChange(e.target.value)} />,
  textarea: ({ value, onChange, field, id }) => <Textarea id={id} value={value ?? ''} maxLength={field.max} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />,
  embed: ({ value, onChange, field, id }) => <Textarea id={id} value={value ?? ''} maxLength={field.max ?? 20000} placeholder={field.placeholder} spellCheck={false} className="font-mono text-xs min-h-28" onChange={(e) => onChange(e.target.value)} />,
  code: ({ value, onChange, field, id }) => <Textarea id={id} value={value ?? ''} placeholder={field.placeholder} spellCheck={false} className="font-mono text-xs min-h-40" onChange={(e) => onChange(e.target.value)} />,
  number: ({ value, onChange, field, id }) => <Input id={id} type="number" value={value ?? 0} min={field.min} max={field.max} onChange={(e) => onChange(Number(e.target.value))} />,
  range: ({ value, onChange, field, id }) => (
    <div className="flex items-center gap-3">
      <input id={id} type="range" className="flex-1" min={field.min} max={field.max} step={field.step || 1} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="w-14 text-right text-sm tabular-nums text-muted">{value}{field.unit || ''}</span>
    </div>
  ),
  toggle: ({ value, onChange, field }) => <Toggle checked={value} onChange={onChange} label={field.label} />,
  select: ({ value, onChange, field, id }) => (
    <Select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {fieldOptions(field).map((o) => <option key={o.value} value={o.value}>{o.label.charAt(0).toUpperCase() + o.label.slice(1)}</option>)}
    </Select>
  ),
  choice: ChoiceField,
  imageAdjust: ImageAdjustField,
  font: FontField,
  color: ColorField,
  image: ImageField,
  file: FileField,
  list: ListField,
  weeklyHours: WeeklyHoursField,
  dateRules: DateRulesField,
  time: ({ value, onChange, id }) => <Input id={id} type="time" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />,
  datetime: ({ value, onChange, id }) => (
    <Input id={id} type="datetime-local" value={toLocal(value)} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : '')} />
  ),
};
