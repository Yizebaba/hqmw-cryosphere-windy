# Windy runtime verification

Verified on 2026-09-14 with installed Chrome and Python Playwright against the real https://www.windy.com page (Windy 51.2.1). The built Svelte bundle was mounted into a 390px test sidebar on that page, using the actual W.map.map and L runtime. This exercises real map rendering and browser network policy, but does not test Windy's authenticated plugin installation UI.

## Reproduced failure

The published 2.3.0 earthquake control fetched USGS data but failed while constructing GeoJSON. LeafletGL CircleMarker.setStyle received undefined during GeoJSON.resetStyle:

```
TypeError: Cannot read properties of undefined (reading 'radius')
```

An explicit GeoJSON style function returning an object fixes this path for both earthquake and fire circle markers. Documentation: https://windycom.github.io/LeafletGL/docs/API/LeafletGL/classes/GeoJSON/ and https://windycom.github.io/LeafletGL/docs/API/LeafletGL/classes/CircleMarker/.

## Observed results

- Live USGS all_hour feed: seven events loaded in the Windy page. Event selection opened the popup for M0.76, 6 km W of Cobb, CA, observed 2026-09-14T11:34:20.770Z. Event counts vary with time.
- Local FIRMS proxy on 127.0.0.1:18743: browser request completed and displayed zero detections. This connection requires the local backend to keep running on the same computer.
- Snow category changed the selected map product to Snow Cover (L3, Monthly Average Percent, MODIS, Aqua), dated 2026-08-01. Product dates and resolution must remain visible; imagery is not a connected avalanche detector.
- Sidebar clientWidth and scrollWidth both 390px.

## Remaining source gaps

Route records and CAP delivery are not connected. Icefall, avalanche, landslide, rockfall, debris-flow and flood event models are not connected; their imagery controls show source observations only. The plugin does not perform automated alarm decisions. No fabricated events are published.
