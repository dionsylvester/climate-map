export function gridBounds(grid) {
  const { lat, lon, dlat, dlon } = grid;
  return {
    west: lon[0] - dlon / 2,
    east: lon[lon.length - 1] + dlon / 2,
    south: lat[0] - dlat / 2,
    north: lat[lat.length - 1] + dlat / 2,
  };
}

export function upsample(values, h, w, factor) {
  const H = h * factor;
  const W = w * factor;
  const out = new Float32Array(H * W);
  const clamp = (v, hi) => Math.min(Math.max(v, 0), hi);
  for (let r = 0; r < H; r++) {
    const y = clamp(h - 1 - ((r + 0.5) / factor - 0.5), h - 1);
    const y0 = Math.floor(y);
    const y1 = Math.min(y0 + 1, h - 1);
    const fy = y - y0;
    for (let c = 0; c < W; c++) {
      const x = clamp((c + 0.5) / factor - 0.5, w - 1);
      const x0 = Math.floor(x);
      const x1 = Math.min(x0 + 1, w - 1);
      const fx = x - x0;
      const a = values[y0 * w + x0] * (1 - fx) + values[y0 * w + x1] * fx;
      const b = values[y1 * w + x0] * (1 - fx) + values[y1 * w + x1] * fx;
      out[r * W + c] = a * (1 - fy) + b * fy;
    }
  }
  return out;
}

export function cellAt(lon, lat, grid) {
  const b = gridBounds(grid);
  if (lon < b.west || lon >= b.east || lat < b.south || lat >= b.north) return -1;
  const col = Math.floor((lon - b.west) / grid.dlon);
  const row = Math.floor((lat - b.south) / grid.dlat);
  return row * grid.w + col;
}

export function anomalyPct(values, baseline) {
  return values.map((v, i) => (v / baseline[i] - 1) * 100);
}

export function weightedMean(arr, weights) {
  let s = 0;
  let n = 0;
  for (let i = 0; i < arr.length; i++) {
    s += arr[i] * weights[i];
    n += weights[i];
  }
  return s / n;
}

export function pick(data, scenario, k, split) {
  return k < split ? data.historical[k] : data[scenario][k - split];
}

export function regionSeries(data, scenarios, nYears, split, weights, baseline) {
  const base = baseline && weightedMean(baseline, weights);
  return Object.fromEntries(scenarios.map((s) => [
    s,
    Array.from({ length: nYears }, (_, k) => {
      const m = weightedMean(pick(data, s, k, split), weights);
      return base ? (m / base - 1) * 100 : m;
    }),
  ]));
}
