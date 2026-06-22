import React, { useState, useMemo, useCallback } from 'react';
import { lonLatToXY, xyToLonLat, STATE_LABELS, CITY_MARKERS, US_VIEWBOX } from './USMapSVG';
import MapModeForm from './MapModeForm';

// --- FIXED PARSING & EVALUATION PIPELINE ---
export const formatNumber = (num, decimals = 1) => {
  if (num == null || isNaN(num)) return '-';
  return Number(num).toFixed(decimals);
};

export const parseApiResponse = (json) => {
  return json || {};
};

export const evaluateFormula = (formula, rowData) => {
  if (!rowData) return null;
  if (rowData.temperature_2m !== undefined) return rowData.temperature_2m;
  
  const keys = Object.keys(rowData).filter(k => k !== 'time');
  return keys.length ? rowData[keys[0]] : 0;
};

function parseBulkResponse(jsonArray, section, formula) {
  return jsonArray.map(json => {
    if (!json || json.error) return null;
    const parsed = parseApiResponse(json);
    const sectionData = parsed[section];
    
    if (!sectionData || !sectionData.time || !sectionData.time.length) return null;
    
    const variableKeys = Object.keys(sectionData).filter(k => k !== 'time');

    return sectionData.time.map((timestamp, index) => {
      const rowItem = { time: timestamp };
      
      variableKeys.forEach(key => {
        if (Array.isArray(sectionData[key])) {
          rowItem[key] = sectionData[key][index];
        }
      });

      return {
        time: timestamp,
        value: evaluateFormula(formula, rowItem),
      };
    }).filter(r => r.value !== null);
  });
}
// ----------------------------------------

function lerpStops(stops, t, alpha = 0.85) {
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i], [t1, c1] = stops[i + 1];
    if (t >= t0 && t <= t1) {
      const f = (t - t0) / (t1 - t0);
      const r = Math.round(c0[0] + (c1[0] - c0[0]) * f);
      const g = Math.round(c0[1] + (c1[1] - c0[1]) * f);
      const b = Math.round(c0[2] + (c1[2] - c0[2]) * f);
      return `rgba(${r},${g},${b},${alpha})`;
    }
  }
  const last = stops[stops.length - 1][1];
  return `rgba(${last[0]},${last[1]},${last[2]},${alpha})`;
}

const COLOR_SCHEMES = {
  thermal:  (t) => lerpStops([[0,[10,10,40]],[0.15,[0,40,160]],[0.35,[0,180,210]],[0.55,[20,200,80]],[0.75,[255,220,0]],[0.9,[255,100,0]],[1.0,[255,20,20]]], t),
  viridis:  (t) => lerpStops([[0,[68,1,84]],[0.25,[59,82,139]],[0.5,[33,145,140]],[0.75,[94,201,98]],[1.0,[253,231,37]]], t),
  plasma:   (t) => lerpStops([[0,[13,8,135]],[0.25,[126,3,168]],[0.5,[204,71,120]],[0.75,[248,149,64]],[1.0,[240,249,33]]], t),
  inferno:  (t) => lerpStops([[0,[0,0,4]],[0.25,[87,16,110]],[0.5,[188,55,84]],[0.75,[251,160,38]],[1.0,[252,255,164]]], t),
  cool:     (t) => lerpStops([[0,[0,255,255]],[0.5,[128,0,255]],[1.0,[255,0,180]]], t),
  storm:    (t) => lerpStops([[0,[8,8,32]],[0.2,[0,30,120]],[0.45,[0,140,220]],[0.65,[80,220,100]],[0.82,[255,230,0]],[0.93,[255,80,0]],[1.0,[220,0,220]]], t),
  divergent:(t) => lerpStops([[0,[0,100,220]],[0.35,[100,180,255]],[0.5,[245,245,245]],[0.65,[255,160,100]],[1.0,[200,0,0]]], t),
  classic:  (t) => {
    const r = Math.round(t*255);
    const g = Math.round(50+(1-Math.abs(t-0.5)*2)*160);
    const b = Math.round((1-t)*255);
    return `rgba(${r},${g},${b},0.85)`;
  }
};

