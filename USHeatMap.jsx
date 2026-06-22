import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
// 1. Removed the missing shadcn Slider import
import { formatNumber } from '@/lib/formulaEngine';
import { lonLatToXY, xyToLonLat, STATE_LABELS, CITY_MARKERS, US_VIEWBOX } from './USMapSVG';
import MapModeForm from './MapModeForm';
import { parseApiResponse, evaluateFormula } from '@/lib/formulaEngine';

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

//
