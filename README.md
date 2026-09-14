# HQMW Cryosphere

Private Windy plugin for browsing NASA EOSDIS GIBS satellite imagery on the Windy LeafletGL map.

## Current Capabilities

- NASA GIBS EPSG:3857 WMTS catalog search.
- NASA imagery date, opacity, visibility, official legend, and Everest map focus.
- Chinese filters for cryosphere, terrestrial hydrosphere, Sentinel-2/HLS, and ocean-reference products.
- Per-layer tile availability test using NASA imagery tiles.
- Manual current-versus-baseline image-date switching for review only.

## Safety Boundary

This plugin is an imagery viewer. It does not identify disasters, issue CAP messages, create RED alerts, close routes, or trigger evacuations. NASA GIBS imagery is background context and requires review with verified sources.

## Development

```sh
npm install
npm run build
npm start
```

Load the development build from `https://localhost:9999/plugin.js` in [Windy Developer Mode](https://www.windy.com/developer-mode).

## Publishing

Add a repository Actions secret named `WINDY_API_KEY`, then run the `publish-plugin` workflow. Windy publishes versioned plugin URLs; a new code version must be loaded through Windy Developer Mode for immediate use.

## Data Attribution

Imagery is provided by [NASA EOSDIS GIBS](https://earthdata.nasa.gov/gibs). Individual product availability, date ranges, legends, and limitations come from the NASA WMTS capabilities document.
