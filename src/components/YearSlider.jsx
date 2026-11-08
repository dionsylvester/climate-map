import { BANDS } from '../lib/constants.js';

const TICKS = [1860, 1900, 1950, 2000, 2050, 2090];

function segments(years, bands) {
  const out = [];
  years.forEach((y, i) => {
    const last = out[out.length - 1];
    if (last && last.band === bands[i]) last.end = y;
    else out.push({ band: bands[i], start: y, end: y });
  });
  return out;
}

export default function YearSlider({ years, year, onChange, bands, showBands }) {
  const first = years[0];
  const span = years[years.length - 1] - first;
  const pos = (y) => ((y - first) / span) * 100;

  return (
    <div className="slider">
      <label className="visually-hidden" htmlFor="year">Centre year of the 20-year average</label>
      <input
        id="year"
        type="range"
        min={first}
        max={years[years.length - 1]}
        step="1"
        value={year}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="slider-ticks" aria-hidden="true">
        {TICKS.map((t) => (
          <span key={t} style={{ left: `${pos(t)}%` }}>{t}</span>
        ))}
      </div>
      <div style={{ visibility: showBands ? 'visible' : 'hidden' }} aria-hidden={!showBands}>
          <div className="band-strip" aria-hidden="true">
            {segments(years, bands).map((s) => (
              <span
                key={s.start}
                className={`band band-${s.band}`}
                style={{ left: `${pos(s.start)}%`, width: `${Math.min(100, pos(s.end + 1)) - pos(s.start)}%` }}
              />
            ))}
          </div>
          <ul className="band-legend">
            {[...new Set(bands)].map((b) => (
              <li key={b}><span className={`swatch band-${b}`} />{BANDS[b]}</li>
            ))}
          </ul>
      </div>
    </div>
  );
}
