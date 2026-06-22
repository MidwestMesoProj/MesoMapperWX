import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Link2, RefreshCw, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';

export default function ApiUrlInput({ urls, onAdd, onRemove, onFetch, isFetching }) {
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(true);

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInput('');
  };

  return (
    <div className="space-y-3">
      <button
        className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-medium w-full"
        onClick={() => setExpanded(!expanded)}
      >
        <Link2 className="w-3.5 h-3.5" />
        API Sources ({urls.length})
        {expanded ? <ChevronDown className="w-3 h-3 ml-auto" /> : <ChevronRight className="w-3 h-3 ml-auto" />}
      </button>

      {expanded && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="https://api.open-meteo.com/v1/forecast?..."
              className="text-xs h-8 bg-secondary/50 border-border/40 font-mono"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button size="sm" variant="outline" className="h-8 px-2.5 shrink-0" onClick={handleAdd}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {urls.map((url, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-secondary/30 border border-border/20 group">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-[10px] font-mono text-muted-foreground flex-1 min-w-0 truncate">{url}</span>
              <button
                onClick={() => onRemove(i)}
                className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}

          {urls.length > 0 && (
            <Button
              onClick={onFetch}
              disabled={isFetching}
              size="sm"
              className="w-full h-8 text-xs"
            >
              {isFetching ? (
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              )}
              {isFetching ? 'Fetching…' : 'Fetch Data'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}