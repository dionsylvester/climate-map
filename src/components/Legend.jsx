import { unitScale, emissionTicks, signedPct } from '../lib/scales.js';

const STOPS = 24;

function gradient(scale) {
  const interp = scale.interpolator();
  const stops = Array.from({ length: STOPS + 1 }, (_, i) => interp(i / STOPS));
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

export function RainLegend({ limit, scale }) {
  const ticks = [-limit, -limit / 2, 0, limit / 2, limit];
  const pos = unitScale(scale);
  return (
    <div className="legend">
      <p className="legend-title">Change in rainfall vs 1851–1900</p>
      <div className="legend-bar" style={{ background: gradient(scale) }} />
      <div className="legend-ticks">
        {ticks.map((t) => (
          <span key={t} style={{ left: `${pos(t) * 100}%` }}>{signedPct(t)}</span>
        ))}
      </div>
      <div className="legend-ends"><span>Drier</span><span>Wetter</span></div>
    </div>
  );
}

export function EmissionLegend({ name, range, scale }) {
  const pos = unitScale(scale);
  const fmt = (v) => v.toLocaleString('en', { maximumSignificantDigits: 2 });
  return (
    <div className="legend">
      <p className="legend-title">{name} emissions, tonnes per km² per year</p>
      <div className="legend-bar" style={{ background: gradient(scale) }} />
      <div className="legend-ticks">
        {emissionTicks(range).map((t) => (
          <span key={t} style={{ left: `${pos(t) * 100}%` }}>{fmt(t)}</span>
        ))}
      </div>
      <div className="legend-ends"><span>Less</span><span>More (log scale)</span></div>
    </div>
  );
}
