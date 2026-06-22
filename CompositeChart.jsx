import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Brush,
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

const CustomTooltip = ({ active, payload, label, formula }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card/95 border border-border/60 rounded-lg p-3 shadow-xl backdrop-blur-sm">
      <p className="text-[10px] text-muted-foreground mb-1">{formatTime(label)}</p>
      <p className="text-sm font-mono text-primary font-semibold">{formatNumber(payload[0]?.value)}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{formula}</p>
    </div>
  );
};

export default function CompositeChart({ results, stats, formula }) {
  if (!results?.length) return null;

  const avg = stats?.avg;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={results} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
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
          <Tooltip content={<CustomTooltip formula={formula} />} />
          {avg != null && (
            <ReferenceLine
              y={avg}
              stroke="rgba(57,160,255,0.4)"
              strokeDasharray="4 4"
              label={{ value: 'avg', position: 'right', fontSize: 10, fill: '#39a0ff' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#39a0ff"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#39a0ff', stroke: '#07111f', strokeWidth: 2 }}
          />
          {results.length > 60 && (
            <Brush
              dataKey="time"
              height={20}
              stroke="rgba(57,160,255,0.3)"
              fill="rgba(7,17,31,0.8)"
              travellerWidth={8}
              tickFormatter={formatAxisTime}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}