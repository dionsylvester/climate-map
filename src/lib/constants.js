export const SCENARIOS = {
  ssp126: { label: 'SSP1-2.6', long: 'Low emissions' },
  ssp245: { label: 'SSP2-4.5', long: 'Middle of the road' },
  ssp370: { label: 'SSP3-7.0', long: 'High emissions' },
  ssp585: { label: 'SSP5-8.5', long: 'Very high emissions' },
};

export const LAYERS = {
  precip: { label: 'Rainfall change' },
  CO2: { label: 'CO₂ emissions', name: 'CO₂' },
  CH4: { label: 'Methane emissions', name: 'CH₄' },
  SO2: { label: 'Sulphur dioxide emissions', name: 'SO₂' },
  BC: { label: 'Black carbon emissions', name: 'Black carbon' },
};

export const SOURCES = {
  CMIP6: 'Climate model (CMIP6)',
  'ST-GNN': 'ST-GNN prediction',
};

export const BANDS = {
  train: 'Seen in training',
  validation: 'Used for validation',
  test: 'Never seen by the model',
};

export const dataUrl = (name) => `${import.meta.env.BASE_URL}data/${name}.json`;
