import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
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
  storm:
