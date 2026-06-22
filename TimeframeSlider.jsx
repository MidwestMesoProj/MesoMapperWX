import React from 'react';
import { Slider } from '@/components/ui/slider';

function formatUnix(unix) {
  if (!unix) return '';
  const d = new Date(unix * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
}

export default function TimeframeSlider({ results, window: win, onWindowChange }) {
  if (!results || results.length < 2) return null;

  const allTimes = results.map(r => r.time).filter(Boolean);
  if (!allTimes.length) return null;

  const minT = Math.min(...allTimes);
  const maxT = Math.max(...allTimes);
  if (minT === maxT) return null;

  const lo = win ? win[0] : minT;
  const hi = win ? win[1] : maxT;

  // Slider operates on 0–1000 integer scale for smooth dragging
  const toScale = (t) => Math.round(((t - minT) / (maxT - minT)) * 1000);
  const fromScale = (s) => minT + (s / 1000) * (maxT - minT);

  const handleChange = ([lo_s, hi_s]) => {
    onWindowChange([fromScale(lo_s), fromScale(hi_s)]);
  };

  return (
    <div className="space-y-1.5 px-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Timeframe</span>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
          <span>{formatUnix(lo)}</span>
          <span className="text-border">—</span>
          <span>{formatUnix(hi)}</span>
          {(lo !== minT || hi !== maxT) && (
            <button
              onClick={() => onWindowChange(null)}
              className="text-primary hover:underline ml-1"
            >
              reset
            </button>
          )}
        </div>
      </div>
      <Slider
        value={[toScale(lo), toScale(hi)]}
        onValueChange={handleChange}
        min={0}
        max={1000}
        step={1}
        className="w-full"
      />
    </div>
  );
}