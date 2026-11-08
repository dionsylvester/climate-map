import { useEffect, useMemo, useRef, useState } from 'react';
import MapView from './components/MapView.jsx';
import YearSlider from './components/YearSlider.jsx';
import TrendChart from './components/TrendChart.jsx';
import { RainLegend, EmissionLegend } from './components/Legend.jsx';
import { SCENARIOS, LAYERS, SOURCES, dataUrl } from './lib/constants.js';
import { rainScale, emissionScale, signedPct } from './lib/scales.js';
import { anomalyPct, pick, regionSeries } from './lib/grid.js';
import geo from './lib/geo.json';

const getJson = (name) =>
  fetch(dataUrl(name)).then((r) => {
    if (!r.ok) throw new Error(`${name}.json: HTTP ${r.status}`);
    return r.json();
  });

const fmtEmission = (v) => v.toLocaleString('en', { maximumSignificantDigits: 3 });

export default function App() {
  const [meta, setMeta] = useState(null);
  const [precip, setPrecip] = useState(null);
  const [emissions, setEmissions] = useState(null);
  const [error, setError] = useState(null);
  const [emissionError, setEmissionError] = useState(null);

  const [year, setYear] = useState(2090);
  const [scenario, setScenario] = useState('ssp245');
  const [compare, setCompare] = useState(false);
  const [scenarioB, setScenarioB] = useState('ssp585');
  const [source, setSource] = useState('CMIP6');
  const [layer, setLayer] = useState('precip');

  useEffect(() => {
    Promise.all([getJson('meta'), getJson('precip')])
      .then(([m, p]) => { setMeta(m); setPrecip(p); })
      .catch((e) => setError(e.message));
  }, []);

  const wantEmissions = layer !== 'precip';
  const emissionsRequest = useRef(null);
  useEffect(() => {
    if (!wantEmissions || emissionsRequest.current) return;
    setEmissionError(null);
    emissionsRequest.current = getJson('emissions').then(setEmissions).catch((e) => {
      emissionsRequest.current = null; 
      setEmissionError(e.message);
    });
  }, [wantEmissions]);

  const scales = useMemo(() => meta && {
    precip: rainScale(meta.pct_limit),
    ...Object.fromEntries(Object.keys(LAYERS).filter((k) => k !== 'precip')
      .map((k) => [k, emissionScale(meta.emission_range[k])])),
  }, [meta]);

  const split = meta ? meta.years.indexOf(meta.scenario_split_centre) : -1;
  const trendSeries = useMemo(() => {
    const data = layer === 'precip' ? precip?.[source] : emissions?.[layer];
    if (!meta || !data) return null;
    const baseline = layer === 'precip' ? meta.baseline[source] : null;
    return regionSeries(data, meta.scenarios, meta.years.length, split, geo.weights, baseline);
  }, [meta, precip, emissions, layer, source, split]);

  if (error) {
    return <main className="page"><p className="status">The map data didn't load ({error}). Refresh the page to try again.</p></main>;
  }
  if (!meta || !precip) return <main className="page"><p className="status">Loading map data…</p></main>;

  const yi = meta.years.indexOf(year);
  const historical = year < meta.scenario_split_centre;
  const isRain = layer === 'precip';
  const baseline = meta.baseline[source];
  const emissionsReady = isRain || emissions;
  const row = (s) => pick(isRain ? precip[source] : emissions[layer], s, yi, split);

  function fieldFor(s) {
    return isRain ? anomalyPct(row(s), baseline) : row(s);
  }
  function describeFor(s) {
    return (i) => {
      const v = row(s)[i];
      if (isRain) return [`${v.toFixed(2)} mm of rain per day`, `${signedPct((v / baseline[i] - 1) * 100, 1)} vs 1851–1900`];
      return [`${fmtEmission(v)} t/km² per year`];
    };
  }

  const shown = compare && !historical ? [scenario, scenarioB] : [scenario];
  const windowText = `${year - 9}–${year + 10}`;
  const scenarioName = (s) => (historical ? 'historical run' : `${SCENARIOS[s].label} (${SCENARIOS[s].long.toLowerCase()})`);

  return (
    <main className="page">
      <header className="intro">
        <h1>Indonesia rainfall, <span style={{ whiteSpace: 'nowrap' }}>1860–2090</span></h1>
        <p>Drag the timeline to move through the years.</p>
      </header>

      <div className="stage">
        <div className="maps">
          {emissionsReady ? shown.map((s) => (
            <MapView
              key={s}
              grid={meta.grid}
              values={fieldFor(s)}
              scale={scales[layer]}
              caption={shown.length > 1 ? scenarioName(s) : null}
              label={`${LAYERS[layer].label}, ${windowText}, ${scenarioName(s)}`}
              describe={describeFor(s)}
            />
          )) : (
            <p className="status">
              {emissionError ? `The emission data didn't load (${emissionError}). Pick another layer or refresh the page.` : 'Loading emissions…'}
            </p>
          )}
        </div>

        <div className="year-block">
          <p className="year-numeral">{year}</p>
          <p className="year-window">20-year average, {windowText}</p>
        </div>

        <div className="controls-block">
          <div className="controls">
            <label className="field">
              <span>Show</span>
              <select value={layer} onChange={(e) => setLayer(e.target.value)}>
                {Object.entries(LAYERS).map(([k, l]) => <option key={k} value={k}>{l.label}</option>)}
              </select>
            </label>

            <label className="field">
              <span>Scenario</span>
              <select value={scenario} disabled={historical} onChange={(e) => {
                setScenario(e.target.value);
                if (e.target.value === scenarioB) setScenarioB(meta.scenarios.find((s) => s !== e.target.value));
              }}>
                {meta.scenarios.map((s) => <option key={s} value={s}>{SCENARIOS[s].label}, {SCENARIOS[s].long.toLowerCase()}</option>)}
              </select>
            </label>
            <p className="hint" style={{ visibility: historical ? 'visible' : 'hidden' }}>
              Scenarios start in 2015, so before {meta.scenario_split_centre} every scenario shows the same history.
            </p>

            <label className="check">
              <input type="checkbox" checked={compare} disabled={historical} onChange={(e) => setCompare(e.target.checked)} />
              Compare with a second scenario
            </label>
            {compare && !historical && (
              <label className="field">
                <span>Second scenario</span>
                <select value={scenarioB} onChange={(e) => setScenarioB(e.target.value)}>
                  {meta.scenarios.filter((s) => s !== scenario).map((s) => (
                    <option key={s} value={s}>{SCENARIOS[s].label}, {SCENARIOS[s].long.toLowerCase()}</option>
                  ))}
                </select>
              </label>
            )}

          </div>

          {isRain
            ? <RainLegend limit={meta.pct_limit} scale={scales.precip} />
            : <EmissionLegend name={LAYERS[layer].name} range={meta.emission_range[layer]} scale={scales[layer]} />}
          {isRain && (
            <fieldset className="field source-field">
              <legend>Rainfall from</legend>
              {Object.entries(SOURCES).map(([k, label]) => (
                <label key={k} className="radio">
                  <input type="radio" name="source" value={k} checked={source === k} onChange={() => setSource(k)} />
                  {label}
                </label>
              ))}
            </fieldset>
          )}
          {isRain && (
            <p className="headline-number">
              Indonesia overall: <strong>{signedPct(trendSeries[scenario][yi], 1)}</strong> rainfall vs 1851–1900
              {historical ? '' : ` under ${SCENARIOS[scenario].label}`}
            </p>
          )}
        </div>

        <YearSlider
          years={meta.years}
          year={year}
          onChange={setYear}
          bands={meta.bands[scenario]}
          showBands={isRain && source === 'ST-GNN'}
        />

        {trendSeries && (
          <TrendChart
            years={meta.years}
            series={trendSeries}
            splitYear={meta.scenario_split_centre}
            selected={shown}
            year={year}
            zeroLine={isRain}
            title={isRain
              ? `Indonesia average, change in rainfall vs 1851–1900, ${SOURCES[source]}`
              : `Indonesia average, ${LAYERS[layer].name} emissions (t/km² per year)`}
            format={isRain ? signedPct : fmtEmission}
          />
        )}
      </div>

      <footer className="credits">
        <p>
          Grid cells (~210×275 km) use color blending between centers so sub-cell detail is artificial. Indonesia-wide totals weight cells by how much Indonesian land they hold, while fire emissions are excluded due to dataset definition changes before and after 2015.
        </p>
        <p>
          Data: ClimateSet (Kaltenborn et al., 2023), <a href="https://climateset.github.io">climateset.github.io</a>.
          Coastlines: Natural Earth.
        </p>
      </footer>
    </main>
  );
}
