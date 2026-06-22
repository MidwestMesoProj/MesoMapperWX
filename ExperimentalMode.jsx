import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FlaskConical } from 'lucide-react';

// ── Variable sets (expanded with user's API params) ────────────────────────
const COMMON_HOURLY = [
  'temperature_2m','dew_point_2m','precipitation','precipitation_probability',
  'pressure_msl','surface_pressure','cloud_cover_high','cloud_cover_300hPa',
  'visibility','wind_speed_10m','wind_gusts_10m','wind_direction_10m',
  'cape','lifted_index','relative_humidity_2m','snowfall','snow_depth',
  'shortwave_radiation','direct_radiation','diffuse_radiation',
  'rain','showers','uv_index',
  'total_column_integrated_water_vapour',
  'thunderstorm_probability','rain_probability','snowfall_probability',
  'et0_fao_evapotranspiration',
];
const COMMON_DAILY = [
  'temperature_2m_max','temperature_2m_min',
  'wind_gusts_10m_max','wind_speed_10m_max',
  'cape_max','precipitation_sum','precipitation_hours',
  'rain_sum','uv_index_max',
  'sunrise','sunset','visibility_min','dew_point_2m_max',
];
const COMMON_MINUTELY = [
  'temperature_2m','dew_point_2m','precipitation','rain',
  'wind_speed_10m','wind_gusts_10m','wind_direction_10m',
  'visibility','cape','lightning_potential',
];
const COMMON_CURRENT = [
  'temperature_2m','wind_gusts_10m','wind_speed_10m',
  'precipitation','rain','showers','snowfall',
  'relative_humidity_2m','apparent_temperature',
];

// ── Model registry ─────────────────────────────────────────────────────────
const MODEL_GROUPS = [
  {
    group: 'GFS / HRRR (NCEP)',
    color: 'hsl(195,60%,40%)',
    models: [
      { id: 'gfs_hrrr',                    label: 'GFS HRRR',               desc: '3km CONUS rapid-refresh' },
      { id: 'gfs_global',                  label: 'GFS Global',              desc: '0.25° global, 6-h cycle' },
      { id: 'gfs_seamless',                label: 'GFS Seamless',            desc: 'HRRR + Global blend' },
      { id: 'ncep_hgefs025_ensemble_mean', label: 'GEFS 0.25° Ensemble',     desc: 'Global ensemble mean' },
      { id: 'ncep_nam_conus',              label: 'NAM CONUS',               desc: '12km North America' },
    ],
  },
  {
    group: 'ECMWF',
    color: 'hsl(270,55%,55%)',
    models: [
      { id: 'ecmwf_ifs',                   label: 'ECMWF IFS',               desc: 'High-res IFS (~9km)' },
      { id: 'ecmwf_ifs025',                label: 'ECMWF IFS 0.25°',         desc: 'Archive-resolution IFS' },
      { id: 'ecmwf_aifs025',               label: 'ECMWF AIFS 0.25°',        desc: 'AI-based forecast system' },
    ],
  },
  {
    group: 'ICON (DWD)',
    color: 'hsl(35,75%,50%)',
    models: [
      { id: 'icon_seamless',               label: 'ICON Seamless',           desc: 'ICON-D2 + EU + Global' },
      { id: 'icon_global',                 label: 'ICON Global',             desc: '13km global DWD model' },
      { id: 'icon_eu',                     label: 'ICON-EU',                 desc: '7km European domain' },
      { id: 'icon_d2',                     label: 'ICON-D2',                 desc: '2km Germany/Alpine' },
    ],
  },
  {
    group: 'Other',
    color: 'hsl(165,45%,40%)',
    models: [
      { id: 'gem_seamless',                label: 'GEM Seamless',            desc: 'ECCC Canada (HRDPS + GDPS)' },
      { id: 'gem_global',                  label: 'GEM Global',              desc: '25km global Environment Canada' },
      { id: 'meteofrance_seamless',        label: 'Météo-France',            desc: 'AROME + ARPEGE blend' },
      { id: 'jma_seamless',               label: 'JMA Seamless',            desc: 'Japan MSM + GSM' },
      { id: 'knmi_harmonie_arome_europe',  label: 'KNMI Harmonie',          desc: '5.5km European AROME' },
      { id: 'dmi_harmonie_arome_europe',   label: 'DMI Harmonie',           desc: '5.5km Scandinavia/Europe' },
    ],
  },
];

