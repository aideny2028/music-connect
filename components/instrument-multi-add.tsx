'use client';

/**
 * InstrumentMultiAdd — structured instrument rows for profile editing.
 * Each row has: instrument dropdown, experience level selector, optional
 * custom-instrument text input (shown only when "Other" is selected).
 * Replaces comma-separated text strings with interactive structured data.
 */

import { Plus, Trash2 } from 'lucide-react';

const INSTRUMENT_OPTIONS = [
  'Piano', 'Guitar', 'Violin', 'Drums', 'Voice',
  'Bass', 'Flute', 'Saxophone', 'Cello', 'Ukulele', 'Other',
];

const EXPERIENCE_LEVELS = [
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
  { value: 'professional', label: 'Professional' },
];

export interface InstrumentRow {
  instrument: string;     // instrument name (or 'Other')
  customName: string;     // filled when instrument === 'Other'
  level: string;          // experience level value
}

interface Props {
  rows: InstrumentRow[];
  onChange: (rows: InstrumentRow[]) => void;
}

const SELECT_CLASS = 'w-full bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#B84050]/60 transition-colors hover:border-white/20';
const INPUT_CLASS  = 'w-full bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2 placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-[#B84050]/60 transition-colors hover:border-white/20 mt-2';

export function InstrumentMultiAdd({ rows, onChange }: Props) {
  const addRow = () =>
    onChange([...rows, { instrument: 'Piano', customName: '', level: 'beginner' }]);

  const removeRow = (index: number) =>
    onChange(rows.filter((_, i) => i !== index));

  const updateRow = (index: number, patch: Partial<InstrumentRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-3">
      {rows.length === 0 && (
        <div className="text-sm text-white/50 text-center py-4 border border-dashed border-white/20 rounded-xl">
          No instruments added yet.
        </div>
      )}

      {rows.map((row, idx) => (
        <div key={idx} className="glass rounded-xl p-4 space-y-2">
          <div className="flex items-start gap-2">
            {/* Instrument dropdown */}
            <div className="flex-1 min-w-0 space-y-2">
              <select
                value={row.instrument}
                onChange={e => updateRow(idx, { instrument: e.target.value, customName: '' })}
                className={SELECT_CLASS}
              >
                {INSTRUMENT_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              {/* "Other" expands a custom name input */}
              {row.instrument === 'Other' && (
                <input
                  type="text"
                  value={row.customName}
                  onChange={e => updateRow(idx, { customName: e.target.value })}
                  placeholder="Enter instrument name…"
                  className={INPUT_CLASS}
                  autoFocus
                />
              )}
            </div>

            {/* Experience level */}
            <select
              value={row.level}
              onChange={e => updateRow(idx, { level: e.target.value })}
              className={`${SELECT_CLASS} w-40 shrink-0`}
            >
              {EXPERIENCE_LEVELS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* Remove row */}
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-900/20 transition-all shrink-0 mt-0.5"
              title="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Add row button */}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-2 w-full py-2.5 px-4 rounded-xl border border-dashed border-white/25 text-sm text-white/70 hover:text-white hover:border-[#B84050]/40 hover:bg-[#B84050]/5 transition-all duration-200"
      >
        <Plus className="h-4 w-4" />
        Add Instrument
      </button>
    </div>
  );
}

/**
 * Convert an InstrumentRow array to a comma-separated string for DB storage.
 * Format: "Piano:advanced,Guitar:beginner,Other:intermediate:Bass Guitar"
 */
export function rowsToString(rows: InstrumentRow[]): string {
  return rows
    .filter(r => r.instrument && (r.instrument !== 'Other' || r.customName.trim()))
    .map(r => {
      const name = r.instrument === 'Other' ? r.customName.trim() : r.instrument;
      return `${name}:${r.level}`;
    })
    .join(',');
}

/**
 * Parse a comma-separated instrument string back into InstrumentRow objects.
 * Handles both plain "Piano,Guitar" and "Piano:advanced,Guitar:beginner" formats.
 */
export function stringToRows(str: string): InstrumentRow[] {
  if (!str) return [];
  return str.split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(entry => {
      const [name, level] = entry.split(':');
      const isKnown = INSTRUMENT_OPTIONS.includes(name);
      return {
        instrument: isKnown ? name : 'Other',
        customName:  isKnown ? '' : name,
        level:       level || 'beginner',
      };
    });
}
