import { useState } from 'react';
import type { Filters, AgeFilter } from '../hooks/useData';

const AGE_OPTIONS: { value: AgeFilter; label: string }[] = [
  { value: 'all', label: 'All Ages' },
  { value: '13-14', label: '13–14 yrs' },
  { value: '15-17', label: '15–17 yrs' },
];

const RELIANCE_OPTIONS = [
  { value: 'overreliance', label: 'Over-reliant', color: '#EF4444' },
  { value: 'appropriate', label: 'Appropriate', color: '#3B82F6' },
  { value: 'underreliance', label: 'Under-reliant', color: '#22C55E' },
];

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

export default function FilterPanel({ filters, onChange }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const set = (partial: Partial<Filters>) => onChange({ ...filters, ...partial });

  const toggleReliance = (val: string) => {
    const next = new Set(filters.reliance);
    if (next.has(val)) {
      next.delete(val);
    } else {
      next.add(val);
    }
    if (next.size === 0) {
      set({ reliance: new Set(['overreliance', 'appropriate', 'underreliance']) });
    } else {
      set({ reliance: next });
    }
  };

  const allRelianceSelected = filters.reliance.size === 3;

  return (
    <div style={{ marginBottom: 0 }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: 'none',
          border: 'none',
          color: '#9CA3AF',
          fontSize: '0.65rem',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '2px 0',
          marginBottom: collapsed ? 0 : 4,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ display: 'inline-block', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', fontSize: '0.55rem' }}>
          &#9660;
        </span>
        Filters &amp; Segments
      </button>

      <div style={{ maxHeight: collapsed ? 0 : 100, overflow: 'hidden', transition: 'max-height 0.3s ease, opacity 0.3s ease', opacity: collapsed ? 0 : 1 }}>
        <div className="filter-panel">
          <div className="filter-section">
            <span className="filter-label">Age Group</span>
            {AGE_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={`filter-btn ${filters.age === o.value ? 'active' : ''}`}
                onClick={() => set({ age: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="filter-divider" />

          <div className="filter-section">
            <span className="filter-label">Reliance Type</span>
            <button
              className={`filter-btn ${allRelianceSelected ? 'active' : ''}`}
              onClick={() => set({ reliance: new Set(['overreliance', 'appropriate', 'underreliance']) })}
            >
              All
            </button>
            {RELIANCE_OPTIONS.map((o) => (
              <button
                key={o.value}
                className={`filter-btn ${filters.reliance.has(o.value) && !allRelianceSelected ? 'active' : ''}`}
                onClick={() => toggleReliance(o.value)}
                style={{ opacity: allRelianceSelected ? 0.7 : 1 }}
              >
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: o.color, marginRight: 4, verticalAlign: 'middle' }} />
                {o.label}
              </button>
            ))}
          </div>

          <div className="filter-divider" />

          <div className="filter-section">
            <span className="filter-label">Day Range</span>
            <div className="range-control">
              <input
                type="range"
                className="range-slider"
                min={1}
                max={15}
                value={filters.dayRange[0]}
                onChange={(e) => {
                  const v = +e.target.value;
                  set({ dayRange: [Math.min(v, filters.dayRange[1]), filters.dayRange[1]] });
                }}
              />
              <input
                type="range"
                className="range-slider"
                min={1}
                max={15}
                value={filters.dayRange[1]}
                onChange={(e) => {
                  const v = +e.target.value;
                  set({ dayRange: [filters.dayRange[0], Math.max(v, filters.dayRange[0])] });
                }}
              />
              <span className="range-value">D{filters.dayRange[0]}–D{filters.dayRange[1]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
