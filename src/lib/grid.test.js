import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { upsample, cellAt, anomalyPct, gridBounds, pick, weightedMean, regionSeries } from './grid.js';

const grid = { lat: [-1, 1], lon: [100, 102.5, 105], dlat: 2, dlon: 2.5, h: 2, w: 3 };

test('upsample keeps cell-centre values and flips rows to image order', () => {
  const v = [0, 1, 2, 10, 11, 12];
  const f = 2;
  const out = upsample(v, 2, 3, f);
  assert.equal(out.length, 4 * 6);
  assert.equal(out[0], 10);
  assert.equal(out[out.length - 1], 2);
  assert.ok(Math.min(...out) >= 0 && Math.max(...out) <= 12);
  const mid = upsample([0, 0, 0, 10, 10, 10], 2, 3, 4);
  const midRow = Array.from(mid.slice(3 * 12, 4 * 12)); 
  assert.ok(midRow.every((x) => x > 0 && x < 10));
});

test('cellAt maps coordinates to row-major index with south row first', () => {
  assert.equal(cellAt(100, -1, grid), 0);
  assert.equal(cellAt(105.5, 1.5, grid), 5);
  assert.equal(cellAt(103, 0.2, grid), 4);
  const b = gridBounds(grid);
  assert.equal(cellAt(b.west - 0.01, 0, grid), -1);
  assert.equal(cellAt(100, b.north + 0.01, grid), -1);
});

test('anomalyPct is relative to each cell baseline', () => {
  assert.deepEqual(anomalyPct([11, 9], [10, 10]).map((x) => Math.round(x)), [10, -10]);
});

test('pick reads shared history before the split and the scenario after it', () => {
  const data = { historical: [['h0'], ['h1']], ssp126: [['a2'], ['a3']], ssp585: [['b2'], ['b3']] };
  assert.deepEqual(pick(data, 'ssp585', 1, 2), ['h1']);
  assert.deepEqual(pick(data, 'ssp585', 2, 2), ['b2']);
  assert.deepEqual(pick(data, 'ssp126', 3, 2), ['a3']);
});

test('weightedMean ignores zero-weight cells', () => {
  assert.equal(weightedMean([10, 20, 1000], [1, 3, 0]), 17.5);
});

test('regionSeries gives weighted values per year, or % change vs the weighted baseline', () => {
  const data = { historical: [[2, 100]], ssp126: [[3, 100]], ssp585: [[4, 100]] };
  const w = [1, 0];
  assert.deepEqual(regionSeries(data, ['ssp126', 'ssp585'], 2, 1, w), { ssp126: [2, 3], ssp585: [2, 4] });
  const pct = regionSeries(data, ['ssp585'], 2, 1, w, [2, 999]);
  assert.deepEqual(pct, { ssp585: [0, 100] });
});

test('geo.json matches the shipped grid', () => {
  const read = (f) => JSON.parse(readFileSync(new URL(f, import.meta.url), 'utf8'));
  const { grid } = read('../../public/data/meta.json');
  const geo = read('./geo.json');
  assert.equal(geo.weights.length, grid.h * grid.w);
  assert.ok(geo.weights.every((x) => x >= 0) && geo.weights.some((x) => x > 0));
  const b = gridBounds(grid);
  for (const k of ['west', 'east', 'south', 'north']) assert.ok(Math.abs(geo.bounds[k] - b[k]) < 1e-9, k);
});
