import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rainScale, emissionScale, unitScale, emissionTicks, signedPct } from './scales.js';

test('emissionTicks starts at 0 when in range and steps by 100× above the symlog constant', () => {
  assert.deepEqual(emissionTicks([-715, 13700]), [0, 100, 10000]);
  assert.deepEqual(emissionTicks([0, 40.6]), [0, 0.1, 10]);
  assert.deepEqual(emissionTicks([5, 9.28]), [0.01, 1]);
});

test('unitScale maps values to 0..1 along the colour bar', () => {
  const rain = unitScale(rainScale(20));
  assert.equal(rain(-20), 0);
  assert.equal(rain(0), 0.5);
  assert.equal(rain(99), 1);
  const co2 = unitScale(emissionScale([-715, 13700]));
  assert.equal(co2(-715), 0);
  assert.equal(co2(13700), 1);
  const c = 13.7;
  const f = (x) => Math.sign(x) * Math.log1p(Math.abs(x) / c);
  assert.ok(Math.abs(co2(100) - (f(100) - f(-715)) / (f(13700) - f(-715))) < 1e-12);
});

test('signedPct uses a real minus and no sign for zero', () => {
  assert.equal(signedPct(12.345, 1), '+12.3%');
  assert.equal(signedPct(-3, 1), '−3.0%');
  assert.equal(signedPct(0), '0%');
  assert.equal(signedPct(2.5), '+2.5%');
});
