# Indonesia Rainfall Map

The interactive map behind the case study at <https://dionsylvester.com/climate>. It shows annual rainfall change
over Indonesia from 1860 to 2090 under four emission scenarios, from the INM-CM4-8 climate model (CMIP6) and from
the ST-GNN trained to reproduce it.

Live: <https://dionsylvester.com/climate/preview>

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173/
```

## Deploying at dionsylvester.com/climate/preview

This repo is its own Vercel project (framework preset: Vite). The portfolio's `/climate/preview` page embeds it in an
iframe with `?theme=light|dark`, next to the portfolio's NavBar and Footer. Without the parameter the map follows the
system theme.

## Credits

Data: ClimateSet (Kaltenborn et al., 2023), <https://climateset.github.io>. Coastlines: Natural Earth 1:50m via
[world-atlas](https://github.com/topojson/world-atlas).
