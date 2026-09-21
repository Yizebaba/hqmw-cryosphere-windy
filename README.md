# HQMW Cryosphere - Windy Plugin

Windy.com plugin for Everest cryosphere context and provisional CDSE review candidates.

## Public Runtime Layers

- NASA GIBS MODIS Terra true-color imagery with date and opacity controls.
- Embedded provisional CDSE candidate points generated from Sentinel-1 GRD change, InSAR coherence screening, Sentinel-2 optical triage, and DEM terrain review.

The candidate layer contains one `priority_glacier_review` point and terrain/debris review points. It is an experimental screening layer only. It does not confirm glacier motion, collapse, hazards, or events.

## Intentionally Excluded Layers

The public plugin does not expose controls that require a user-local `127.0.0.1` CDSE, TiTiler, DEM, FIRMS, or InSAR service. Those endpoints only work when the user has separately installed and started the matching local services. Raster CDSE products will be reintroduced only through a tested fixed HTTPS image/tile service.

## Development

```sh
npm ci
npm start
```

Load `https://localhost:9999/plugin.js` in Windy Developer Mode.

## Publishing

Increase the version in both `package.json` and `src/pluginConfig.ts`, push to `main`, then run the `publish-plugin` GitHub Actions workflow. The workflow uses the repository secret `WINDY_API_KEY` and uploads the generated `dist` plugin archive to Windy.
## Candidate Point Interaction

Version 3.0.1 adds mouse-hover tooltips for every provisional candidate marker. Click a marker to open its expanded screening popup with status, approximate area, DEM slope, optical ice/snow and possible-debris proportions, the GRD comparison period, the InSAR screening period, and the interpretation limit.
## Candidate Analysis Images

Version 3.0.2 adds an optical analysis image to each candidate marker popup. The 18 priority candidate images are stored as public GitHub Raw artifacts, not in the Windy release archive. Hover shows a concise candidate label; click opens the detailed screening popup with the linked optical review image.
## Candidate Marker Compatibility

Version 3.0.3 uses Windy's documented reusable `markers` (`pulsatingIcon` and `myLocationIcon`) instead of Leaflet `CircleMarker`. This avoids the Leaflet GL runtime `radius` error while retaining hover tooltips, click popups, and candidate analysis images.
