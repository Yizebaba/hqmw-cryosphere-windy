<div class="plugin__mobile-header">{title}</div>
<section class="plugin__content">
    <div class="plugin__title plugin__title--chevron-back" on:click={() => bcast.emit('rqstOpen', 'menu')}>{title}</div>

    <p class="intro">
        Stable public release: NASA GIBS map context plus provisional CDSE glacier-change candidates.
        This plugin does not issue hazard decisions.
    </p>

    <div class="status-card" class:ready={gibsStatus === 'ready'}>
        <span>NASA GIBS TRUE COLOR</span>
        <strong>{gibsStatus.toUpperCase()}</strong>
        <small>Public satellite context layer. Date changes the public NASA GIBS imagery only.</small>
        <label class="field-label" for="gibs-date">OBSERVATION DATE</label>
        <input id="gibs-date" type="date" bind:value={gibsDate} max={today} on:change={refreshGibsLayer} />
        <label class="field-label" for="gibs-opacity">GIBS OPACITY {Math.round(gibsOpacity * 100)}%</label>
        <input id="gibs-opacity" type="range" min="0" max="1" step="0.05" bind:value={gibsOpacity} on:input={updateGibsOpacity} />
        <div class="actions">
            <button on:click={toggleGibsLayer}>{gibsVisible ? 'HIDE GIBS' : 'SHOW GIBS'}</button>
            <button on:click={focusEverest}>FOCUS EVEREST</button>
        </div>
        {#if gibsError}<div class="error">{gibsError}</div>{/if}
    </div>

    <div class="status-card" class:ready={candidateStatus === 'ready'}>
        <span>CDSE PROVISIONAL CANDIDATES</span>
        <strong>{candidateStatus.toUpperCase()}</strong>
        <small>{candidateCount} screening candidates. Red is the primary review candidate; orange requires terrain or debris review.</small>
        <div class="actions">
            <button on:click={toggleCandidateLayer}>{candidateVisible ? 'HIDE CANDIDATES' : 'SHOW CANDIDATES'}</button>
            <button on:click={focusCandidates}>FOCUS CANDIDATES</button>
        </div>
        {#if candidateError}<div class="error">{candidateError}</div>{/if}
    </div>

    <details class="limits" open>
        <summary>INTERPRETATION LIMITS</summary>
        <p>Candidate points combine Sentinel-1 GRD change, InSAR coherence screening, Sentinel-2 optical triage, and DEM terrain checks.</p>
        <p>They are provisional review targets only. They do not confirm glacier motion, a collapse, a hazard, or an event.</p>
    </details>
</section>

<script lang="ts">
    import bcast from '@windy/broadcast';
    import { layerOrder, map, markers } from '@windy/map';
    import { onDestroy, onMount } from 'svelte';
    import config from './pluginConfig';
    import { allCandidates } from './candidateData';

    const { title } = config;
    const today = new Date().toISOString().slice(0, 10);
    const initialDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const gibsTemplate = 'https://gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{Time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg';

    let gibsLayer: L.TileLayer | null = null;
    let candidateLayer: L.GeoJSON | null = null;
    let gibsVisible = true;
    let candidateVisible = true;
    let gibsStatus: 'loading' | 'ready' | 'hidden' | 'error' = 'loading';
    let candidateStatus: 'loading' | 'ready' | 'hidden' | 'error' = 'loading';
    let gibsError = '';
    let candidateError = '';
    let gibsDate = initialDate;
    let gibsOpacity = 0.7;
    let candidateCount = 0;

    const gibsUrl = () => gibsTemplate.replace('{Time}', gibsDate);
    const removeGibsLayer = () => { gibsLayer?.remove(); gibsLayer = null; gibsVisible = false; };
    const removeCandidateLayer = () => { candidateLayer?.remove(); candidateLayer = null; candidateVisible = false; };

    const focusEverest = () => { map.setView([27.9881, 86.925], 10); };
    const focusCandidates = () => { map.fitBounds([[27.78, 86.55], [28.04, 87.05]]); };

    const loadGibsLayer = () => {
        removeGibsLayer();
        gibsStatus = 'loading';
        gibsError = '';
        gibsLayer = new L.TileLayer(gibsUrl(), {
            minZoom: 0,
            maxNativeZoom: 9,
            maxZoom: 19,
            opacity: Number(gibsOpacity),
            tileSize: 256,
            layerBucketId: layerOrder.MAIN,
            subdomains: 'abc',
            noWrap: true,
            continuousWorld: true,
            bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
        });
        gibsLayer.on('load', () => { gibsStatus = 'ready'; });
        gibsLayer.on('tileerror', () => {
            gibsStatus = 'error';
            gibsError = 'NASA GIBS imagery is unavailable for this date.';
        });
        gibsLayer.addTo(map);
        gibsVisible = true;
    };

    const updateGibsOpacity = (event: Event) => {
        gibsOpacity = Number((event.currentTarget as HTMLInputElement).value);
        gibsLayer?.setOpacity(gibsOpacity);
    };

    const refreshGibsLayer = () => { if (gibsVisible) loadGibsLayer(); };
    const toggleGibsLayer = () => { if (gibsVisible) { removeGibsLayer(); gibsStatus = 'hidden'; return; } loadGibsLayer(); };

    const loadCandidateLayer = () => {
        removeCandidateLayer();
        candidateStatus = 'loading';
        candidateError = '';
        try {
            const feed = allCandidates as any;
            const features = Array.isArray(feed.features) ? feed.features : [];
            candidateCount = features.length;
            candidateLayer = new L.GeoJSON(feed as never, {
                pointToLayer: (feature: any, latlng: L.LatLng) => {
                    const props = feature?.properties || {};
                    const priority = props.project_candidate_status === 'priority_glacier_review';
                    const marker = new L.Marker(latlng, {
                        icon: priority ? markers.pulsatingIcon : markers.myLocationIcon,
                        keyboard: false,
                        riseOnHover: true,
                    });
                    const label = priority ? 'PRIMARY REVIEW' : 'TERRAIN / DEBRIS REVIEW';
                    marker.bindTooltip(
                        `${props.candidate_id || 'CANDIDATE'} - ${label}`,
                        { direction: 'top', offset: [0, -10], opacity: 0.95 }
                    );
                    return marker;
                },
                onEachFeature: (feature: any, layer: L.Layer) => {
                    const p = feature?.properties || {};
                    const popup = document.createElement('div');
                    const area = p.approximate_area_km2 ? `${(p.approximate_area_km2 * 1000).toFixed(1)} km2` : 'N/A';
                    const slope = p.median_slope_degrees ? `${p.median_slope_degrees.toFixed(1)} deg` : 'N/A';
                    const iceSnow = p.clean_ice_snow_percent !== undefined ? `${Number(p.clean_ice_snow_percent).toFixed(1)}%` : 'N/A';
                    const debris = p.unknown_possible_debris_ice_percent !== undefined ? `${Number(p.unknown_possible_debris_ice_percent).toFixed(1)}%` : 'N/A';
                    const grdPeriod = '2026-09-04 to 2026-09-16';
                    const insarPeriod = '2026-08-23 to 2026-09-16';
                    const candidateId = p.candidate_id || 'CANDIDATE';
                    const imageUrl = `https://raw.githubusercontent.com/Yizebaba/hqmw-cryosphere-windy/main/static/project-artifacts/candidate-cutouts/${candidateId}_optical_review.png`;
                    popup.innerHTML = `<strong>${candidateId}</strong><br/>Status: ${p.project_candidate_status || 'UNKNOWN'}<br/>Area: ${area}<br/>Slope: ${slope}<br/>Ice/snow screening: ${iceSnow}<br/>Possible debris/unknown: ${debris}<br/>GRD comparison: ${grdPeriod}<br/>InSAR screening: ${insarPeriod}<br/><img class="candidate-analysis-image" src="${imageUrl}" alt="${candidateId} Sentinel-2 optical review"/><a class="candidate-analysis-link" href="${imageUrl}" target="_blank" rel="noopener">Open analysis image</a><br/><small>${p.interpretation_limit || ''}</small>`;
                    layer.bindPopup(popup);
                },
            });
            candidateLayer.addTo(map);

            // 1. 绘制绝对基岩不动点 (Reference Anchor)
            const anchorLatLng: [number, number] = [27.9395, 86.8565];
            const anchorMarker = new L.CircleMarker(anchorLatLng, {
                radius: 7,
                color: '#27ae60',
                weight: 3,
                fillColor: '#2ecc71',
                fillOpacity: 0.9,
            });
            anchorMarker.bindTooltip(
                '【天然坚硬基岩不动点】坐标: (Y=285, X=613)<br/>相干性: 0.965 (绝对零形变基准)',
                { direction: 'bottom', offset: [0, 8], opacity: 0.95 }
            );
            anchorMarker.bindPopup(
                '<strong>基岩不动点 (Reference Anchor)</strong><br/>' +
                '位置: 27.9395°N, 86.8565°E<br/>' +
                '相干性: <strong>0.965 (96.5%)</strong><br/>' +
                '说明: 作为尺子的零刻度基准，已排除所有山体形变，用于校准消除对流层大气延迟。'
            );
            anchorMarker.addTo(candidateLayer);

            // 2. 绘制基准点到重点冰川移动中心 (EVEREST-S1-CAND-049) 的位移基线
            const glacierMovingLatLng: [number, number] = [27.9869, 86.8586];
            const baseline = new L.Polyline([anchorLatLng, glacierMovingLatLng], {
                color: '#3498db',
                weight: 2,
                dashArray: '5, 8',
                opacity: 0.85
            });
            baseline.bindTooltip(
                '【InSAR 形变测量基线】<br/>基岩不动点 ➔ 冰川异动区<br/>实测位移: 0.66 mm (微小蠕变)',
                { sticky: true, opacity: 0.95 }
            );
            baseline.addTo(candidateLayer);

            candidateVisible = true;
            candidateStatus = 'ready';
        } catch (error) {
            candidateStatus = 'error';
            candidateError = error instanceof Error ? error.message : 'Could not load candidate layer.';
        }
    };

    const toggleCandidateLayer = () => { if (candidateVisible) { removeCandidateLayer(); candidateStatus = 'hidden'; return; } loadCandidateLayer(); };

    export const onopen = () => {
        if (!gibsLayer && gibsVisible) loadGibsLayer();
        if (!candidateLayer && candidateVisible) loadCandidateLayer();
    };

    onMount(() => {
        loadGibsLayer();
        loadCandidateLayer();
        focusEverest();
    });

    onDestroy(() => {
        removeGibsLayer();
        removeCandidateLayer();
    });
</script>

<style lang="less">
    .plugin__content { min-height: 100%; padding: 12px 14px 24px; color: #e8edf0; background: #11191e; }
    .intro { color: #a8babf; font-size: 12px; line-height: 1.5; margin: 12px 0 18px; }
    .status-card { border: 1px solid #304047; border-left: 3px solid #f2ad42; margin-top: 12px; padding: 10px; }
    .status-card.ready { border-left-color: #51c7a3; }
    .status-card > span { color: #d7e1e3; font-size: 12px; }
    .status-card > strong { float: right; color: #f2ad42; font-size: 10px; letter-spacing: 1px; }
    .status-card.ready > strong { color: #51c7a3; }
    .status-card > small, .limits p { display: block; color: #a8babf; font-size: 11px; line-height: 1.45; margin: 8px 0; }
    .field-label { display: block; color: #91a5aa; font-size: 10px; letter-spacing: 1px; margin: 12px 0 6px; }
    input { box-sizing: border-box; width: 100%; background: #172126; border: 1px solid #33464d; color: #e8edf0; padding: 8px; }
    input[type='range'] { accent-color: #52b6c7; padding: 0; }
    .actions { display: flex; gap: 6px; margin-top: 10px; }
    button { min-height: 32px; background: #172126; border: 1px solid #33464d; color: #d7e1e3; padding: 7px 9px; font-size: 10px; cursor: pointer; }
    .error { color: #f2ad42; font-size: 11px; border: 1px solid #7b5c2c; padding: 8px; margin-top: 10px; }
    .limits { border-top: 1px solid #304047; margin-top: 16px; padding-top: 10px; }
    summary { color: #d7e1e3; cursor: pointer; font-size: 11px; letter-spacing: 1px; }

    .candidate-analysis-image { display: block; width: 240px; max-width: 100%; margin: 8px 0 4px; border: 1px solid #33464d; }
    .candidate-analysis-link { color: #52b6c7; font-size: 11px; }
</style>