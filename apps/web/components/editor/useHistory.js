'use client';
import { useCallback, useRef, useState } from 'react';

/**
 * Undo/redo history for the page draft.
 * Consecutive edits with the same `key` within 800ms are merged
 * (so typing a word is one undo step, not one per letter).
 */
export function useHistory(initial, limit = 100) {
  const [state, setState] = useState({ past: [], present: initial, future: [] });
  const last = useRef({ key: null, at: 0 });

  const set = useCallback((updater, key = null) => {
    setState((s) => {
      const next = typeof updater === 'function' ? updater(s.present) : updater;
      if (next === s.present) return s;
      const now = Date.now();
      const merge = key && last.current.key === key && now - last.current.at < 800;
      last.current = { key, at: now };
      return {
        past: merge ? s.past : [...s.past, s.present].slice(-limit),
        present: next,
        future: [],
      };
    });
  }, [limit]);

  const undo = useCallback(() => setState((s) => {
    if (!s.past.length) return s;
    last.current = { key: null, at: 0 };
    return { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] };
  }), []);

  const redo = useCallback(() => setState((s) => {
    if (!s.future.length) return s;
    last.current = { key: null, at: 0 };
    return { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) };
  }), []);

  const reset = useCallback((value) => setState((s) => ({ ...s, present: value })), []);

  return { page: state.present, set, undo, redo, reset, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}
