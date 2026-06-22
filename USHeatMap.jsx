import React, { useState, useMemo, useCallback } from 'react';
import { lonLatToXY, xyToLonLat, STATE_LABELS, CITY_MARKERS, US_VIEWBOX } from './USMapSVG';
import MapModeForm from './MapModeForm';

// --- COORD BOUNDS DIRECTLY PARSED FROM YOUR MAP FILE ---
const LON_LEFT  = -127;
const LON_RIGHT = -63;
const LAT_TOP   = 50.5;
const LAT_BOT   = 23.5;
const PAD_L = 18, PAD_R = 18, PAD_T = 18, PAD_B = 18;

export const formatNumber = (num, decimals = 1) => {
  if (num == null || isNaN(num)) return '-';
  return Number(num).toFixed(decimals);
};

export const parseApiResponse = (json) => {
  return json || {};
};

// --- DYNAMIC EQUATION/FORMULA EVALUATION ENGINE ---
export const evaluateFormula = (formula, rowData) => {
  if (!rowData) return null;
  
  // Clean up potential layout variables from the string input
  let parsedFormula = formula
    .replace(/current\./g, '')
    .replace(/hourly\./g, '')
    .replace(/daily\./g, '')
    .replace(/minutely_15\./g, '');

  try {
    // Create a safe sandbox array of row variables to map against
    const keys = Object.keys(rowData);
    const values = Object.values(rowData);
    
    // Execute dynamic formula evaluation mapping directly to parameters
    const exprFunc = new Function(...keys, `return (${parsedFormula});`);
    const result = exprFunc(...values);
    
    return isNaN(result) || result == null ? 0 : result;
  } catch (err) {
    // Fallback if the expression equation is half-typed or broken
    const fallbackKeys = Object.keys(rowData).filter(k => k !== 'time');
    return fallbackKeys.length ? rowData[fallbackKeys[0]] : 0;
  }
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

const BULK_BATCH_SIZE = 450;

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
