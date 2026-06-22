import React from 'react';
// Removed the missing shadcn button import
import { Play, Trash2, Bookmark } from 'lucide-react';

export default function SavedFormulasList({ formulas, onSelect, onDelete, isLoading }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Saved Formulas</p>
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!formulas?.length) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Saved Formulas</p>
        <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
          <Bookmark className="w-6 h-6 mb-2 opacity-40" />
          <p className="text-xs">No saved formulas yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
        Saved Formulas ({formulas.length})
      </p>
      <div className="space-y-1.5 max-h-60 overflow-y-auto">
        {formulas.map((f) => (
          <div
            key={f.id}
            className="group flex items-center gap-2 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 border border-border/20 transition-all"
          >
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelect(f)}>
              <p className="text-xs font-medium text-foreground truncate">{f.name}</p>
              <p className="text-[10px] font-mono text-primary/60 truncate">{f.formula}</p>
            </div>
            
            {/* Swapped shadcn Button for native button */}
            <button
              className="h-6 w-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity duration-200"
              onClick={() => onSelect(f)}
              type="button"
            >
              <Play className="w-3 h-3" />
            </button>

            {/* Swapped shadcn Button for native button */}
            <button
              className="h-6 w-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity duration-200"
              onClick={() => onDelete(f.id)}
              type="button"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
