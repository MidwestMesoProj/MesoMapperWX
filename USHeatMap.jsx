import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
// Changed to Capital F
import { formatNumber } from './FormulaEngine'; 
import { lonLatToXY, xyToLonLat, STATE_LABELS, CITY_MARKERS, US_VIEWBOX } from './USMapSVG';
import MapModeForm from './MapModeForm';
// Changed to Capital F
import { parseApiResponse, evaluateFormula } from './FormulaEngine';

function lerpStops(stops, t, alpha = 210) {
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i], [t1, c1] = stops[i + 1];
    if (t >= t0 && t <= t1) {
      const f = (t - t0) / (t1 - t0);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * f),
        Math.round(c0[1] + (c1[1] - c0[1]) * f),
        Math.round(c0[2] + (c1[2] - c0[2]) * f),
        alpha,
      ];
    }
  }
  const last = stops[stops.length - 1][1];
  return [...last, alpha];
}

const COLOR_SCHEMES = {
  thermal:  (t) => lerpStops([[0,[10,10,40]],[0.15,[0,40,160]],[0.35,[0,180,210]],[0.55,[20,200,80]],[0.75,[255,220,0]],[0.9,[255,100,0]],[1.0,[255,20,20]]], t),
  viridis:  (t) => lerpStops([[0,[68,1,84]],[0.25,[59,82,139]],[0.5,[33,145,140]],[0.75,[94,201,98]],[1.0,[253,231,37]]], t),
  plasma:   (t) => lerpStops([[0,[13,8,135]],[0.25,[126,3,168]],[0.5,[204,71,120]],[0.75,[248,149,64]],[1.0,[240,249,33]]], t),
  inferno:  (t) => lerpStops([[0,[0,0,4]],[0.25,[87,16,110]],[0.5,[188,55,84]],[0.75,[251,160,38]],[1.0,[252,255,164]]], t),
  cool:     (t) => lerpStops([[0,[0,255,255]],[0.5,[128,0,255]],[1.0,[255,0,180]]], t),
  storm:    (t) => lerpStops([[0,[8,8,32]],[0.2,[0,30,120]],[0.45,[0,140,220]],[0.65,[80,220,100]],[0.82,[255,230,0]],[0.93,[255,80,0]],[1.0,[220,0,220]]], t),
  divergent:(t) => lerpStops([[0,[0,100,220]],[0.35,[100,180,255]],[0.5,[245,245,245]],[0.65,[255,160,100]],[1.0,[200,0,0]]], t),
  classic:  (t) => [Math.round(t*255), Math.round(50+(1-Math.abs(t-0.5)*2)*160), Math.round((1-t)*255), 210],
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

// Convert config name to match api standard
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

function parseBulkResponse(jsonArray, section, formula) {
  return jsonArray.map(json => {
    if (!json || json.error) return null;
    const parsed = parseApiResponse(json);
    const sectionData = parsed[section];
    if (!sectionData || !sectionData.data || !sectionData.data.length) return null;
    return sectionData.data.map(row => ({
      time: row.time,
      value: evaluateFormula(formula, row),
    })).filter(r => r.value !== null);
  });
}

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
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchProgress, setFetchProgress] = useState(null);
  const [gridData, setGridData] = useState(null);
  const [timeIdx, setTimeIdx] = useState(0);
  const [colorScheme, setColorScheme] = useState('thermal');
  const [hoveredCell, setHoveredCell] = useState(null);
  const [error, setError] = useState('');
  const [useBulk, setUseBulk] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gridData) return;
    const ctx = canvas.getContext('2d');
    const W = 960, H = 600;
    canvas.width = W;
    canvas.height = H;
    ctx.clearRect(0, 0, W, H);

    const { points, timeSteps, cols, rows } = gridData;
    const step = timeSteps[Math.min(timeIdx, timeSteps.length - 1)];
    if (!step) return;

    const values = step.map(v => v?.value);
    const valid = values.filter(v => v != null && isFinite(v));
    if (!valid.length) return;

    const minV = Math.min(...valid);
    const maxV = Math.max(...valid);
    const range = maxV - minV || 1;
    const colorFn = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.thermal;

    ctx.fillStyle = 'hsl(215,22%,16%)';
    ctx.fillRect(0, 0, W, H);

    const [gridX0, gridY0] = lonLatToXY(GRID_LON_MIN, GRID_LAT_MAX);
    const [gridX1, gridY1] = lonLatToXY(GRID_LON_MAX, GRID_LAT_MIN);
    const gridPxW = gridX1 - gridX0;
    const gridPxH = gridY1 - gridY0;
    const cellPxW = gridPxW / cols;
    const cellPxH = gridPxH / rows;

    for (let i = 0; i < points.length; i++) {
      const { col, row } = points[i];
      const val = values[i];
      if (val == null || !isFinite(val)) continue;

      const t = Math.max(0, Math.min(1, (val - minV) / range));
      const [r, g, b, a] = colorFn(t);

      const px = Math.round(gridX0 + col * cellPxW);
      const py = Math.round(gridY0 + row * cellPxH);
      const pw = Math.round(gridX0 + (col + 1) * cellPxW) - px;
      const ph = Math.round(gridY0 + (row + 1) * cellPxH) - py;

      ctx.fillStyle = `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`;
      ctx.fillRect(px, py, Math.max(1, pw), Math.max(1, ph));
    }
  }, [gridData, timeIdx, colorScheme]);

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
              if (!sectionData) break;
              results[i + bi] = sectionData.data.map(row => ({
                time: row.time,
                value: evaluateFormula(config.formula, row),
              }));
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

  const handleCanvasHover = (e) => {
    if (!gridData || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 960;
    const y = ((e.clientY - rect.top) / rect.height) * 600;
    const [lon, lat] = xyToLonLat(x, y);

    const { points, timeSteps } = gridData;
    const step = timeSteps[timeIdx];
    if (!step) return;

    const cellLonW = (GRID_LON_MAX - GRID_LON_MIN) / gridData.cols;
    const cellLatH = (GRID_LAT_MAX - GRID_LAT_MIN) / gridData.rows;

    const idx = points.findIndex(p =>
      Math.abs(p.lon - lon) < cellLonW / 2 &&
      Math.abs(p.lat - lat) < cellLatH / 2
    );
    if (idx >= 0 && step[idx]) {
      setHoveredCell({ ...points[idx], value: step[idx].value, x: e.clientX, y: e.clientY });
    } else {
      setHoveredCell(null);
    }
  };

  return (
    <div className="space-y-4">
      <MapModeForm onFetch={(cfg) => handleFetch({ ...cfg, useBulk })} isFetching={isFetching} fetchProgress={fetchProgress} useBulk={useBulk} onToggleBulk={setUseBulk} />

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {gridData && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid hsl(215,18%,20%)' }}>
              {Object.keys(COLOR_SCHEMES).map(cs => (
                <button
                  key={cs}
                  onClick={() => setColorScheme(cs)}
                  className="h-7 px-3 text-xs font-medium transition-all capitalize"
                  style={{
                    background: colorScheme === cs ? 'hsl(220,14%,20%)' : 'hsl(220,12%,14%)',
                    color: colorScheme === cs ? 'hsl(210,25%,85%)' : 'hsl(210,12%,48%)',
                    borderRight: cs !== 'classic' ? '1px solid hsl(215,18%,20%)' : 'none',
                  }}
                >
                  {cs}
                </button>
              ))}
            </div>

            {stepStats && (
              <div className="flex items-center gap-3 ml-auto text-[10px] font-mono">
                <span className="text-muted-foreground">min <span className="text-blue-400">{formatNumber(stepStats.min)}</span></span>
                <span className="text-muted-foreground">avg <span className="text-amber-400">{formatNumber(stepStats.avg)}</span></span>
                <span className="text-muted-foreground">max <span className="text-red-400">{formatNumber(stepStats.max)}</span></span>
              </div>
            )}

            {timeLabel && (
              <span className="text-[10px] font-mono text-accent">{timeLabel}</span>
            )}
          </div>

          <div
            className="rounded-xl overflow-hidden relative select-none"
            style={{ background: 'hsl(215,22%,16%)', border: '1px solid hsl(215,18%,20%)', boxShadow: 'inset 0 1px 0 hsl(215,22%,22%)' }}
          >
            <div className="relative w-full" style={{ paddingBottom: '62.5%' }}>
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ imageRendering: gridData && gridData.cols >= 20 ? 'auto' : 'pixelated' }}
              />

              <svg
                ref={svgRef}
                viewBox={US_VIEWBOX}
                className="absolute inset-0 w-full h-full cursor-crosshair"
                style={{ display: 'block' }}
                onMouseMove={handleCanvasHover}
                onMouseLeave={() => setHoveredCell(null)}
              >
                {STATE_LABELS.map(([lon, lat, abbr]) => {
                  const [x, y] = lonLatToXY(lon, lat);
                  return (
                    <text key={abbr} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
                      fontSize={9} fill="rgba(255,255,255,0.75)" fontFamily="monospace" fontWeight="700"
                      style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                      {abbr}
                    </text>
                  );
                })}

                {CITY_MARKERS.map(([lon, lat, name]) => {
                  const [x, y] = lonLatToXY(lon, lat);
                  const isLarge = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Dallas', 'Miami', 'Seattle', 'San Francisco'].includes(name);
                  return (
                    <g key={name} style={{ pointerEvents: 'none' }}>
                      <circle cx={x} cy={y} r={isLarge ? 3 : 2} fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.5)" strokeWidth={0.8} />
                      <text x={x} y={y - 5} textAnchor="middle" fontSize={isLarge ? 7 : 6}
                        fill="rgba(255,255,255,0.85)" fontFamily="sans-serif"
                        style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.7)', strokeWidth: 2, strokeLinejoin: 'round' }}>
                        {name}
                      </text>
                    </g>
                  );
                })}

                {[-120, -110, -100, -90, -80, -70].map(lon => {
                  const [x] = lonLatToXY(lon, 37);
                  return (
                    <g key={lon}>
                      <line x1={x} y1={18} x2={x} y2={582} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
                      <text x={x} y={594} textAnchor="middle" fontSize={7.5} fill="rgba(180,210,240,0.5)">{lon}°</text>
                    </g>
                  );
                })}
                {[30, 35, 40, 45].map(lat => {
                  const [, y] = lonLatToXY(-127, lat);
                  return (
                    <g key={lat}>
                      <line x1={18} y1={y} x2={942} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
                      <text x={12} y={y + 3} textAnchor="middle" fontSize={7.5} fill="rgba(180,210,240,0.5)">{lat}°</text>
                    </g>
                  );
                })}

                <text x={480} y={14} textAnchor="middle" fontSize={9} fill="rgba(160,200,240,0.7)" fontFamily="monospace">
                  {gridData.formula}  ·  {gridData.cols}×{gridData.rows} grid  ·  {gridData.config?.model}
                </text>
              </svg>

              <div className="absolute top-4 right-3 flex gap-1.5 items-start">
                <div className="flex flex-col items-end gap-0.5">
                  {stepStats && <>
                    <span className="text-[9px] font-mono text-white/60">{formatNumber(stepStats.max, 1)}</span>
                    <span className="text-[9px] font-mono text-white/30" style={{ marginTop: 28 }}>{formatNumber(stepStats.avg, 1)}</span>
                    <span className="text-[9px] font-mono text-white/60" style={{ marginTop: 28 }}>{formatNumber(stepStats.min, 1)}</span>
                  </>}
                </div>
                <div className="w-3 rounded-sm" style={{ height: 80, background: LEGEND_GRADIENTS[colorScheme] }} />
              </div>

              {hoveredCell && (
                <div
                  className="pointer-events-none absolute z-20 rounded-lg px-2.5 py-1.5 text-xs shadow-xl"
                  style={{
                    left: Math.min(hoveredCell.x - (svgRef.current?.getBoundingClientRect().left ?? 0) + 8, (svgRef.current?.clientWidth ?? 300) - 130),
                    top: hoveredCell.y - (svgRef.current?.getBoundingClientRect().top ?? 0) - 48,
                    background: 'hsl(220,18%,14%)',
                    border: '1px solid hsl(215,22%,28%)',
                  }}
                >
                  <div className="font-mono text-[10px] text-muted-foreground">{hoveredCell.lat.toFixed(2)}°N {Math.abs(hoveredCell.lon).toFixed(2)}°W</div>
                  <div className="font-mono font-bold text-accent">{formatNumber(hoveredCell.value)}</div>
                </div>
              )}
            </div>
          </div>

          {/* 2. Swapped custom Slider for standard HTML input slider */}
          {gridData.times && gridData.times.length > 1 && (
            <div className="space-y-2 px-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Time Step</span>
                <span className="text-[10px] font-mono text-primary">{timeLabel}</span>
              </div>
              <input 
                type="range"
                min={0}
                max={gridData.times.length - 1}
                value={timeIdx}
                step={1}
                onChange={(e) => setTimeIdx(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[9px] font-mono text-muted-foreground/50">
                <span>{gridData.times[0] ? new Date(gridData.times[0] * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Start'}</span>
                <span>{gridData.times.length} steps</span>
                <span>{gridData.times.at(-1) ? new Date(gridData.times.at(-1) * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'End'}</span>
              </div>
            </div>
          )}
        </>
      )}

      {!gridData && !isFetching && (
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground/60">Configure and fetch above to render a real-data heatmap</p>
        </div>
      )}
    </div>
  );
}
