import { scaleDiverging, scaleSequentialSymlog } from 'd3-scale';
import { interpolateBrBG, interpolateViridis } from 'd3-scale-chromatic';

export function rainScale(limit) {
  return scaleDiverging(interpolateBrBG).domain([-limit, 0, limit]).clamp(true);
}

export function emissionScale([min, max]) {
  return scaleSequentialSymlog(interpolateViridis).domain([min, max]).constant(max / 1000).clamp(true);
}

export const unitScale = (scale) => scale.copy().interpolator((t) => t);

export function emissionTicks([min, max]) {
  const ticks = min <= 0 ? [0] : [];
  for (let p = 10 ** Math.ceil(Math.log10(max / 1000)); p <= max; p *= 100) ticks.push(p);
  return ticks;
}

export const signedPct = (v, digits) =>
  `${v > 0 ? '+' : v < 0 ? '−' : ''}${digits == null ? Math.abs(v) : Math.abs(v).toFixed(digits)}%`;