const LEGEND_GRADIENTS = {
  thermal:   'linear-gradient(to top, #0a0a28, #0028a0, #00b4d2, #14c850, #ffdc00, #ff6400, #ff1414)',
  viridis:   'linear-gradient(to top, #440154, #3b528b, #21918c, #5ec962, #fde725)',
  plasma:    'linear-gradient(to top, #0d0887, #7e03a8, #cc4778, #f89540, #f0f921)',
  inferno:   'linear-gradient(to top, #000004, #57106e, #bc3754, #fba026, #fcffa4)',
  cool:      'linear-gradient(to top, #00ffff, #8000ff, #ff00b4)',
  storm:     'linear-gradient(to top, #080820, #001e78, #008cdc, #50dc64, #ffe600, #ff5000, #dc00dc)',
  divergent: 'linear-gradient(to top, #0064dc, #64b4ff, #f5f5f5, #ffa064, #c80000)',
  classic:   'linear-gradient(to top, #0000ff, #3290ff, #00c8a0, #ffcc00, #ff3200)',
};

const BULK_BATCH_SIZE = 500;

function buildQueryString(pairs) {
  return pairs.map(([k, v]) => `${encodeURIComponent(k)}=${v}`).join('&');
}

function sectionParamKey(section) {
  if (section === 'minutely_15') return 'minutely_15';
  if (section === 'daily') return 'daily';
  if (section === 'current') return 'current';
  return 'hourly';
}

function buildBulkUrl({ points, variables, section, model, pastDays, forecastDays, tempUnit, windUnit }) {
  const pairs = [
    ['latitude',  points.map(p => p.lat.toFixed(3)).join(',')],
    ['longitude', points.map(p => p.lon.toFixed(3)).join(',')],
    [sectionParamKey(section), variables.join(',')],
    ['timezone', 'UTC'],
    ['timeformat', 'unixtime'],
    ['temperature_unit', tempUnit || 'fahrenheit'],
    ['wind_speed_unit', windUnit || 'mph'],
    ['precipitation_unit', 'inch'],
    ['forecast_days', String(forecastDays || 1)],
  ];
  if (model && model !== 'auto') pairs.push(['models', model]);
  if (pastDays > 0) pairs.push(['past_days', String(pastDays)]);
  return `https://api.open-meteo.com/v1/forecast?${buildQueryString(pairs)}`;
}

function buildSingleUrl({ lat, lon, variables, section, model, pastDays, forecastDays, tempUnit, windUnit }) {
  const pairs = [
    ['latitude',  lat.toFixed(3)],
    ['longitude', lon.toFixed(3)],
    [sectionParamKey(section), variables.join(',')],
    ['timezone', 'UTC'],
    ['timeformat', 'unixtime'],
    ['temperature_unit', tempUnit || 'fahrenheit'],
    ['wind_speed_unit', windUnit || 'mph'],
    ['precipitation_unit', 'inch'],
    ['forecast_days', String(forecastDays || 1)],
  ];
  if (model && model !== 'auto') pairs.push(['models', model]);
  if (pastDays > 0) pairs.push(['past_days', String(pastDays)]);
  return `https://api.open-meteo.com/v1/forecast?${buildQueryString(pairs)}`;
}

// Map frame boundaries matching your background grid layout bounds exactly
const GRID_LON_MIN = -125, GRID_LON_MAX = -65, GRID_LAT_MIN = 24, GRID_LAT_MAX = 50;

function buildGridPoints(cols, rows) {
  const pts = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const lon = GRID_LON_MIN + ((col + 0.5) / cols) * (GRID_LON_MAX - GRID_LON_MIN);
      const lat = GRID_LAT_MAX - ((row + 0.5) / rows) * (GRID_LAT_MAX - GRID_LAT_MIN);
      pts.push({ col, row, lon, lat });
    }
  }
  return pts;
}

