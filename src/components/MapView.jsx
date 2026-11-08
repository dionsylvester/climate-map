import { useMemo, useState } from 'react';
import { geoEquirectangular } from 'd3-geo';
import { rgb } from 'd3-color';
import { gridBounds, upsample, cellAt } from '../lib/grid.js';
import { unitScale } from '../lib/scales.js';
import geo from '../lib/geo.json';

const W = 950;
const FACTOR = 12;
const RAD = Math.PI / 180;
const LAT_TICKS = [-10, -5, 0, 5];
const LON_TICKS = [100, 110, 120, 130];

const fmtLat = (d) => (d === 0 ? '0°' : `${Math.abs(d)}°${d < 0 ? 'S' : 'N'}`);

function useProjection(grid) {
  return useMemo(() => {
    const b = gridBounds(grid);
    const H = Math.round((W * (b.north - b.south)) / (b.east - b.west));
    const k = W / ((b.east - b.west) * RAD);
    const projection = geoEquirectangular()
      .scale(k)
      .translate([-k * b.west * RAD, k * b.north * RAD])
      .clipExtent([[0, 0], [W, H]]);
    return { projection, H, b };
  }, [grid]);
}

function rasterUrl(values, grid, scale) {
  const up = upsample(values, grid.h, grid.w, FACTOR);
  const cw = grid.w * FACTOR;
  const ch = grid.h * FACTOR;
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(cw, ch);
  const pos = unitScale(scale);
  const interp = scale.interpolator();
  const lut = Array.from({ length: 256 }, (_, k) => rgb(interp(k / 255)));
  for (let i = 0; i < up.length; i++) {
    const c = lut[Math.round(pos(up[i]) * 255)];
    img.data[i * 4] = c.r;
    img.data[i * 4 + 1] = c.g;
    img.data[i * 4 + 2] = c.b;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
}

export default function MapView({ grid, values, scale, caption, label, describe }) {
  const { projection, H, b } = useProjection(grid);
  const href = useMemo(() => rasterUrl(values, grid, scale), [values, grid, scale]);
  const [hover, setHover] = useState(null);

  function onPointerMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const [lon, lat] = projection.invert([x, y]);
    const i = cellAt(lon, lat, grid);
    setHover(i < 0 ? null : { i, px: (e.clientX - rect.left) / rect.width, py: (e.clientY - rect.top) / rect.height });
  }

  let cellRect = null;
  if (hover) {
    const row = Math.floor(hover.i / grid.w);
    const col = hover.i % grid.w;
    const [x0, y0] = projection([b.west + col * grid.dlon, b.south + (row + 1) * grid.dlat]);
    const [x1, y1] = projection([b.west + (col + 1) * grid.dlon, b.south + row * grid.dlat]);
    cellRect = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  }

  return (
    <figure className="map">
      <div className="map-frame">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={label}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(null)}
        >
          <image href={href} x="0" y="0" width={W} height={H} preserveAspectRatio="none" />
          <path
            d={geo.land}
            className="coast"
            transform={`scale(${W / (b.east - b.west)}) translate(${-b.west} ${b.north})`}
            vectorEffect="non-scaling-stroke"
          />
          {LAT_TICKS.map((lat) => {
            const [, y] = projection([b.west, lat]);
            return (
              <g key={lat} className="tick">
                <line x1="0" x2={W} y1={y} y2={y} />
                <text x="6" y={y - 4}>{fmtLat(lat)}</text>
              </g>
            );
          })}
          {LON_TICKS.map((lon) => {
            const [x] = projection([lon, b.south]);
            return (
              <g key={lon} className="tick">
                <line x1={x} x2={x} y1="0" y2={H} />
                <text x={x + 4} y={H - 6}>{lon}°E</text>
              </g>
            );
          })}
          {cellRect && <rect className="cell-outline" {...cellRect} />}
        </svg>
        {hover && (
          <div
            className="tooltip"
            style={{ left: `${hover.px * 100}%`, top: `${hover.py * 100}%` }}
            data-flip={hover.px > 0.7 ? 'left' : 'right'}
          >
            <span className="tooltip-place">
              {fmtLat(Math.round(grid.lat[Math.floor(hover.i / grid.w)] * 10) / 10)},{' '}
              {Math.round(grid.lon[hover.i % grid.w] * 10) / 10}°E
            </span>
            {describe(hover.i).map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
        )}
      </div>
      {caption && <figcaption className="map-caption">{caption}</figcaption>}
    </figure>
  );
}
