import React from 'react';

const SECTION_LABELS = {
  current: 'Current',
  minutely_15: '15-Min',
  hourly: 'Hourly',
  daily: 'Daily',
};

export default function SectionSelector({ sections, activeSection, onSelect }) {
  if (!sections || !Object.keys(sections).length) return null;

  return (
    <div className="flex gap-1 flex-wrap">
      {Object.keys(sections).map((key) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeSection === key
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
          }`}
        >
          {SECTION_LABELS[key] || key}
          <span className="ml-1.5 text-[10px] opacity-60">
            {sections[key].times.length}
          </span>
        </button>
      ))}
    </div>
  );
}