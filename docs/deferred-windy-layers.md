# Deferred Windy Layers

The following modules existed in the earlier plugin implementation and are intentionally **not active** in the public Windy release.

They are not deleted from the project plan. They are deferred until a fixed HTTPS service is deployed and tested from the public Windy.com runtime.

## Deferred modules

| Module | Former local dependency | Why disabled | Requirement before restoration |
| --- | --- | --- | --- |
| CDSE Sentinel-2 true-color tiles | `http://127.0.0.1:18743/v1/cdse/sentinel2/tiles/{z}/{x}/{y}.png` | `127.0.0.1` means the end user's own computer, not the project server. | Public HTTPS tile endpoint, CORS allowing `https://www.windy.com`, no CDSE secret in browser code. |
| CDSE Sentinel-1 GRD SAR tiles | `http://127.0.0.1:18743/v1/cdse/sentinel1/tiles/{z}/{x}/{y}.png` | Same localhost limitation. | Public HTTPS tile endpoint generated server-side from CDSE Process API or COG tiles. |
| Sentinel-2 NDSI / NDWI tiles | `http://127.0.0.1:18743/v1/cdse/sentinel2/{ndsi|ndwi}/tiles/{z}/{x}/{y}.png` | Same localhost limitation and must retain source/threshold metadata. | Public HTTPS tile endpoint plus versioned evalscript and date metadata. |
| InSAR coherence raster | `http://127.0.0.1:18744/cog/tiles/...` | Local TiTiler path is unavailable to public Windy users. | Public HTTPS COG tile service, validated coherence band/range, nodata, dates and processing provenance. |
| DEM hillshade / slope / contours | `http://127.0.0.1:18744/cog/tiles/...` | Local TiTiler path unavailable publicly. | Public HTTPS tile service or a stable external DEM tile provider. |
| FIRMS proxy | `http://127.0.0.1:18743/v1/external/fire-detections` | Local proxy unavailable to public users. | Public proxy with rate limiting, terms-compliant credentials and CORS. |

## Stable public release

The public release currently contains only:

- NASA GIBS public true-color map context;
- embedded provisional CDSE candidate points;
- hover labels and click popups with screening metadata and analysis images.

## Restore procedure

1. Deploy the required data service on a fixed HTTPS origin.
2. Verify browser CORS from `https://www.windy.com`.
3. Verify image/tile `Content-Type`, geographic bounds, date, provenance, nodata and legend.
4. Restore only the corresponding module in `src/plugin.svelte`.
5. Bump both plugin versions, build, verify in Windy Developer Mode, and publish a new release.

No deferred module should be re-enabled by pointing it at `127.0.0.1` in a public Windy plugin.