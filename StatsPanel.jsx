import React from 'react';
import { TrendingDown, TrendingUp, BarChart3, Target, Hash } from 'lucide-react';
import { formatNumber } from '@/lib/formulaEngine';

export default function StatsPanel({ stats }) {
  if (!stats) return null;

  const items = [
    { label: 'Min', value: formatNumber(stats.min), icon: TrendingDown, color: 'text-blue-400' },
    { label: 'Max', value: formatNumber(stats.max), icon: TrendingUp, color: 'text-red-400' },
    { label: 'Avg', value: formatNumber(stats.avg), icon: BarChart3, color: 'text-amber-400' },
    { label: '95th %', value: formatNumber(stats.p95), icon: Target, color: 'text-purple-400' },
    { label: 'Points', value: stats.count.toLocaleString(), icon: Hash, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Statistics</p>
      <div className="grid grid-cols-2 gap-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border/20">
            <item.icon className={`w-3.5 h-3.5 ${item.color} shrink-0`} />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
              <p className="text-xs font-semibold font-mono text-foreground">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}