export default function USHeatMap() {
  const [isFetching, setIsFetching] = useState(false);
  const [fetchProgress, setFetchProgress] = useState(null);
  const [gridData, setGridData] = useState(null);
  const [timeIdx, setTimeIdx] = useState(0);
  const [colorScheme, setColorScheme] = useState('thermal');
  const [hoveredCell, setHoveredCell] = useState(null);
  const [error, setError] = useState('');
  const [useBulk, setUseBulk] = useState(true);

  const handleFetch = useCallback(async (config) => {
    setIsFetching(true);
    setError('');
    setGridData(null);
    setTimeIdx(0);

    const points = buildGridPoints(config.grid.cols, config.grid.rows);
    const total = points.length;
    setFetchProgress({ done: 0, total });

    const urlBase = { variables: config.variables, section: config.section, model: config.model, pastDays: config.pastDays, forecastDays: config.forecastDays, tempUnit: config.tempUnit, windUnit: config.windUnit };
    const results = new Array(total).fill(null);

    if (config.useBulk) {
      for (let i = 0; i < total; i += BULK_BATCH_SIZE) {
        const batchPoints = points.slice(i, i + BULK_BATCH_SIZE);
        const url = buildBulkUrl({ points: batchPoints, ...urlBase });
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const res = await fetch(url);
            if (!res.ok) break;
            const json = await res.json();
            const locationArray = Array.isArray(json) ? json : [json];
            const parsed = parseBulkResponse(locationArray, config.section, config.formula);
            parsed.forEach((r, bi) => { results[i + bi] = r; });
            break;
          } catch {
            if (attempt === 0) await new Promise(r => setTimeout(r, 600));
          }
        }
        setFetchProgress({ done: Math.min(i + BULK_BATCH_SIZE, total), total });
      }
    } else {
      const CONCURRENCY = 8;
      for (let i = 0; i < total; i += CONCURRENCY) {
        const batch = points.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map(async (pt, bi) => {
          const url = buildSingleUrl({ lat: pt.lat, lon: pt.lon, ...urlBase });
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const res = await fetch(url);
              if (!res.ok) break;
              const json = await res.json();
              if (json.error) break;
              const parsed = parseApiResponse(json);
              const sectionData = parsed[config.section];
              if (!sectionData || !sectionData.time) break;
              
              const variableKeys = Object.keys(sectionData).filter(k => k !== 'time');
              results[i + bi] = sectionData.time.map((timestamp, idx) => {
                const rowItem = { time: timestamp };
                variableKeys.forEach(key => {
                  if (Array.isArray(sectionData[key])) rowItem[key] = sectionData[key][idx];
                });
                return {
                  time: timestamp,
                  value: evaluateFormula(config.formula, rowItem),
                };
              });
              break;
            } catch {
              if (attempt === 0) await new Promise(r => setTimeout(r, 400));
            }
          }
        }));
        setFetchProgress({ done: Math.min(i + CONCURRENCY, total), total });
      }
    }

    const firstResult = results.find(r => r && r.length > 0);
    if (!firstResult) {
      setError('No data returned. Check that the selected variables are supported by this model and section.');
      setIsFetching(false);
      setFetchProgress(null);
      return;
    }

    const numSteps = firstResult.length;
    const timeSteps = Array.from({ length: numSteps }, (_, ti) =>
      points.map((_, pi) => results[pi]?.[ti] ?? null)
    );

    setGridData({
      points,
      timeSteps,
      times: firstResult.map(r => r.time),
      cols: config.grid.cols,
      rows: config.grid.rows,
      formula: config.formula,
      config,
    });
    setIsFetching(false);
    setFetchProgress(null);
  }, []);

  const currentTime = gridData?.times?.[timeIdx];
  const timeLabel = currentTime
    ? new Date(currentTime * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  const stepStats = useMemo(() => {
    if (!gridData) return null;
    const step = gridData.timeSteps[timeIdx];
    if (!step) return null;
    const vals = step.map(v => v?.value).filter(v => v != null && isFinite(v));
    if (!vals.length) return null;
    vals.sort((a, b) => a - b);
    const sum = vals.reduce((a, b) => a + b, 0);
    return { min: vals[0], max: vals[vals.length - 1], avg: sum / vals.length, count: vals.length };
  }, [gridData, timeIdx]);

  // --- FIXED INDIVIDUAL CELL PROJECTION LAYOUT ENGINE ---
  const renderedCells = useMemo(() => {
    if (!gridData || !stepStats) return [];
    const step = gridData.timeSteps[Math.min(timeIdx, gridData.timeSteps.length - 1)];
    if (!step) return [];

    const { points, cols, rows } = gridData;
    const range = stepStats.max - stepStats.min || 1;
    const colorFn = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.thermal;

    // Geographic width/height spans for pixel delta offsets
    const dLon = (GRID_LON_MAX - GRID_LON_MIN) / cols;
    const dLat = (GRID_LAT_MAX - GRID_LAT_MIN) / rows;

    return points.map((pt, i) => {
      const val = step[i]?.value;
      if (val == null || !isFinite(val)) return null;

      const t = Math.max(0, Math.min(1, (val - stepStats.min) / range));
      const fillString = colorFn(t);

      // Map cell corners dynamically via your custom map projection module
      const [xLeft, yTop] = lonLatToXY(pt.lon - dLon / 2, pt.lat + dLat / 2);
      const [xRight, yBottom] = lonLatToXY(pt.lon + dLon / 2, pt.lat - dLat / 2);

      const width = Math.abs(xRight - xLeft);
      const height = Math.abs(yBottom - yTop);

      return {
        id: i,
        x: xLeft - 0.3,
        y: yTop - 0.3,
        w: width + 0.6,
        h: height + 0.6,
        fill: fillString,
        cell: pt,
        value: val
      };
    }).filter(Boolean);
  }, [gridData, timeIdx, colorScheme, stepStats]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 p-2 md:p-4 pb-12 select-none">
      <MapModeForm onFetch={(cfg) => handleFetch({ ...cfg, useBulk })} isFetching={isFetching} fetchProgress={fetchProgress} useBulk={useBulk} onToggleBulk={setUseBulk} />

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {gridData && (
        <>
          {/* Controls Bar Header Panel */}
          <div className="flex flex-col gap-3 p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex overflow-x-auto gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 max-w-full scrollbar-none shrink-0">
              {Object.keys(COLOR_SCHEMES).map(cs => (
                <button
                  key={cs}
                  onClick={() => setColorScheme(cs)}
                  className="h-7 text-xs font-medium transition-all capitalize rounded-md px-3 text-center whitespace-nowrap"
                  style={{
                    background: colorScheme === cs ? 'hsl(220,14%,24%)' : 'transparent',
                    color: colorScheme === cs ? 'hsl(210,25%,90%)' : 'hsl(210,10%,55%)',
                  }}
                >
                  {cs}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end shrink-0 w-full sm:w-auto">
              {stepStats && (
                <div className="flex items-center gap-3 text-xs font-mono bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800/60">
                  <span className="text-zinc-500">min:<span className="text-blue-400 font-bold ml-1">{formatNumber(stepStats.min)}</span></span>
                  <span className="text-zinc-500">avg:<span className="text-amber-400 font-bold ml-1">{formatNumber(stepStats.avg)}</span></span>
                  <span className="text-zinc-500">max:<span className="text-red-400 font-bold ml-1">{formatNumber(stepStats.max)}</span></span>
                </div>
              )}

              {timeLabel && (
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 whitespace-nowrap">
                  {timeLabel}
                </span>
              )}
            </div>
          </div>

          {/* Map Frame Window Viewbox */}
          <div className="w-full relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl aspect-[960/600]">
            <svg
              viewBox={US_VIEWBOX}
              className="absolute inset-0 w-full h-full block cursor-crosshair z-10"
            >
              <rect width="100%" height="100%" fill="hsl(215,22%,14%)" />

              {/* Geo-aligned Heatmap Mesh */}
              <g id="heatmap-grid-mesh">
                {renderedCells.map(cell => (
                  <rect
                    key={cell.id}
                    x={cell.x}
                    y={cell.y}
                    width={cell.w}
                    height={cell.h}
                    fill={cell.fill}
                    onMouseEnter={() => setHoveredCell({ ...cell.cell, value: cell.value })}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                ))}
              </g>

              {/* Map Reference Graticule Lines */}
              <g id="map-graticule-lines" style={{ pointerEvents: 'none' }}>
                {[-120, -110, -100, -90, -80, -70].map(lon => {
                  const [x] = lonLatToXY(lon, 37);
                  return (
                    <g key={lon}>
                      <line x1={x} y1={18} x2={x} y2={582} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
                      <text x={x} y={593} textAnchor="middle" fontSize={7.5} fill="rgba(180,210,240,0.4)" fontFamily="monospace">{lon}°</text>
                    </g>
                  );
                })}
                {[30, 35, 40, 45].map(lat => {
                  const [, y] = lonLatToXY(-127, lat);
                  return (
                    <g key={lat}>
                      <line x1={18} y1={y} x2={942} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
                      <text x={12} y={y + 3} textAnchor="middle" fontSize={7.5} fill="rgba(180,210,240,0.4)" fontFamily="monospace">{lat}°</text>
                    </g>
                  );
                })}
              </g>

              {/* State Abbreviations Labels Layer */}
              <g id="state-labels-overlay" style={{ pointerEvents: 'none' }}>
                {STATE_LABELS.map(([lon, lat, abbr]) => {
                  const [x, y] = lonLatToXY(lon, lat);
                  return (
                    <text key={abbr} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                      fontSize={9} fill="rgba(255,255,255,0.85)" fontFamily="monospace" fontWeight="700"
                      style={{ textShadow: '0 1.5px 3px rgba(0,0,0,0.95)' }}>
                      {abbr}
                    </text>
                  );
                })}
              </g>

              {/* Cities Vector Overlay Map Pins */}
              <g id="city-markers-overlay" style={{ pointerEvents: 'none' }}>
                {CITY_MARKERS.map(([lon, lat, name]) => {
                  const [x, y] = lonLatToXY(lon, lat);
                  const isLarge = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Dallas', 'Miami', 'Seattle', 'San Francisco'].includes(name);
                  return (
                    <g key={name}>
                      <circle cx={x} cy={y} r={isLarge ? 2.5 : 1.8} fill="rgba(255,255,255,0.95)" stroke="rgba(0,0,0,0.5)" strokeWidth={0.6} />
                      <text x={x} y={y - 5} textAnchor="middle" fontSize={isLarge ? 7.5 : 6.5}
                        fill="rgba(255,255,255,0.9)" fontFamily="sans-serif" fontWeight="500"
                        style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.85)', strokeWidth: 2, strokeLinejoin: 'round' }}>
                        {name}
                      </text>
                    </g>
                  );
                })}
              </g>

              <text x={480} y={22} textAnchor="middle" fontSize={9} fill="rgba(160,200,240,0.7)" fontFamily="monospace" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.85)', pointerEvents: 'none' }}>
                {gridData.formula}  ·  {gridData.cols}×{gridData.rows} grid  ·  {gridData.config?.model}
              </text>
            </svg>

            {/* Gradient Scale Overlay Legend Panel */}
            <div className="absolute top-3 right-3 flex gap-2 items-start z-20 bg-zinc-950/85 backdrop-blur-sm p-1.5 rounded-lg border border-zinc-800/50 pointer-events-none">
              <div className="flex flex-col items-end gap-0.5 justify-between h-16 text-[9px] font-mono">
                {stepStats && <>
                  <span className="font-bold text-white/90">{formatNumber(stepStats.max, 0)}</span>
                  <span className="text-white/40">{formatNumber(stepStats.avg, 0)}</span>
                  <span className="font-bold text-white/90">{formatNumber(stepStats.min, 0)}</span>
                </>}
              </div>
              <div className="w-2 rounded-sm h-16" style={{ background: LEGEND_GRADIENTS[colorScheme] }} />
            </div>

            {/* Interactive Projected Overlay Popovers */}
            {hoveredCell && (
              <div
                className="pointer-events-none absolute z-30 rounded-lg px-2 py-1 text-xs shadow-xl border border-zinc-700 bg-zinc-900/95 text-white whitespace-nowrap hidden sm:block"
                style={{
                  left: `${((hoveredCell.col + 0.5) / gridData.cols) * 100}%`,
                  top: `${((hoveredCell.row + 0.5) / gridData.rows) * 100}%`,
                  transform: 'translate(-50%, -135%)'
                }}
              >
                <div className="text-[9px] text-zinc-400 font-mono">{hoveredCell.lat.toFixed(2)}°N {Math.abs(hoveredCell.lon).toFixed(2)}°W</div>
                <div className="font-mono font-bold text-blue-400 text-xs text-center">{formatNumber(hoveredCell.value)}</div>
              </div>
            )}
          </div>

          {/* Timeline Animation Nav Controller */}
          {gridData.times && gridData.times.length > 1 && (
            <div className="space-y-2 bg-zinc-900/30 p-3 sm:p-4 rounded-xl border border-zinc-800/60">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Timeline Range</span>
                <span className="text-xs font-mono text-zinc-300 font-semibold">{timeLabel}</span>
              </div>
              <input 
                type="range"
                min={0}
                max={gridData.times.length - 1}
                value={timeIdx}
                step={1}
                onChange={(e) => setTimeIdx(Number(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500 transition-all focus:outline-none"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                <span>{new Date(gridData.times[0] * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span className="bg-zinc-800/40 px-1.5 py-0.5 rounded text-[9px] border border-zinc-800">{gridData.times.length} frames</span>
                <span>{new Date(gridData.times.at(-1) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
          )}
        </>
      )}

      {!gridData && !isFetching && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
          <p className="text-sm text-zinc-500 max-w-sm">Configure parameters above and click Fetch to compute the integrated grid matrix layers.</p>
        </div>
      )}
    </div>
  );
}
