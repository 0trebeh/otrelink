'use client';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { defaultsFor } from '@otrelink/core';
import { Button, IconButton } from '../ui';
import FieldList from './FieldList';

export default function ListField({ value = [], onChange, field }) {
  const set = (i, patch) => onChange(value.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const move = (i, d) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  const add = () => onChange([...value, { id: Math.random().toString(36).slice(2, 10), ...defaultsFor(field.fields) }]);

  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={item.id || i} className="rounded-2xl border border-line p-3 bg-soft/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted">{field.itemLabel || 'Item'} {i + 1}</span>
            <div className="flex">
              <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ChevronUp size={16} /></IconButton>
              <IconButton label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)}><ChevronDown size={16} /></IconButton>
              <IconButton label="Remove" onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 size={15} /></IconButton>
            </div>
          </div>
          <FieldList fields={field.fields} values={item} onChange={(k, v) => set(i, { [k]: v })} compact />
        </div>
      ))}
      {value.length < (field.max ?? 50) && (
        <Button size="sm" onClick={add}><Plus size={15} /> Add {field.itemLabel || 'item'}</Button>
      )}
    </div>
  );
}
