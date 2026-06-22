import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts';
import { formatNumber } from '@/lib/formulaEngine';

function formatTime(unix) {
  if (!unix) return '';
  const d = new Date(unix * 1000);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatAxisTime(unix) {
  if (!unix) return '';
  const d = new Date(unix * 1000);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CustomTooltip = ({ active, payload, label, formulaEntries }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg p-2.5 shadow-xl backdrop-blur-sm"
      style={{ background: 'hsl(220,14%,13%/0.97)', border: '1px solid hsl(215,18%,26%)' }}
    >
      <p className="text-[10px] text-muted-foreground mb-2 font-mono">{formatTime(label)}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: p.stroke }} />
          <span className="text-muted-foreground truncate max-w-[120px]">{p.name}</span>
          <span className="font-mono font-semibold ml-auto" style={{ color: p.stroke }}>{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default function MultiChart({ formulaEntries, timeWindow }) {
  const activeEntries = formulaEntries.filter(f => f.results?.length);
  if (!activeEntries.length) return null;

  // Merge all results by time index
  const merged = (() => {
    const base = activeEntries[0].results.map((r, i) => ({ time: r.time, index: i }));
    for (const entry of activeEntries) {
      entry.results.forEach((r, i) => {
        if (base[i]) base[i][entry.id] = r.value;
      });
    }
    // Filter by timeWindow
    if (timeWindow) return base.filter(r => r.time >= timeWindow[0] && r.time <= timeWindow[1]);
    return base;
  })();

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={merged} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="time"
            tickFormatter={formatAxisTime}
            tick={{ fontSize: 10, fill: '#6b7fa3' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v) => formatNumber(v, 0)}
            tick={{ fontSize: 10, fill: '#6b7fa3' }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip formulaEntries={activeEntries} />} />
          {activeEntries.length > 1 && (
            <Legend
              formatter={(value) => {
                const entry = activeEntries.find(e => String(e.id) === value);
                return <span style={{ fontSize: 10, color: entry?.color || '#888' }}>{entry?.label || value}</span>;
              }}
              wrapperStyle={{ paddingTop: 4 }}
            />
          )}
          {activeEntries.map(entry => {
            const avg = entry.stats?.avg;
            return (
              <React.Fragment key={entry.id}>
                {avg != null && (
                  <ReferenceLine
                    y={avg}
                    stroke={entry.color + '55'}
                    strokeDasharray="4 4"
                  />
                )}
                <Line
                  type="monotone"
                  dataKey={String(entry.id)}
                  name={String(entry.id)}
                  stroke={entry.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: entry.color, stroke: 'hsl(220,15%,8%)', strokeWidth: 2 }}
                />
              </React.Fragment>
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}