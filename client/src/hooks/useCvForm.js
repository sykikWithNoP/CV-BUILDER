import { useMemo } from 'react';
import { createId } from '../utils/cv';
import { EMPTY_ENTRY } from '../constants/cv';

/**
 * Editing helpers for the CV form state.
 *
 * Every update goes through the functional form of setData so concurrent edits
 * (typing while an avatar upload resolves, for example) can't overwrite each
 * other, and rows are addressed by id rather than by index.
 */
export default function useCvForm(setData) {
  return useMemo(() => {
    const setField = (key, value) => setData((prev) => ({ ...prev, [key]: value }));

    const addEntry = (section, overrides = {}) =>
      setData((prev) => ({
        ...prev,
        [section]: [...(prev[section] || []), { ...EMPTY_ENTRY[section], ...overrides, id: createId() }],
      }));

    const updateEntry = (section, id, key, value) =>
      setData((prev) => ({
        ...prev,
        [section]: (prev[section] || []).map((entry) =>
          entry.id === id ? { ...entry, [key]: value } : entry
        ),
      }));

    const removeEntry = (section, id) =>
      setData((prev) => ({
        ...prev,
        [section]: (prev[section] || []).filter((entry) => entry.id !== id),
      }));

    const moveEntry = (section, id, direction) =>
      setData((prev) => {
        const list = [...(prev[section] || [])];
        const from = list.findIndex((entry) => entry.id === id);
        const to = from + direction;
        if (from < 0 || to < 0 || to >= list.length) return prev;
        [list[from], list[to]] = [list[to], list[from]];
        return { ...prev, [section]: list };
      });

    return { setField, addEntry, updateEntry, removeEntry, moveEntry };
  }, [setData]);
}
