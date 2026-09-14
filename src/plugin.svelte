<div class="plugin__mobile-header">{title}</div>
<section class="plugin__content">
    <div class="plugin__title plugin__title--chevron-back" on:click={() => bcast.emit('rqstOpen', 'menu')}>{title}</div>

    <details class="hazard-overview" open>
        <summary><span>AUTO ALERTS</span><strong>EXPERIMENTAL</strong></summary>
        <div class="hazard-overview__content">
            <p>点击类别即可切换到对应的实验性地图上下文。结果用于浏览和人工复核，不会发布正式路线关闭、撤离或 CAP 告警。</p>
            <div class="hazard-grid">
                {#each hazardStatuses as hazard}
                    <div class="hazard-card">
                        <span>{hazard.name}</span>
                        <strong>{hazard.status}</strong>
                        <small>{hazard.source}</small>
                        <button on:click={() => openExperimentalHazard(hazard)}>查看地图</button>
                    </div>
                {/each}
            </div>
            <div class="integration-status earthquake-status"><span>USGS 地震事件</span><strong>{earthquakeStatus.toUpperCase()}</strong><small>{earthquakeCount ? `最近一小时 ${earthquakeCount} 个事件` : '全球最近一小时 GeoJSON feed'}</small><button on:click={toggleEarthquakes}>{earthquakeVisible ? '隐藏地震' : '查看地震'}</button><button on:click={loadEarthquakes} disabled={earthquakeStatus === 'loading'}>刷新</button></div>
            <div class="integration-status fire-status"><span>NASA FIRMS 火点</span><strong>{fireStatus.toUpperCase()}</strong><small>{fireCount ? `珠峰实验 AOI ${fireCount} 个火点` : fireReason || '通过本地后端代理读取'}</small><button on:click={toggleFires}>{fireVisible ? '隐藏火点' : '查看火点'}</button><button on:click={loadFires} disabled={fireStatus === 'loading'}>刷新</button></div>
            <label class="field-label fire-api-field" for="firms-api-url">FIRMS API URL</label>
            <input id="firms-api-url" bind:value={fireApiUrl} on:change={saveFireApiUrl} />
            <div class="integration-status"><span>路线治理</span><strong>EXPERIMENTAL</strong><small>接口骨架已就绪，暂无授权路线网络</small></div>
            <div class="integration-status"><span>CAP 告警</span><strong>EXPERIMENTAL</strong><small>CAP 草案序列化已就绪，未连接分发渠道</small></div>
        </div>
    </details>

    <p class="intro">NASA GIBS imagery for map context. Imagery is not a hazard decision layer.</p>

    <div class="catalog-status" class:ready={catalogStatus === 'ready'}>
        <i></i>{catalogStatus === 'ready' ? `${catalogLayers.length} NASA GIBS layers ready` : catalogStatus.toUpperCase()}
        <button on:click={loadCatalog}>更新图层</button>
    </div>
    {#if catalogError}<div class="error-message">{catalogError}</div>{/if}

    <details class="monitor">
        <summary><span>EVEREST LIVE MONITOR</span><strong>{monitorStatus}</strong></summary>
        <div class="monitor__content">
            <p>影像前后切换仅供人工复核。未接入已验证变化指标时，不生成灾害结论或自动报警。</p>
            <label class="field-label" for="monitor-current">当前影像日期</label>
            <input id="monitor-current" type="date" bind:value={currentDate} max={today} />
            <label class="field-label" for="monitor-baseline">基线影像日期</label>
            <input id="monitor-baseline" type="date" bind:value={baselineDate} max={today} />
            <div class="monitor__actions"><button on:click={viewCurrent}>查看当前</button><button on:click={viewBaseline}>查看上期</button></div>
            <label class="compare-toggle"><input type="checkbox" checked={compareEnabled} on:change={updateComparison} /> 叠加比较</label>
            {#if compareEnabled}
                <label class="field-label" for="comparison-blend">当前影像比例 {Math.round(comparisonBlend * 100)}%</label>
                <input id="comparison-blend" type="range" min="0" max="1" step="0.05" value={comparisonBlend} on:input={updateComparisonBlend} />
            {/if}
            <small>风、雨、CAP 和自动风险等级在此简易影像比较中均已关闭。</small>
        </div>
    </details>

    <label class="field-label" for="gibs-search">SEARCH NASA GIBS</label>
    <input id="gibs-search" bind:value={query} placeholder="MODIS, VIIRS, snow, aerosol..." />
    <details class="theme-group" open>
        <summary>冰冻圈</summary>
        <div class="quick-filters">
            {#each cryosphereFilters as filter}<button class:active={activeFilter === filter.id} on:click={() => selectFilter(filter.id)}>{filter.label}</button>{/each}
        </div>
    </details>
    <details class="theme-group">
        <summary>陆地水圈</summary>
        <div class="quick-filters">
            {#each hydrosphereFilters as filter}<button class:active={activeFilter === filter.id} on:click={() => selectFilter(filter.id)}>{filter.label}</button>{/each}
        </div>
        <small>水体参考、水体指数、湿度指数需要 HLS/DSWx 或专门处理流程，不是现成 GIBS 图层。</small>
    </details>
    <details class="theme-group">
        <summary>Sentinel-2 / HLS</summary>
        <div class="quick-filters">
            {#each hlsFilters as filter}<button class:active={activeFilter === filter.id} on:click={() => selectFilter(filter.id)}>{filter.label}</button>{/each}
        </div>
    </details>
    <details class="theme-group">
        <summary>海洋参考（不代表珠峰冰川）</summary>
        <div class="quick-filters">
            {#each oceanFilters as filter}<button class:active={activeFilter === filter.id} on:click={() => selectFilter(filter.id)}>{filter.label}</button>{/each}
        </div>
    </details>

    <label class="field-label" for="gibs-layer">IMAGERY PRODUCT · {catalogLayers.length}</label>
    <select id="gibs-layer" size="7" bind:value={selectedLayerId} on:change={selectLayer}>
        {#each matchingLayers as layer}<option value={layer.id}>{layer.title} {layerHealth[layer.id] === 'available' ? '💚' : layerHealth[layer.id] === 'unavailable' ? '🔴' : '⚪'}</option>{/each}
    </select>
    <div class="catalog-actions"><small class="result-count">{matchingLayers.length} matching layers · {testCompleted}/{catalogLayers.length} tested</small><button on:click={testAllLayers} disabled={catalogStatus !== 'ready' || testStatus === 'running'}>{testStatus === 'running' ? 'TESTING...' : 'TEST ALL'}</button></div>

    <label class="field-label" for="gibs-date">OBSERVATION DATE</label>
    <input id="gibs-date" type="date" bind:value={selectedDate} max={today} disabled={!selectedLayer.timeEnabled} on:change={replaceLayer} />

    <div class="control-row">
        <label class="field-label" for="gibs-opacity">OPACITY {Math.round(opacity * 100)}%</label>
        <input id="gibs-opacity" type="range" min="0" max="1" step="0.05" bind:value={opacity} on:input={updateOpacity} />
    </div>

    <div class="control-row action-row">
        <span class:ready={tileStatus === 'ready'} class="tile-status"><i></i>{tileStatus.toUpperCase()}</span>
        <div class="map-actions"><button on:click={focusEverest}>定位珠峰</button><button on:click={refreshImagery}>刷新影像</button><button on:click={toggleLayer}>{visible ? 'HIDE MAP' : 'SHOW MAP'}</button></div>
    </div>
    {#if tileError}<div class="error-message">{tileError}</div>{/if}

    <div class="details"><span>{selectedLayer.title}</span><span>{selectedLayer.tileMatrixSet}</span><span>{selectedDate}</span></div>
    {#if selectedLayer.legendUrl}
        <details class="legend-panel"><summary>图例 / 单位</summary><img src={selectedLayer.legendUrl} alt="NASA GIBS layer legend" /></details>
    {:else}
        <small class="legend-note">当前图层没有 NASA 数值图例，通常为真彩色或分类影像。</small>
    {/if}
    <footer>Imagery provided by <a href="https://earthdata.nasa.gov/gibs" target="_blank">NASA EOSDIS GIBS</a>.</footer>
</section>

<script lang="ts">
    import bcast from '@windy/broadcast';
    import { layerOrder, map } from '@windy/map';
    import { onDestroy, onMount } from 'svelte';
    import config from './pluginConfig';

    type GIBSLayer = { id: string; title: string; template: string; tileMatrixSet: string; maxZoom: number; timeEnabled: boolean; defaultTime: string; legendUrl: string };
    type ThemeFilter = { id: string; label: string; terms: string[] };
    type HazardStatus = { id: string; name: string; status: 'EXPERIMENTAL'; source: string; filterId: string; query: string };
    type EarthquakeFeed = { features: Array<{ geometry: { coordinates: [number, number, number] }; properties: { mag: number | null; place: string; time: number; url: string } }> };
    type FireFeed = { status: string; reason?: string; features: Array<{ geometry: { coordinates: [number, number] }; properties: { observedAt: string; confidence?: string; frp?: string; satellite?: string; instrument?: string } }> };

    const { title } = config;
    const capabilitiesUrl = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml';
    const today = new Date().toISOString().slice(0, 10);
    const initialDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const initialLayers: GIBSLayer[] = [
        { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', title: 'MODIS Terra True Color', template: 'https://gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{Time}/GoogleMapsCompatible_Level9/{TileMatrix}/{TileRow}/{TileCol}.jpg', tileMatrixSet: 'GoogleMapsCompatible_Level9', maxZoom: 9, timeEnabled: true, defaultTime: initialDate, legendUrl: '' },
        { id: 'MODIS_Aqua_CorrectedReflectance_TrueColor', title: 'MODIS Aqua True Color', template: 'https://gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_CorrectedReflectance_TrueColor/default/{Time}/GoogleMapsCompatible_Level9/{TileMatrix}/{TileRow}/{TileCol}.jpg', tileMatrixSet: 'GoogleMapsCompatible_Level9', maxZoom: 9, timeEnabled: true, defaultTime: initialDate, legendUrl: '' },
        { id: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor', title: 'VIIRS NOAA-20 True Color', template: 'https://gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_NOAA20_CorrectedReflectance_TrueColor/default/{Time}/GoogleMapsCompatible_Level9/{TileMatrix}/{TileRow}/{TileCol}.jpg', tileMatrixSet: 'GoogleMapsCompatible_Level9', maxZoom: 9, timeEnabled: true, defaultTime: initialDate, legendUrl: '' },
    ];
    const hazardStatuses: HazardStatus[] = [
        { id: 'icefall', name: '冰崩 / 冰川变化', status: 'EXPERIMENTAL', source: '冰雪与真彩色影像', filterId: 'frozen-area', query: '' },
        { id: 'avalanche', name: '雪崩', status: 'EXPERIMENTAL', source: '积雪覆盖与雪指数影像', filterId: 'snow-cover', query: '' },
        { id: 'rockfall', name: '岩崩', status: 'EXPERIMENTAL', source: '高分辨率真彩色上下文', filterId: '', query: 'true color' },
        { id: 'landslide', name: '滑坡', status: 'EXPERIMENTAL', source: 'SAR 与真彩色上下文', filterId: 'rtc-sar', query: '' },
        { id: 'debris-flow', name: '泥石流', status: 'EXPERIMENTAL', source: '土壤湿度与水体影像', filterId: 'soil-moisture', query: '' },
        { id: 'flood', name: 'GLOF / 山洪', status: 'EXPERIMENTAL', source: '洪水与地表水影像', filterId: 'flood', query: '' },
        { id: 'earthquake', name: '地震', status: 'EXPERIMENTAL', source: 'USGS 最近一小时事件', filterId: '', query: '' },
        { id: 'fire', name: '火点', status: 'EXPERIMENTAL', source: 'NASA FIRMS 活动火点', filterId: '', query: '' },
        { id: 'weather', name: '高山天气', status: 'EXPERIMENTAL', source: '云图与基础地图上下文', filterId: '', query: 'true color' },
    ];
    const cryosphereFilters: ThemeFilter[] = [
        { id: 'freeze-thaw', label: '冷冻/解冻', terms: ['freeze', 'thaw'] },
        { id: 'frozen-area', label: '冰冻区域', terms: ['frozen'] },
        { id: 'ice-temperature', label: '冰雪表面温度', terms: ['ice surface temp'] },
        { id: 'rtc-sar', label: 'RTC SAR 后向散射', terms: ['radiometric terrain corrected sar', 'rtc sar'] },
        { id: 'snow-cover', label: '积雪覆盖', terms: ['snow cover', 'ndsi'] },
        { id: 'snow-depth', label: '积雪深度', terms: ['snow depth'] },
        { id: 'snow-extent', label: '积雪范围', terms: ['snow extent'] },
        { id: 'snow-index', label: '雪指数', terms: ['ndsi', 'snow index'] },
        { id: 'snow-water', label: '雪水当量', terms: ['snow water equivalent'] },
    ];
    const hydrosphereFilters: ThemeFilter[] = [
        { id: 'flood', label: '洪水观测', terms: ['combined flood'] },
        { id: 'flood-hazard', label: '洪水危险度（历史）', terms: ['flood hazard'] },
        { id: 'water-extent', label: '地表水范围', terms: ['water extent', 'surface water'] },
        { id: 'soil-moisture', label: '土壤湿度', terms: ['soil moisture'] },
        { id: 'reservoir', label: '水库', terms: ['reservoir'] },
    ];
    const oceanFilters: ThemeFilter[] = [
        { id: 'sea-ice', label: '海冰范围', terms: ['sea ice extent', 'sea ice concentration'] },
        { id: 'sea-ice-brightness', label: '海冰亮温', terms: ['brightness temperature for sea ice'] },
        { id: 'sea-temperature', label: '海表温度', terms: ['sea surface temperature'] },
        { id: 'sea-anomaly', label: '海温异常', terms: ['sea surface temperature anomalies'] },
    ];
    const hlsFilters: ThemeFilter[] = [
        { id: 'sentinel-reflectance', label: 'Sentinel-2 反射率', terms: ['sentinel-2 / msi', 'hls_s30'] },
        { id: 'dswx-hls', label: 'HLS 动态地表水', terms: ['dynamic surface water extent-hls', 'dswx-hls'] },
    ];

    let catalogLayers = initialLayers;
    let catalogStatus: 'loading' | 'ready' | 'error' = 'loading';
    let catalogError = '';
    let query = '';
    let activeFilter = '';
    let selectedLayerId = initialLayers[0].id;
    let selectedDate = initialDate;
    let currentDate = initialDate;
    let baselineDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    let monitorStatus = 'UNKNOWN';
    let opacity = 0.75;
    let visible = true;
    let tileStatus: 'loading' | 'ready' | 'hidden' | 'error' = 'loading';
    let tileError = '';
    let imageryLayer: L.TileLayer | null = null;
    let baselineLayer: L.TileLayer | null = null;
    let compareEnabled = false;
    let comparisonBlend = 0.5;
    let catalogController: AbortController | null = null;
    let testController: AbortController | null = null;
    let layerHealth: Record<string, 'available' | 'unavailable'> = {};
    let testStatus: 'idle' | 'running' | 'done' = 'idle';
    let testCompleted = 0;
    let earthquakeLayer: L.GeoJSON | null = null;
    let earthquakeController: AbortController | null = null;
    let earthquakeStatus: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
    let earthquakeCount = 0;
    let earthquakeVisible = false;
    let fireLayer: L.GeoJSON | null = null;
    let fireController: AbortController | null = null;
    let fireStatus: 'idle' | 'loading' | 'fresh' | 'unconfigured' | 'unavailable' | 'error' = 'idle';
    let fireCount = 0;
    let fireReason = '';
    let fireVisible = false;
    let fireApiUrl = localStorage.getItem('hqmw-firms-api-url') || 'http://127.0.0.1:18743/v1/external/fire-detections';

    $: selectedLayer = catalogLayers.find(layer => layer.id === selectedLayerId) || initialLayers[0];
    $: activeTerms = [...cryosphereFilters, ...hydrosphereFilters, ...oceanFilters, ...hlsFilters].find(filter => filter.id === activeFilter)?.terms || [];
    $: matchingLayers = catalogLayers.filter(layer => {
        const haystack = `${layer.title} ${layer.id}`.toLowerCase();
        const textMatches = !query.trim() || haystack.includes(query.trim().toLowerCase());
        const themeMatches = !activeTerms.length || activeTerms.some(term => haystack.includes(term));
        return textMatches && themeMatches;
    }).slice(0, 100);

    const directChildText = (element: Element, name: string) => Array.from(element.children).find(child => child.localName === name)?.textContent?.trim() || '';
    const buildTileUrl = (layer: GIBSLayer, time = selectedDate) => layer.template
        .replace('https://gibs.earthdata.nasa.gov/', 'https://gibs-{s}.earthdata.nasa.gov/')
        .replace(/\{Time\}/g, time)
        .replace(/\{TileMatrixSet\}/g, layer.tileMatrixSet)
        .replace(/\{TileMatrix\}/g, '{z}')
        .replace(/\{TileRow\}/g, '{y}')
        .replace(/\{TileCol\}/g, '{x}');

    const parseCapabilities = (xml: string): GIBSLayer[] => {
        const document = new DOMParser().parseFromString(xml, 'application/xml');
        if (document.getElementsByTagName('parsererror').length) throw new Error('NASA GIBS capabilities could not be parsed.');
        const parsed: GIBSLayer[] = [];
        for (const layerElement of Array.from(document.getElementsByTagNameNS('*', 'Layer'))) {
            const id = directChildText(layerElement, 'Identifier');
            const title = directChildText(layerElement, 'Title') || id;
            const formats = Array.from(layerElement.getElementsByTagNameNS('*', 'Format')).map(element => element.textContent?.trim());
            const extension = formats.includes('image/png') ? 'png' : formats.includes('image/jpeg') ? 'jpg' : '';
            const matrix = Array.from(layerElement.getElementsByTagNameNS('*', 'TileMatrixSet')).map(element => element.textContent?.trim()).find(value => value?.startsWith('GoogleMapsCompatible'));
            const timeDimension = Array.from(layerElement.getElementsByTagNameNS('*', 'Dimension')).find(element => directChildText(element, 'Identifier') === 'Time');
            const defaultTime = timeDimension ? directChildText(timeDimension, 'Default') : '';
            const legend = Array.from(layerElement.getElementsByTagNameNS('*', 'LegendURL'))[0];
            const legendUrl = legend?.getAttribute('xlink:href') || legend?.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || '';
            const resource = Array.from(layerElement.getElementsByTagNameNS('*', 'ResourceURL')).find(element => element.getAttribute('resourceType') === 'tile' && (element.getAttribute('format') === `image/${extension === 'jpg' ? 'jpeg' : extension}` || !element.getAttribute('format')))?.getAttribute('template');
            if (!id || !matrix || !resource || !extension) continue;
            const level = /Level(\d+)$/.exec(matrix);
            parsed.push({ id, title, template: resource, tileMatrixSet: matrix, maxZoom: level ? Number(level[1]) : 9, timeEnabled: resource.includes('{Time}'), defaultTime, legendUrl });
        }
        return parsed.sort((left, right) => left.title.localeCompare(right.title));
    };

    const removeLayer = () => { imageryLayer?.remove(); imageryLayer = null; };
    const removeBaselineLayer = () => { baselineLayer?.remove(); baselineLayer = null; };
    const removeEarthquakes = () => { earthquakeLayer?.remove(); earthquakeLayer = null; earthquakeVisible = false; };
    const removeFires = () => { fireLayer?.remove(); fireLayer = null; fireVisible = false; };
    const applyOpacity = () => {
        baselineLayer?.setOpacity(Number(opacity));
        imageryLayer?.setOpacity(Number(opacity) * (compareEnabled ? comparisonBlend : 1));
    };
    const replaceLayer = () => {
        removeLayer();
        removeBaselineLayer();
        tileError = '';
        if (!visible) { tileStatus = 'hidden'; return; }
        tileStatus = 'loading';
        if (compareEnabled) {
            baselineLayer = new L.TileLayer(buildTileUrl(selectedLayer, baselineDate), {
                minZoom: 0, maxNativeZoom: selectedLayer.maxZoom, maxZoom: 19,
                opacity: Number(opacity), tileSize: 256, layerBucketId: layerOrder.MAIN,
                subdomains: 'abc', noWrap: true, continuousWorld: true,
                bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
            });
            baselineLayer.addTo(map);
        }
        imageryLayer = new L.TileLayer(buildTileUrl(selectedLayer, compareEnabled ? currentDate : selectedDate), {
            minZoom: 0, maxNativeZoom: selectedLayer.maxZoom, maxZoom: 19,
            opacity: Number(opacity) * (compareEnabled ? comparisonBlend : 1), tileSize: 256, layerBucketId: layerOrder.MAIN,
            subdomains: 'abc', noWrap: true, continuousWorld: true,
            bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
        });
        imageryLayer.on('load', () => { tileStatus = 'ready'; });
        imageryLayer.on('tileerror', () => { tileStatus = 'error'; tileError = 'NASA GIBS imagery is unavailable for this product or date.'; });
        imageryLayer.addTo(map);
    };
    const updateOpacity = (event: Event) => {
        const value = Number((event.currentTarget as HTMLInputElement).value);
        opacity = value;
        applyOpacity();
    };
    const refreshImagery = () => {
        replaceLayer();
        loadCatalog();
    };
    const focusEverest = () => { map.setView([27.9881, 86.925], 10); };
    const toggleLayer = () => { visible = !visible; replaceLayer(); };
    const viewCurrent = () => { compareEnabled = false; selectedDate = currentDate; replaceLayer(); };
    const viewBaseline = () => { compareEnabled = false; selectedDate = baselineDate; replaceLayer(); };
    const updateComparison = (event: Event) => {
        compareEnabled = (event.currentTarget as HTMLInputElement).checked;
        replaceLayer();
    };
    const updateComparisonBlend = (event: Event) => {
        comparisonBlend = Number((event.currentTarget as HTMLInputElement).value);
        applyOpacity();
    };
    const selectLayer = () => {
        const layer = catalogLayers.find(item => item.id === selectedLayerId) || initialLayers[0];
        if (layer.timeEnabled && layer.defaultTime) selectedDate = layer.defaultTime.slice(0, 10);
        currentDate = selectedDate;
        replaceLayer();
    };
    const selectFilter = (filterId: string) => {
        activeFilter = activeFilter === filterId ? '' : filterId;
        query = '';
    };
    const openExperimentalHazard = (hazard: HazardStatus) => {
        if (hazard.id === 'earthquake') { toggleEarthquakes(); return; }
        if (hazard.id === 'fire') { toggleFires(); return; }
        activeFilter = hazard.filterId;
        query = hazard.query;
        focusEverest();
    };
    const loadEarthquakes = async () => {
        earthquakeController?.abort();
        const controller = new AbortController();
        earthquakeController = controller;
        earthquakeStatus = 'loading';
        try {
            const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson', { signal: controller.signal });
            if (!response.ok) throw new Error(`USGS: ${response.status}`);
            const feed = await response.json() as EarthquakeFeed;
            if (earthquakeController !== controller) return;
            removeEarthquakes();
            earthquakeCount = feed.features.length;
            earthquakeLayer = new L.GeoJSON(feed as never, {
                pointToLayer: (feature: { properties: EarthquakeFeed['features'][number]['properties'] }, latlng: L.LatLng) => {
                    const magnitude = feature.properties.mag ?? 0;
                    return L.circleMarker(latlng, { radius: Math.max(4, Math.min(12, magnitude * 2)), color: '#f2ad42', fillColor: '#f2ad42', fillOpacity: 0.75, weight: 1 });
                },
                onEachFeature: (feature: { geometry: EarthquakeFeed['features'][number]['geometry']; properties: EarthquakeFeed['features'][number]['properties'] }, layer: L.Layer) => {
                    const [longitude, latitude, depth] = feature.geometry.coordinates;
                    const popup = document.createElement('div');
                    popup.textContent = `EARTHQUAKE EVENT | M${feature.properties.mag ?? 'unknown'} | ${feature.properties.place || 'Unknown location'} | ${new Date(feature.properties.time).toISOString()} | Depth ${depth} km | ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
                    layer.bindPopup(popup);
                },
            });
            earthquakeLayer.addTo(map);
            earthquakeVisible = true;
            earthquakeStatus = 'ready';
        } catch (error) {
            if (earthquakeController !== controller || controller.signal.aborted) return;
            earthquakeStatus = 'error';
        } finally {
            if (earthquakeController === controller) earthquakeController = null;
        }
    };
    const toggleEarthquakes = () => {
        if (earthquakeVisible) { removeEarthquakes(); return; }
        if (earthquakeLayer) { earthquakeLayer.addTo(map); earthquakeVisible = true; return; }
        loadEarthquakes();
    };
    const saveFireApiUrl = () => localStorage.setItem('hqmw-firms-api-url', fireApiUrl.trim());
    const loadFires = async () => {
        fireController?.abort();
        const controller = new AbortController();
        fireController = controller;
        fireStatus = 'loading'; fireReason = '';
        try {
            const response = await fetch(fireApiUrl, { signal: controller.signal });
            if (!response.ok) throw new Error(`FIRMS proxy: ${response.status}`);
            const feed = await response.json() as FireFeed;
            if (fireController !== controller) return;
            fireStatus = feed.status.toLowerCase() as typeof fireStatus;
            fireReason = feed.reason || '';
            removeFires();
            fireCount = feed.features.length;
            if (feed.status !== 'FRESH') return;
            fireLayer = new L.GeoJSON(feed as never, {
                pointToLayer: (_feature: object, latlng: L.LatLng) => L.circleMarker(latlng, { radius: 5, color: '#e85d3f', fillColor: '#e85d3f', fillOpacity: 0.8, weight: 1 }),
                onEachFeature: (feature: { geometry: FireFeed['features'][number]['geometry']; properties: FireFeed['features'][number]['properties'] }, layer: L.Layer) => {
                    const [longitude, latitude] = feature.geometry.coordinates;
                    const popup = document.createElement('div');
                    popup.textContent = `ACTIVE FIRE DETECTION | ${feature.properties.observedAt} | Confidence ${feature.properties.confidence ?? 'unknown'} | FRP ${feature.properties.frp ?? 'unknown'} | ${feature.properties.satellite ?? 'unknown'} ${feature.properties.instrument ?? ''} | ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
                    layer.bindPopup(popup);
                },
            });
            fireLayer.addTo(map);
            fireVisible = true;
        } catch (error) {
            if (fireController !== controller || controller.signal.aborted) return;
            fireStatus = 'error';
            fireReason = error instanceof Error ? error.message : 'FIRMS proxy is unavailable';
        } finally {
            if (fireController === controller) fireController = null;
        }
    };
    const toggleFires = () => {
        if (fireVisible) { removeFires(); return; }
        if (fireLayer) { fireLayer.addTo(map); fireVisible = true; return; }
        loadFires();
    };

    const loadCatalog = async () => {
        catalogController?.abort();
        const controller = new AbortController();
        catalogController = controller;
        catalogStatus = 'loading'; catalogError = '';
        try {
            const response = await fetch(capabilitiesUrl, { signal: controller.signal });
            if (!response.ok) throw new Error(`NASA GIBS: ${response.status}`);
            const parsed = parseCapabilities(await response.text());
            if (catalogController !== controller || !parsed.length) return;
            catalogLayers = parsed;
            layerHealth = {};
            testCompleted = 0;
            testStatus = 'idle';
            if (!catalogLayers.some(layer => layer.id === selectedLayerId)) selectedLayerId = catalogLayers[0].id;
            const layer = catalogLayers.find(item => item.id === selectedLayerId) || catalogLayers[0];
            if (layer.timeEnabled && layer.defaultTime) selectedDate = layer.defaultTime.slice(0, 10);
            currentDate = selectedDate;
            catalogStatus = 'ready';
            replaceLayer();
        } catch (error) {
            if (catalogController !== controller || controller.signal.aborted) return;
            catalogStatus = 'error';
            catalogError = error instanceof Error ? error.message : 'NASA GIBS catalog is unavailable.';
        } finally {
            if (catalogController === controller) catalogController = null;
        }
    };

    const testLayer = (layer: GIBSLayer, signal: AbortSignal) => new Promise<boolean>(resolve => {
        const image = new Image();
        const timeout = setTimeout(() => { image.src = ''; resolve(false); }, 10000);
        const finish = (result: boolean) => { clearTimeout(timeout); resolve(result); };
        signal.addEventListener('abort', () => finish(false), { once: true });
        image.onload = () => finish(true);
        image.onerror = () => finish(false);
        const zoom = Math.min(1, layer.maxZoom);
        image.src = buildTileUrl(layer, layer.defaultTime || selectedDate).replace('{z}', String(zoom)).replace('{y}', '0').replace('{x}', '0').replace('{s}', 'a');
    });

    const testAllLayers = async () => {
        testController?.abort();
        const controller = new AbortController();
        testController = controller;
        layerHealth = {}; testCompleted = 0; testStatus = 'running';
        let next = 0;
        const worker = async () => {
            while (!controller.signal.aborted) {
                const layer = catalogLayers[next++];
                if (!layer) return;
                const result = await testLayer(layer, controller.signal);
                if (controller.signal.aborted) return;
                layerHealth = { ...layerHealth, [layer.id]: result ? 'available' : 'unavailable' };
                testCompleted += 1;
            }
        };
        await Promise.all(Array.from({ length: 4 }, worker));
        if (testController === controller) { testController = null; testStatus = 'done'; }
    };

    export const onopen = () => { if (!imageryLayer && visible) replaceLayer(); };
    onMount(() => { replaceLayer(); loadCatalog(); });
    onDestroy(() => { catalogController?.abort(); testController?.abort(); earthquakeController?.abort(); fireController?.abort(); removeLayer(); removeBaselineLayer(); removeEarthquakes(); removeFires(); });
</script>

<style lang="less">
    .plugin__content { padding: 12px 14px 24px; color: #e8edf0; background: #11191e; min-height: 100%; } .intro { color: #a8babf; font-size: 12px; line-height: 1.5; margin: 12px 0 18px; } .hazard-overview { border:1px solid #304047; border-left:3px solid #52b6c7; margin:0 0 14px; padding:8px 10px; } .hazard-overview summary { display:flex; align-items:center; justify-content:space-between; color:#d7e1e3; font-size:11px; letter-spacing:1px; } .hazard-overview summary strong,.hazard-card strong,.integration-status strong { color:#52b6c7; font-size:10px; } .hazard-overview__content > p { color:#a8babf; font-size:11px; line-height:1.45; margin:8px 0; } .hazard-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px; } .hazard-card { border:1px solid #304047; padding:7px; min-height:76px; } .hazard-card span,.integration-status span { display:block; color:#d7e1e3; font-size:10px; line-height:1.25; } .hazard-card strong { display:block; margin:4px 0; } .hazard-card small,.integration-status small { display:block; color:#71858a; font-size:9px; line-height:1.3; } .hazard-card button { margin-top:6px; padding:4px 6px; } .integration-status { display:grid; grid-template-columns:minmax(0,1fr) auto auto; column-gap:8px; border-top:1px solid #304047; margin-top:8px; padding-top:8px; } .integration-status small { grid-column:1 / -1; margin-top:3px; } .earthquake-status button,.fire-status button { padding:4px 6px; } .fire-api-field { margin-top:10px; }
    .field-label { display: block; color: #91a5aa; font-size: 10px; letter-spacing: 1px; margin: 15px 0 6px; } input, select { box-sizing: border-box; width: 100%; background: #172126; border: 1px solid #33464d; color: #e8edf0; padding: 8px; } input[type='range'] { accent-color: #52b6c7; padding: 0; } select { font-size: 11px; } .monitor { border:1px solid #304047; border-left:3px solid #f2ad42; margin-top:14px; padding:8px 10px; } .monitor summary { display:flex; align-items:center; justify-content:space-between; color:#d7e1e3; font-size:11px; letter-spacing:1px; } .monitor summary strong { color:#f2ad42; font-size:10px; } .monitor p,.monitor small { display:block; color:#a8babf; font-size:11px; line-height:1.45; margin:8px 0; } .monitor small { color:#71858a; font-size:10px; } .monitor__actions { display:flex; gap:6px; margin-top:12px; } .compare-toggle { display:block; color:#d7e1e3; font-size:11px; margin-top:12px; } .compare-toggle input { width:auto; vertical-align:middle; } .theme-group { border-top: 1px solid #304047; margin-top: 12px; padding-top: 8px; } summary { color:#a8babf; cursor:pointer; font-size:11px; } .theme-group small { display:block; color:#71858a; font-size:10px; margin-top:8px; line-height:1.4; } .quick-filters { display:flex; flex-wrap:wrap; align-items:center; gap:5px; margin-top:8px; } .quick-filters button { padding:5px 6px; } .quick-filters button.active { background:#52b6c7; border-color:#52b6c7; color:#101719; } .catalog-actions { display:flex; align-items:center; justify-content:space-between; margin-top:6px; } .result-count { color: #71858a; font-size: 10px; } button:disabled { cursor: wait; opacity: 0.55; }
    .catalog-status, .tile-status { color: #f2ad42; font-size: 10px; letter-spacing: 1px; } .catalog-status { display: flex; align-items: center; justify-content: space-between; border: 1px solid #33464d; padding: 7px; } .catalog-status.ready, .tile-status.ready { color: #51c7a3; } .catalog-status i, .tile-status i { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: currentColor; margin-right: 5px; } button { background: #172126; border: 1px solid #33464d; color: #d7e1e3; padding: 7px 9px; font-size: 10px; cursor: pointer; }
    .control-row { margin-top: 16px; } .action-row { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #304047; padding-top: 14px; } .map-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:6px; } .legend-panel { border:1px solid #304047; margin-top:12px; padding:7px; } .legend-panel summary { color:#a8babf; } .legend-panel img { display:block; max-width:100%; margin-top:8px; background:#fff; } .legend-note { display:block; color:#71858a; font-size:10px; margin-top:12px; } .error-message { color:#f2ad42; font-size:11px; border:1px solid #7b5c2c; padding:8px; margin-top:10px; overflow-wrap:anywhere; } .details { display:grid; gap:4px; margin-top:18px; color:#71858a; font-size:10px; } footer { color:#869ba0; font-size:10px; border-top:1px solid #304047; margin-top:18px; padding-top:12px; } a { color:#52b6c7; }
</style>