const ALL_MODELS = MODEL_GROUPS.flatMap(g => g.models.map(m => m.id));

function buildUrl({ lat, lon, hourly, daily, minutely, current, models, pastDays, forecastDays, tempUnit, windUnit, precipUnit, timezone }) {
  const params = new URLSearchParams();
  params.set('latitude', lat);
  params.set('longitude', lon);
  if (hourly.length) params.set('hourly', hourly.join(','));
  if (daily.length) params.set('daily', daily.join(','));
  if (minutely.length) params.set('minutely_15', minutely.join(','));
  if (current.length) params.set('current', current.join(','));
  if (models.length) params.set('models', models.join(','));
  params.set('timezone', timezone || 'auto');
  if (pastDays > 0) params.set('past_days', String(pastDays));
  params.set('forecast_days', String(forecastDays));
  params.set('timeformat', 'unixtime');
  params.set('temperature_unit', tempUnit);
  params.set('wind_speed_unit', windUnit);
  params.set('precipitation_unit', precipUnit);
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function toggle(arr, v) {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];
}

function VarToggleList({ label, allVars, selected, onToggle }) {
  const [search, setSearch] = useState('');
  const filtered = allVars.filter(v => v.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground uppercase tracking-wider">{label}</Label>
      <Input
        placeholder="Search…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="h-7 text-xs metal-surface border-border/40"
      />
      <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1.5 rounded-lg metal-surface border border-border/20">
        {filtered.map(v => {
          const on = selected.includes(v);
          return (
            <button
              key={v}
              onClick={() => onToggle(v)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                on
                  ? 'bg-accent/20 text-accent border-accent/30 shadow-[0_0_6px_hsl(195,60%,55%/0.2)]'
                  : 'metal-chip text-muted-foreground hover:text-foreground'
              }`}
            >
              {v}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground">{selected.length} selected</p>
    </div>
  );
}

export default function ExperimentalMode({ open, onOpenChange, onBuildUrl }) {
  const [lat, setLat] = useState('40');
  const [lon, setLon] = useState('-80');
  const [timezone, setTimezone] = useState('America/New_York');
  const [pastDays, setPastDays] = useState(0);
  const [forecastDays, setForecastDays] = useState(1);
  const [tempUnit, setTempUnit] = useState('fahrenheit');
  const [windUnit, setWindUnit] = useState('mph');
  const [precipUnit, setPrecipUnit] = useState('inch');
  const [hourly, setHourly] = useState([
    'temperature_2m','dew_point_2m','precipitation_probability','precipitation',
    'rain','showers','visibility','wind_speed_10m','wind_gusts_10m','wind_direction_10m',
    'uv_index','total_column_integrated_water_vapour','cape','lifted_index',
    'thunderstorm_probability','rain_probability','snowfall_probability','cloud_cover_300hPa',
  ]);
  const [daily, setDaily] = useState([
    'rain_sum','uv_index_max','wind_speed_10m_max','wind_gusts_10m_max',
    'precipitation_sum','temperature_2m_max','temperature_2m_min',
  ]);
  const [minutely, setMinutely] = useState([
    'cape','wind_gusts_10m','rain','precipitation','temperature_2m',
    'dew_point_2m','wind_direction_10m','wind_speed_10m','visibility',
  ]);
  const [current, setCurrent] = useState(['wind_gusts_10m','precipitation','showers','temperature_2m']);
  const [models, setModels] = useState(['gfs_hrrr','gfs_global','gfs_seamless','ncep_hgefs025_ensemble_mean','ncep_nam_conus']);
  const [preview, setPreview] = useState('');

  const generate = () => {
    const url = buildUrl({ lat, lon, hourly, daily, minutely, current, models, pastDays, forecastDays, tempUnit, windUnit, precipUnit, timezone });
    setPreview(url);
    return url;
  };

  const handleApply = () => {
    const url = generate();
    onBuildUrl(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="metal-panel border-0 max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(195,55%,32%) 0%, hsl(200,45%,22%) 100%)', boxShadow: '0 0 10px hsl(195,60%,40%/0.3)' }}>
              <FlaskConical className="w-3.5 h-3.5 text-accent" />
            </div>
            <span className="chrome-text font-bold">Experimental Mode</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Configure a custom Open-Meteo query. Supports GFS·HRRR·NAM·GEFS·ECMWF·ICON and more.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Location */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Latitude</Label>
              <Input value={lat} onChange={e => setLat(e.target.value)} className="h-8 text-sm metal-surface border-border/40" placeholder="40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Longitude</Label>
              <Input value={lon} onChange={e => setLon(e.target.value)} className="h-8 text-sm metal-surface border-border/40" placeholder="-80" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Timezone</Label>
              <Input value={timezone} onChange={e => setTimezone(e.target.value)} className="h-8 text-sm metal-surface border-border/40 font-mono" placeholder="America/New_York" />
            </div>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Past Days</Label>
              <Input type="number" min={0} max={92} value={pastDays} onChange={e => setPastDays(Number(e.target.value))} className="h-8 text-sm metal-surface border-border/40" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Forecast Days</Label>
              <Input type="number" min={0} max={16} value={forecastDays} onChange={e => setForecastDays(Number(e.target.value))} className="h-8 text-sm metal-surface border-border/40" />
            </div>
          </div>

          {/* Units */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Temperature</Label>
              <Select value={tempUnit} onValueChange={setTempUnit}>
                <SelectTrigger className="h-8 text-xs metal-surface border-border/40"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="fahrenheit">°F</SelectItem><SelectItem value="celsius">°C</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Wind Speed</Label>
              <Select value={windUnit} onValueChange={setWindUnit}>
                <SelectTrigger className="h-8 text-xs metal-surface border-border/40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mph">mph</SelectItem>
                  <SelectItem value="kmh">km/h</SelectItem>
                  <SelectItem value="kn">knots</SelectItem>
                  <SelectItem value="ms">m/s</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Precipitation</Label>
              <Select value={precipUnit} onValueChange={setPrecipUnit}>
                <SelectTrigger className="h-8 text-xs metal-surface border-border/40"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="inch">inch</SelectItem><SelectItem value="mm">mm</SelectItem></SelectContent>
              </Select>
            </div>
          </div>

          {/* Model selector */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Weather Models</Label>
            <div className="space-y-3 p-3 rounded-lg metal-surface border border-border/20">
              {MODEL_GROUPS.map(group => (
                <div key={group.group}>
                  <p className="text-[10px] uppercase tracking-wider mb-1.5 font-semibold" style={{ color: group.color }}>
                    {group.group}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.models.map(m => {
                      const on = models.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() => setModels(prev => toggle(prev, m.id))}
                          title={m.desc}
                          className={`px-2.5 py-1 rounded text-[10px] font-mono border transition-all ${
                            on
                              ? 'border-accent/40 text-accent shadow-[0_0_8px_hsl(195,60%,55%/0.25)]'
                              : 'metal-chip text-muted-foreground hover:text-foreground'
                          }`}
                          style={on ? { background: 'linear-gradient(135deg, hsl(195,40%,20%) 0%, hsl(200,35%,16%) 100%)' } : undefined}
                        >
                          {m.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground">{models.length} model{models.length !== 1 ? 's' : ''} selected · hover for description</p>
          </div>

          {/* Variable selectors */}
          <VarToggleList label="Hourly Variables" allVars={COMMON_HOURLY} selected={hourly} onToggle={v => setHourly(prev => toggle(prev, v))} />
          <VarToggleList label="Daily Variables" allVars={COMMON_DAILY} selected={daily} onToggle={v => setDaily(prev => toggle(prev, v))} />
          <VarToggleList label="15-Min Variables" allVars={COMMON_MINUTELY} selected={minutely} onToggle={v => setMinutely(prev => toggle(prev, v))} />
          <VarToggleList label="Current Variables" allVars={COMMON_CURRENT} selected={current} onToggle={v => setCurrent(prev => toggle(prev, v))} />

          {/* URL preview */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Generated URL</Label>
              <button onClick={generate} className="text-[10px] text-accent hover:text-accent/70 hover:underline transition-colors">Preview</button>
            </div>
            {preview && (
              <div className="p-2.5 rounded-lg metal-surface border border-border/20 font-mono text-[10px] text-muted-foreground break-all max-h-28 overflow-y-auto">
                {preview}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border/40 metal-chip text-muted-foreground hover:text-foreground">Cancel</Button>
          <Button onClick={handleApply}
            className="metal-button border-0 text-foreground font-semibold"
            style={{ background: 'linear-gradient(160deg, hsl(195,55%,38%) 0%, hsl(200,50%,28%) 50%, hsl(195,55%,34%) 100%)', boxShadow: 'inset 0 1px 0 hsl(195,60%,52%), 0 0 12px hsl(195,60%,40%/0.35)' }}
          >
            Apply &amp; Fetch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}