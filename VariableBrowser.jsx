import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SECTION_LABELS = {
  current: 'Current',
  minutely_15: '15-Min',
  hourly: 'Hourly',
  daily: 'Daily',
};

const SECTION_COLORS = {
  current: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  minutely_15: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  hourly: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  daily: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function VariableBrowser({ sections, onInsert }) {
  const [openSections, setOpenSections] = useState({ current: true, hourly: true, daily: false, minutely_15: false });

  const toggle = (k) => setOpenSections(p => ({ ...p, [k]: !p[k] }));

  if (!sections || !Object.keys(sections).length) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Variables</p>
        <p className="text-xs text-muted-foreground py-4 text-center opacity-60">
          Fetch an API to see available variables
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
        Variables
      </p>
      <div className="space-y-1.5">
        {Object.entries(sections).map(([key, section]) => (
          <div key={key} className="rounded-lg border border-border/20 overflow-hidden">
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center gap-2 px-2.5 py-2 bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
            >
              {openSections[key] ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
              <span className="text-xs font-medium text-foreground">{SECTION_LABELS[key] || key}</span>
              <Badge variant="outline" className={`text-[10px] ml-auto ${SECTION_COLORS[key] || ''}`}>
                {section.vars.length}
              </Badge>
            </button>
            {openSections[key] && (
              <div className="p-2 flex flex-wrap gap-1 bg-secondary/10">
                {section.vars.map(v => (
                  <button
                    key={v}
                    onClick={() => onInsert(v)}
                    title={v}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-secondary/60 hover:bg-primary/20 hover:text-primary border border-border/20 transition-all truncate max-w-full"
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}