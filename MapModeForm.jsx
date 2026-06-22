import React, { useState } from 'react';
import { Play, Map, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// CONUS grid presets — from coarse preview up to model-dependent maximum
const GRID_PRESETS = [
  { label: '3×2 — 6 pts (preview)', cols: 3, rows: 2 },
  { label: '5×3 — 15 pts', cols: 5, rows: 3 },
  { label: '8×5 — 40 pts', cols: 8, rows: 5 },
  { label: '12×8 — 96 pts', cols: 12, rows: 8 },
  { label: '16×10 — 160 pts', cols: 16, rows: 10 },
  { label: '20×13 — 260 pts', cols: 20, rows: 13 },
  { label: '28×18 — 504 pts', cols: 28, rows: 18 },
  { label: '36×23 — 828 pts', cols: 36, rows: 23 },
  { label: '48×30 — 1440 pts', cols: 48, rows: 30 },
  { label: '64×40 — 2560 pts', cols: 64, rows: 40 },
  { label: '80×50 — 4000 pts', cols: 80, rows: 50 },
  { label: '100×63 — 6300 pts', cols: 100, rows: 63 },
  { label: '120×75 — 9000 pts', cols: 120, rows: 75 },
  { label: '150×94 — 14100 pts (slow)', cols: 150, rows: 94 },
  { label: '200×125 — 25000 pts (very slow)', cols: 200, rows: 125 },
];

// 'current' returns a single flat value — not useful for map time-series; exclude it
const SECTION_OPTIONS = ['hourly', 'daily', 'minutely_15'];

const COMMON_VARS = [
  'cape', 'lifted_index', 'wind_gusts_10m', 'wind_speed_10m', 'temperature_2m',
  'dew_point_2m', 'precipitation_probability', 'precipitation', 'relative_humidity_2m',
  'cloud_cover_high', 'visibility', 'pressure_msl', 'snowfall', 'rain',
  'thunderstorm_probability', 'uv_index',
];

const MODEL_OPTIONS = [
  { value: 'gfs_hrrr', label: 'GFS HRRR (3km)' },
  { value: 'gfs_global', label: 'GFS Global' },
  { value: 'gfs_seamless', label: 'GFS Seamless' },
  { value: 'ecmwf_ifs025', label: 'ECMWF IFS 0.25°' },
  { value: 'icon_seamless', label: 'ICON Seamless' },
  { value: 'icon_d2', label: 'ICON-D2 (2km)' },
  { value: 'ncep_nam_conus', label: 'NAM CONUS (12km)' },
];

export default function MapModeForm({ onFetch, isFetching, fetchProgress, useBulk, onToggleBulk }) {
  const [gridPreset, setGridPreset] = useState(1); // index into GRID_PRESETS
  const [section, setSection] = useState('hourly');
  const [selectedVars, setSelectedVars] = useState(['cape', 'wind_gusts_10m', 'temperature_2m']);
  const [formula, setFormula] = useState('cape');
  const [model, setModel] = useState('gfs_seamless');
  const [pastDays, setPastDays] = useState(0);
  const [forecastDays, setForecastDays] = useState(1);
  const [tempUnit, setTempUnit] = useState('fahrenheit');
  const [windUnit, setWindUnit] = useState('mph');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  const preset = GRID_PRESETS[gridPreset];
  const totalPoints = preset.cols * preset.rows;

  const toggleVar = (v) => {
    setSelectedVars(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    );
  };

  const handleFetch = () => {
    if (!selectedVars.length) { setError('Select at least one variable'); return; }
    if (!formula.trim()) { setError('Enter a formula'); return; }
    setError('');
    onFetch({
      grid: preset,
      section,
      variables: selectedVars,
      formula: formula.trim(),
      model,
      pastDays,
      forecastDays,
      tempUnit,
      windUnit,
    });
  };

  return (
    <div
      className="rounded-xl p-4 space-y-4"
      style={{
        background: 'linear-gradient(160deg, hsl(220,14%,12%) 0%, hsl(220,12%,10%) 100%)',
        border: '1px solid hsl(215,18%,20%)',
        boxShadow: 'inset 0 1px 0 hsl(215,22%,22%)',
      }}
    >
      <div className="flex items-center gap-2">
        <Map className="w-4 h-4 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">Map Mode Setup</h3>
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">
          {useBulk ? `${Math.ceil(totalPoints / 500)} bulk request${Math.ceil(totalPoints / 500) !== 1 ? 's' : ''} · ${totalPoints} pts` : `${totalPoints} requests`}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Grid resolution */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Grid Resolution</label>
          <select
            value={gridPreset}
            onChange={e => setGridPreset(Number(e.target.value))}
            className="w-full h-8 px-2 rounded-md text-xs outline-none"
            style={{ background: 'hsl(220,14%,14%)', border: '1px solid hsl(215,18%,22%)', color: 'hsl(210,20%,78%)' }}
          >
            {GRID_PRESETS.map((p, i) => (
              <option key={i} value={i}>{p.label}</option>
            ))}
          </select>
        </div>

        {/* Data section */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Data Section</label>
          <select
            value={section}
            onChange={e => setSection(e.target.value)}
            className="w-full h-8 px-2 rounded-md text-xs outline-none"
            style={{ background: 'hsl(220,14%,14%)', border: '1px solid hsl(215,18%,22%)', color: 'hsl(210,20%,78%)' }}
          >
            {SECTION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Model */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Weather Model</label>
          <select
            value={model}
            onChange={e => setModel(e.target.value)}
            className="w-full h-8 px-2 rounded-md text-xs outline-none"
            style={{ background: 'hsl(220,14%,14%)', border: '1px solid hsl(215,18%,22%)', color: 'hsl(210,20%,78%)' }}
          >
            {MODEL_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>

        {/* Formula */}
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Formula</label>
          <input
            value={formula}
            onChange={e => setFormula(e.target.value)}
            placeholder="e.g. cape * (temperature_2m / 100)"
            className="w-full h-8 px-2 rounded-md text-xs font-mono outline-none"
            style={{ background: 'hsl(220,14%,14%)', border: '1px solid hsl(215,18%,22%)', color: 'hsl(195,80%,72%)' }}
          />
        </div>
      </div>

      {/* Variables */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          Variables ({selectedVars.length} selected)
        </label>
        <div className="flex flex-wrap gap-1">
          {COMMON_VARS.map(v => {
            const on = selectedVars.includes(v);
            return (
              <button
                key={v}
                onClick={() => toggleVar(v)}
                className="px-2 py-1 rounded text-[10px] font-mono transition-all"
                style={{
                  background: on ? 'hsl(195,40%,20%)' : 'hsl(220,12%,15%)',
                  border: `1px solid ${on ? 'hsl(195,50%,35%)' : 'hsl(215,18%,22%)'}`,
                  color: on ? 'hsl(195,80%,72%)' : 'hsl(210,12%,50%)',
                }}
              >
                {v}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced */}
      <div>
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Advanced options
        </button>
        {showAdvanced && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Past Days</label>
              <input type="number" min={0} max={7} value={pastDays}
                onChange={e => setPastDays(Number(e.target.value))}
                className="w-full h-7 px-2 rounded-md text-xs outline-none"
                style={{ background: 'hsl(220,14%,14%)', border: '1px solid hsl(215,18%,22%)', color: 'hsl(210,20%,78%)' }} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Forecast Days</label>
              <input type="number" min={1} max={7} value={forecastDays}
                onChange={e => setForecastDays(Number(e.target.value))}
                className="w-full h-7 px-2 rounded-md text-xs outline-none"
                style={{ background: 'hsl(220,14%,14%)', border: '1px solid hsl(215,18%,22%)', color: 'hsl(210,20%,78%)' }} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Temp Unit</label>
              <select value={tempUnit} onChange={e => setTempUnit(e.target.value)}
                className="w-full h-7 px-2 rounded-md text-xs outline-none"
                style={{ background: 'hsl(220,14%,14%)', border: '1px solid hsl(215,18%,22%)', color: 'hsl(210,20%,78%)' }}>
                <option value="fahrenheit">°F</option>
                <option value="celsius">°C</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground">Wind Unit</label>
              <select value={windUnit} onChange={e => setWindUnit(e.target.value)}
                className="w-full h-7 px-2 rounded-md text-xs outline-none"
                style={{ background: 'hsl(220,14%,14%)', border: '1px solid hsl(215,18%,22%)', color: 'hsl(210,20%,78%)' }}>
                <option value="mph">mph</option>
                <option value="kmh">km/h</option>
                <option value="kn">knots</option>
                <option value="ms">m/s</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Progress bar */}
      {isFetching && fetchProgress && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>{useBulk ? 'Bulk fetching…' : 'Fetching grid data…'}</span>
            <span>{fetchProgress.done}/{fetchProgress.total} pts</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(220,12%,16%)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(fetchProgress.done / fetchProgress.total) * 100}%`,
                background: 'linear-gradient(90deg, hsl(195,60%,40%), hsl(195,80%,60%))',
              }}
            />
          </div>
        </div>
      )}

      {/* Query mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleBulk(true)}
            className="px-3 py-1 rounded-md text-[10px] font-medium transition-all"
            style={{
              background: useBulk ? 'hsl(195,40%,20%)' : 'hsl(220,12%,15%)',
              border: `1px solid ${useBulk ? 'hsl(195,50%,35%)' : 'hsl(215,18%,22%)'}`,
              color: useBulk ? 'hsl(195,80%,72%)' : 'hsl(210,12%,50%)',
            }}
          >
            Bulk query
          </button>
          <button
            onClick={() => onToggleBulk(false)}
            className="px-3 py-1 rounded-md text-[10px] font-medium transition-all"
            style={{
              background: !useBulk ? 'hsl(195,40%,20%)' : 'hsl(220,12%,15%)',
              border: `1px solid ${!useBulk ? 'hsl(195,50%,35%)' : 'hsl(215,18%,22%)'}`,
              color: !useBulk ? 'hsl(195,80%,72%)' : 'hsl(210,12%,50%)',
            }}
          >
            Single location
          </button>
        </div>
        <span className="text-[9px] text-muted-foreground font-mono">
          {useBulk ? `${Math.ceil(totalPoints / 500)} bulk request${Math.ceil(totalPoints / 500) > 1 ? 's' : ''}` : `${totalPoints} requests`}
        </span>
      </div>

      <button
        onClick={handleFetch}
        disabled={isFetching}
        className="w-full h-9 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-all disabled:opacity-60"
        style={{
          background: 'linear-gradient(160deg, hsl(195,55%,38%) 0%, hsl(200,50%,28%) 100%)',
          boxShadow: 'inset 0 1px 0 hsl(195,60%,52%), 0 0 16px hsl(195,60%,40%/0.3)',
          color: 'white',
        }}
      >
        <Play className="w-4 h-4" />
        {isFetching ? `Fetching ${fetchProgress?.done ?? 0}/${fetchProgress?.total ?? totalPoints}…` : `Fetch & Render ${totalPoints} Grid Points`}
      </button>
    </div>
  );
}