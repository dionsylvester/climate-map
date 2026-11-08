import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import { SCENARIOS } from '../lib/constants.js';

const W = 950;
const H = 230;
const M = { top: 14, right: 92, bottom: 26, left: 48 };
const LABEL_GAP = 22;

function placeLabels(items) {
  const sorted = [...items].sort((a, b) => a.y - b.y);
  for (let i = 1; i < sorted.length; i++) {
    sorted[i].y = Math.max(sorted[i].y, sorted[i - 1].y + LABEL_GAP);
  }
  return sorted;
}

export default function TrendChart({ years, series, splitYear, selected, year, title, format, zeroLine }) {
  const all = Object.values(series).flat();
  const lo = Math.min(...all, zeroLine ? 0 : Infinity);
  const hi = Math.max(...all, zeroLine ? 0 : -Infinity);
  const x = scaleLinear().domain([years[0], years[years.length - 1]]).range([M.left, W - M.right]);
  const y = scaleLinear().domain([lo, hi]).nice(4).range([H - M.bottom, M.top]);
  const split = years.indexOf(splitYear);
  const path = line().x((d) => x(d[0])).y((d) => y(d[1]));
  const pts = (arr, from, to) => years.slice(from, to).map((yr, k) => [yr, arr[from + k]]);
  const any = Object.values(series)[0];

  const labels = placeLabels(
    Object.entries(series).map(([s, arr]) => ({ s, y: y(arr[arr.length - 1]) })),
  );

  return (
    <figure className="trend">
      <figcaption>{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}, ${years[0]} to ${years[years.length - 1]}`}>
        {y.ticks(4).map((t) => (
          <g key={t} className="tick">
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} className={t === 0 && zeroLine ? 'zero' : ''} />
            <text x={M.left - 8} y={y(t) + 4} textAnchor="end">{format(t)}</text>
          </g>
        ))}
        {[1900, 1950, 2000, 2050].map((t) => (
          <text key={t} className="tick" x={x(t)} y={H - 6} textAnchor="middle">{t}</text>
        ))}
        <path d={path(pts(any, 0, split + 1))} className="line line-history" />
        {Object.entries(series).map(([s, arr]) => (
          <path
            key={s}
            d={path(pts(arr, split, years.length))}
            className={`line ${selected.includes(s) ? 'is-selected' : 'is-muted'}`}
            style={{ stroke: `var(--${s})` }}
          />
        ))}
        {labels.map(({ s, y: ly }) => (
          <text
            key={s}
            x={W - M.right + 8}
            y={ly + 4}
            className={`end-label ${selected.includes(s) ? 'is-selected' : 'is-muted'}`}
            style={{ fill: `var(--${s})` }}
          >
            {SCENARIOS[s].label}
          </text>
        ))}
        <line x1={x(year)} x2={x(year)} y1={M.top} y2={H - M.bottom} className="year-marker" />
      </svg>
    </figure>
  );
}
