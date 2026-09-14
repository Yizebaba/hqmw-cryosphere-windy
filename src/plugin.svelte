<div class="plugin__mobile-header">{title}</div>
<section class="plugin__content">
    <div class="plugin__title plugin__title--chevron-back" on:click={() => bcast.emit('rqstOpen', 'menu')}>{title}</div>

    <details class="hazard-overview" open>
        <summary><span>自动报警 / 事件监测</span><strong>v{config.version}</strong></summary>
        <div class="hazard-overview__content">
            <p>USGS 地震与 NASA FIRMS 热异常观测。自动报警尚未接入决策服务。</p>
            <div class="integration-status earthquake-status"><span>USGS 地震事件</span><strong>{statusLabel(earthquakeStatus)}</strong><small>{earthquakeCount ? `最近一小时 ${earthquakeCount} 个事件` : '全球最近一小时 GeoJSON feed'}</small><button on:click={toggleEarthquakes}>{earthquakeVisible ? '隐藏地震' : '查看地震'}</button><button on:click={loadEarthquakes} disabled={earthquakeStatus === 'loading'}>刷新</button></div>
            {#if earthquakeVisible}
                <div class="event-list">
                    {#each earthquakeEvents as event}
                        <button on:click={() => { map.setView(event.position, 6); event.layer.openPopup(); }}>M{event.magnitude ?? '?'} · {event.place}</button>
                    {/each}
                </div>
            {/if}
            <div class="integration-status fire-status"><span>NASA FIRMS 火点</span><strong>{statusLabel(fireStatus)}</strong><small>{fireCount ? `珠峰 AOI ${fireCount} 个火点` : fireReason || '通过本地后端代理读取'}</small><button on:click={toggleFires}>{fireVisible ? '隐藏火点' : '查看火点'}</button><button on:click={loadFires} disabled={fireStatus === 'loading'}>刷新</button></div>
            {#if sourceFeedback}<div class="source-feedback" role="status" aria-live="polite">{sourceFeedback}</div>{/if}
            <details class="connection-settings"><summary>连接设置与服务状态</summary>
                <label class="field-label fire-api-field" for="firms-api-url">FIRMS 后端地址</label>
                <input id="firms-api-url" bind:value={fireApiUrl} on:change={saveFireApiUrl} />
                <p>本地地址仅在运行后端的电脑上可用。</p>
                <p>路线与撤离：尚未导入授权路线、避难点或关闭状态。</p>
                <p>CAP 通知：尚未配置签名和递送渠道。</p>
            </details>
        </div>
    </details>

    <h3>卫星影像</h3>
    <p class="intro">NASA GIBS 观测产品。以下类别打开对应影像，灾害事件模型尚未接入。</p>
    <details class="cdse-direct" open>
        <summary><span>CDSE Sentinel-2 直连</span><strong>{statusLabel(cdseStatus)}</strong></summary>
        <p>经本机后端直接请求 Copernicus Data Space Sentinel-2 L2A PNG 瓦片。</p>
        <label class="field-label" for="cdse-date">观测日期</label>
        <input id="cdse-date" type="date" bind:value={cdseDate} max={today} />
        <div class="monitor__actions"><button on:click={toggleCdseLayer}>{cdseVisible ? '隐藏 CDSE 图层' : '显示 CDSE 图层'}</button><button on:click={refreshCdseLayer} disabled={cdseStatus === 'loading'}>刷新</button></div>
        {#if cdseError}<div class="error-message">{cdseError}</div>{/if}
        <div class="cdse-sar">
            <span>CDSE Sentinel-1 GRD SAR (VV)</span><strong>{statusLabel(sentinel1Status)}</strong>
            <label class="field-label" for="sentinel1-date">观测日期</label>
            <input id="sentinel1-date" type="date" bind:value={sentinel1Date} max={today} />
            <div class="monitor__actions"><button on:click={toggleSentinel1Layer}>{sentinel1Visible ? '隐藏 SAR 图层' : '显示 SAR 图层'}</button><button on:click={refreshSentinel1Layer} disabled={sentinel1Status === 'loading'}>刷新</button></div>
            {#if sentinel1Error}<div class="error-message">{sentinel1Error}</div>{/if}
        </div>
        <div class="coherence-layer">
            <span>S1 相干性 · 2026-08-19 至 2026-08-31 · VV</span><strong>{statusLabel(coherenceStatus)}</strong>
            <small>0 代表低相干，1 代表高相干；用于变化筛查，不是位移。</small>
            <div class="monitor__actions"><button on:click={toggleCoherenceLayer}>{coherenceVisible ? '隐藏相干性' : '显示相干性'}</button><button on:click={refreshCoherenceLayer} disabled={coherenceStatus === 'loading'}>刷新</button></div>
            {#if coherenceError}<div class="error-message">{coherenceError}</div>{/if}
        </div>
        <details class="connection-settings"><summary>CDSE 后端地址</summary><input bind:value={cdseApiUrl} on:change={saveCdseApiUrl} /></details>
    </details>
    <div class="hazard-grid">
        {#each hazardStatuses.filter(hazard => !['earthquake', 'fire'].includes(hazard.id)) as hazard}
            <button class="hazard-card" on:click={() => openExperimentalHazard(hazard)} disabled={catalogStatus !== 'ready'}>
                <span>{hazard.name}</span><small>{hazard.source}</small>
            </button>
        {/each}
    </div>

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
    type HazardStatus = { id: string; name: string; status: 'MAP'; source: string; filterId: string; query: string };
    type EarthquakeFeed = { features: Array<{ geometry: { coordinates: [number, number, number] }; properties: { mag: number | null; place: string; time: number; url: string } }> };
    type FireFeed = { status: string; reason?: string; features: Array<{ geometry: { coordinates: [number, number] }; properties: { observedAt: string; confidence?: string; frp?: string; satellite?: string; instrument?: string } }> };

    const { title } = config;
    const statusLabel = (status: string) => ({ idle: '待加载', loading: '加载中', ready: '已加载', fresh: '已更新', unconfigured: '未配置', unavailable: '不可用', error: '错误' }[status] || status);
    const capabilitiesUrl = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/1.0.0/WMTSCapabilities.xml';
    const today = new Date().toISOString().slice(0, 10);
    const initialDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const initialLayers: GIBSLayer[] = [
        { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', title: 'MODIS Terra True Color', template: 'https://gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{Time}/GoogleMapsCompatible_Level9/{TileMatrix}/{TileRow}/{TileCol}.jpg', tileMatrixSet: 'GoogleMapsCompatible_Level9', maxZoom: 9, timeEnabled: true, defaultTime: initialDate, legendUrl: '' },
        { id: 'MODIS_Aqua_CorrectedReflectance_TrueColor', title: 'MODIS Aqua True Color', template: 'https://gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_CorrectedReflectance_TrueColor/default/{Time}/GoogleMapsCompatible_Level9/{TileMatrix}/{TileRow}/{TileCol}.jpg', tileMatrixSet: 'GoogleMapsCompatible_Level9', maxZoom: 9, timeEnabled: true, defaultTime: initialDate, legendUrl: '' },
        { id: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor', title: 'VIIRS NOAA-20 True Color', template: 'https://gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_NOAA20_CorrectedReflectance_TrueColor/default/{Time}/GoogleMapsCompatible_Level9/{TileMatrix}/{TileRow}/{TileCol}.jpg', tileMatrixSet: 'GoogleMapsCompatible_Level9', maxZoom: 9, timeEnabled: true, defaultTime: initialDate, legendUrl: '' },
    ];
    const hazardStatuses: HazardStatus[] = [
        { id: 'icefall', name: '冰川影像', status: 'MAP', source: '真彩色观测', filterId: '', query: 'true color' },
        { id: 'avalanche', name: '雪崩', status: 'MAP', source: '积雪覆盖与雪指数影像', filterId: 'snow-cover', query: '' },
        { id: 'rockfall', name: '岩崩背景', status: 'MAP', source: '真彩色观测，非岩崩检测', filterId: '', query: 'true color' },
        { id: 'landslide', name: '滑坡', status: 'MAP', source: 'SAR 与真彩色上下文', filterId: 'rtc-sar', query: '' },
        { id: 'debris-flow', name: '泥石流', status: 'MAP', source: '土壤湿度与水体影像', filterId: 'soil-moisture', query: '' },
        { id: 'flood', name: 'GLOF / 山洪', status: 'MAP', source: '洪水与地表水影像', filterId: 'flood', query: '' },
        { id: 'earthquake', name: '地震', status: 'MAP', source: 'USGS 最近一小时事件', filterId: '', query: '' },
        { id: 'fire', name: '火点', status: 'MAP', source: 'NASA FIRMS 活动火点', filterId: '', query: '' },
        { id: 'weather', name: '云观测', status: 'MAP', source: '卫星云量产品', filterId: '', query: 'cloud fraction' },
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
        { id: 'flood', label: '洪水观测', terms: ['flood ('] },
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
    let earthquakeEvents: Array<{magnitude: number | null; place: string; position: [number, number]; layer: L.Layer}> = [];
    let fireLayer: L.GeoJSON | null = null;
    let fireController: AbortController | null = null;
    let fireStatus: 'idle' | 'loading' | 'fresh' | 'unconfigured' | 'unavailable' | 'error' = 'idle';
    let fireCount = 0;
    let fireReason = '';
    let fireVisible = false;
    const defaultFireApiUrl = 'http://127.0.0.1:18743/v1/external/fire-detections';
    const storedFireApiUrl = (() => { try { return localStorage.getItem('hqmw-firms-api-url'); } catch { return null; } })();
    let fireApiUrl = !storedFireApiUrl || storedFireApiUrl === 'http://127.0.0.1:8000/v1/external/fire-detections' ? defaultFireApiUrl : storedFireApiUrl;
    let sourceFeedback = '';
    let cdseLayer: L.TileLayer | null = null;
    let cdseVisible = false;
    let cdseStatus: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
    let cdseError = '';
    let cdseDate = initialDate;
    const defaultCdseApiUrl = 'http://127.0.0.1:18743/v1/cdse/sentinel2/tiles/{z}/{x}/{y}.png?date={date}';
    const storedCdseApiUrl = (() => { try { return localStorage.getItem('hqmw-cdse-api-url'); } catch { return null; } })();
    let cdseApiUrl = storedCdseApiUrl || defaultCdseApiUrl;
    let sentinel1Layer: L.TileLayer | null = null;
    let sentinel1Visible = false;
    let sentinel1Status: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
    let sentinel1Error = '';
    let sentinel1Date = '2026-08-19';
    let coherenceLayer: L.TileLayer | null = null;
    let coherenceVisible = false;
    let coherenceStatus: 'idle' | 'loading' | 'ready' | 'error' = 'idle';
    let coherenceError = '';
    const coherenceApiUrl = 'http://127.0.0.1:18744/cog/tiles/WebMercatorQuad/{z}/{x}/{y}.png?url=%2Fdata%2Fcoherence_IW2_VV_20260819_20260831.cog.tif&rescale=0,1&colormap_name=viridis';

    $: selectedLayer = catalogLayers.find(layer => layer.id === selectedLayerId) || initialLayers[0];
    $: activeTerms = [...cryosphereFilters, ...hydrosphereFilters, ...oceanFilters, ...hlsFilters].find(filter => filter.id === activeFilter)?.terms || [];
    $: matchingLayers = catalogLayers.filter(layer => {
        const haystack = `${layer.title} ${layer.id}`.toLowerCase();
        const textMatches = !query.trim() || haystack.includes(query.trim().toLowerCase());
        const themeMatches = !activeTerms.length || activeTerms.some(term => layer.title.toLowerCase().includes(term));
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
    const probeGibsTile = (layer: GIBSLayer, time: string) => new Promise<boolean>(resolve => {
        const image = new Image();
        const timeout = setTimeout(() => { image.src = ''; resolve(false); }, 15000);
        const finish = (result: boolean) => { clearTimeout(timeout); resolve(result); };
        image.onload = () => finish(true);
        image.onerror = () => finish(false);
        image.src = buildTileUrl(layer, time).replace('{z}', '1').replace('{y}', '0').replace('{x}', '0').replace('{s}', 'a');
    });

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
    const removeCdseLayer = () => { cdseLayer?.remove(); cdseLayer = null; cdseVisible = false; };
    const removeSentinel1Layer = () => { sentinel1Layer?.remove(); sentinel1Layer = null; sentinel1Visible = false; };
    const removeCoherenceLayer = () => { coherenceLayer?.remove(); coherenceLayer = null; coherenceVisible = false; };
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
                opacity: Number(opacity), tileSize: 256, layerBucketId: layerOrder.AIRSPACES,
                subdomains: 'abc', noWrap: true, continuousWorld: true,
                bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
            });
            baselineLayer.addTo(map);
        }
        imageryLayer = new L.TileLayer(buildTileUrl(selectedLayer, compareEnabled ? currentDate : selectedDate), {
            minZoom: 0, maxNativeZoom: selectedLayer.maxZoom, maxZoom: 19,
            opacity: Number(opacity) * (compareEnabled ? comparisonBlend : 1), tileSize: 256, layerBucketId: layerOrder.AIRSPACES,
            subdomains: 'abc', noWrap: true, continuousWorld: true,
            bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
        });
        imageryLayer.on('tileload', () => { tileStatus = 'ready'; });
        imageryLayer.on('tileerror', () => { tileStatus = 'error'; tileError = 'NASA GIBS imagery is unavailable for this product or date.'; });
        imageryLayer.addTo(map);
        const activeLayer = imageryLayer;
        const layerTime = compareEnabled ? currentDate : selectedDate;
        void probeGibsTile(selectedLayer, layerTime).then(available => {
            if (imageryLayer !== activeLayer || !visible) return;
            tileStatus = available ? 'ready' : 'error';
            tileError = available ? '' : 'NASA GIBS 当前产品或日期没有可用瓦片。';
        });
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
        selectedLayer = layer;
        visible = true;
        compareEnabled = false;
        replaceLayer();
    };
    const activateMatchingLayer = () => {
        const terms = [...cryosphereFilters, ...hydrosphereFilters, ...oceanFilters, ...hlsFilters].find(filter => filter.id === activeFilter)?.terms || [];
        const layer = catalogLayers.find(layer => {
            const text = layer.title.toLowerCase();
            return (!query || text.includes(query.toLowerCase())) && (!terms.length || terms.some(term => text.includes(term)));
        });
        if (!layer) { sourceFeedback = 'NASA GIBS 当前目录没有匹配产品，地图保留原图层。'; return; }
        selectedLayerId = layer.id;
        selectLayer();
        sourceFeedback = `正在加载 ${layer.title} · ${selectedDate}`;
    };
    const selectFilter = (filterId: string) => {
        activeFilter = activeFilter === filterId ? '' : filterId;
        query = '';
        activateMatchingLayer();
    };
    const openExperimentalHazard = (hazard: HazardStatus) => {
        if (hazard.id === 'earthquake') { toggleEarthquakes(); return; }
        if (hazard.id === 'fire') { toggleFires(); return; }
        activeFilter = hazard.filterId;
        query = hazard.query;
        activateMatchingLayer();
        focusEverest();
    };
    const loadEarthquakes = async () => {
        earthquakeController?.abort();
        const controller = new AbortController();
        earthquakeController = controller;
        const timeout = setTimeout(() => controller.abort(), 20000);
        earthquakeStatus = 'loading'; sourceFeedback = '正在加载 USGS 最近一小时地震事件...';
        try {
            const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson', { signal: controller.signal });
            if (!response.ok) throw new Error(`USGS: ${response.status}`);
            const feed = await response.json() as EarthquakeFeed;
            if (earthquakeController !== controller) return;
            removeEarthquakes();
            earthquakeEvents = [];
            earthquakeCount = feed.features.length;
            earthquakeLayer = new L.GeoJSON(feed as never, {
                style: () => ({}),
                pointToLayer: (feature: { properties: EarthquakeFeed['features'][number]['properties'] }, latlng: L.LatLng) => {
                    const magnitude = feature.properties.mag ?? 0;
                    return L.circleMarker(latlng, { radius: Math.max(4, Math.min(12, magnitude * 2)), color: '#f2ad42', fillColor: '#f2ad42', fillOpacity: 0.75, weight: 1 });
                },
                onEachFeature: (feature: { geometry: EarthquakeFeed['features'][number]['geometry']; properties: EarthquakeFeed['features'][number]['properties'] }, layer: L.Layer) => {
                    const [longitude, latitude, depth] = feature.geometry.coordinates;
                    const popup = document.createElement('div');
                    popup.textContent = `EARTHQUAKE EVENT | M${feature.properties.mag ?? 'unknown'} | ${feature.properties.place || 'Unknown location'} | ${new Date(feature.properties.time).toISOString()} | Depth ${depth} km | ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
                    layer.bindPopup(popup);
                    earthquakeEvents = [...earthquakeEvents, {magnitude: feature.properties.mag, place: feature.properties.place, position: [latitude, longitude], layer}];
                },
            });
            earthquakeLayer.addTo(map);
            earthquakeVisible = true;
            earthquakeStatus = 'ready';
            const bounds = earthquakeLayer.getBounds();
            if (bounds.isValid()) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 5 });
            sourceFeedback = `已加载 ${earthquakeCount} 个 USGS 地震事件，并定位到事件范围。`;
        } catch (error) {
            if (earthquakeController !== controller) return;
            earthquakeStatus = 'error';
            sourceFeedback = controller.signal.aborted ? 'USGS 请求超时，请重试。' : `地震加载失败：${error instanceof Error ? error.message : String(error)}`;
        } finally {
            clearTimeout(timeout);
            if (earthquakeController === controller) earthquakeController = null;
        }
    };
    const toggleEarthquakes = () => {
        if (earthquakeVisible) { removeEarthquakes(); sourceFeedback = 'USGS 地震图层已隐藏。'; return; }
        if (earthquakeLayer) { earthquakeLayer.addTo(map); earthquakeVisible = true; return; }
        loadEarthquakes();
    };
    const saveFireApiUrl = () => { fireApiUrl = fireApiUrl.trim(); try { localStorage.setItem('hqmw-firms-api-url', fireApiUrl); } catch { sourceFeedback = '浏览器不允许保存地址，本次会话仍可使用。'; } };
    const loadFires = async () => {
        fireController?.abort();
        const controller = new AbortController();
        fireController = controller;
        const timeout = setTimeout(() => controller.abort(), 25000);
        fireStatus = 'loading'; fireReason = ''; sourceFeedback = '正在加载 NASA FIRMS 火点...';
        try {
            const response = await fetch(fireApiUrl, { signal: controller.signal });
            if (!response.ok) throw new Error(`FIRMS proxy: ${response.status}`);
            const feed = await response.json() as FireFeed;
            if (fireController !== controller) return;
            fireStatus = feed.status.toLowerCase() as typeof fireStatus;
            fireReason = feed.reason || '';
            removeFires();
            fireCount = feed.features.length;
            if (feed.status !== 'FRESH') { sourceFeedback = feed.reason || 'FIRMS 当前不可用。'; return; }
            if (!fireCount) { fireReason = '本次查询返回 0 个活动火点'; sourceFeedback = 'FIRMS 已刷新：当前查询区域没有活动火点。'; return; }
            fireLayer = new L.GeoJSON(feed as never, {
                style: () => ({}),
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
            const bounds = fireLayer.getBounds();
            if (bounds.isValid()) map.fitBounds(bounds, { padding: [32, 32], maxZoom: 10 });
            sourceFeedback = `已加载 ${fireCount} 个 NASA FIRMS 火点。`;
        } catch (error) {
            if (fireController !== controller) return;
            fireStatus = 'error';
            fireReason = error instanceof Error ? error.message : 'FIRMS proxy is unavailable';
            sourceFeedback = controller.signal.aborted ? 'FIRMS 请求超时，请检查后端。' : `火点加载失败：${fireReason}。请检查连接设置及浏览器本地网络权限。`;
        } finally {
            clearTimeout(timeout);
            if (fireController === controller) fireController = null;
        }
    };
    const toggleFires = () => {
        if (fireVisible) { removeFires(); sourceFeedback = 'NASA FIRMS 火点图层已隐藏。'; return; }
        if (fireLayer) { fireLayer.addTo(map); fireVisible = true; return; }
        loadFires();
    };
    const saveCdseApiUrl = () => { cdseApiUrl = cdseApiUrl.trim(); try { localStorage.setItem('hqmw-cdse-api-url', cdseApiUrl); } catch { cdseError = '浏览器不允许保存 CDSE 地址。'; } };
    const cdseTileUrl = (z: number, x: number, y: number) => cdseApiUrl
        .replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y)).replace('{date}', cdseDate);
    const loadCdseLayer = async () => {
        removeCdseLayer();
        cdseStatus = 'loading'; cdseError = '';
        try {
            const response = await fetch(cdseTileUrl(10, 759, 428));
            if (!response.ok) throw new Error(`CDSE 后端返回 ${response.status}`);
            if (!response.headers.get('content-type')?.startsWith('image/')) throw new Error('CDSE 后端没有返回图像');
        } catch (error) {
            cdseStatus = 'error';
            cdseError = error instanceof Error ? error.message : 'CDSE 图层预检失败';
            return;
        }
        cdseLayer = new L.TileLayer(cdseApiUrl.replace('{date}', cdseDate), {
            minZoom: 0, maxNativeZoom: 12, maxZoom: 19, opacity: 0.85, tileSize: 256,
            layerBucketId: layerOrder.AIRSPACES, noWrap: true, continuousWorld: true,
            bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
        });
        cdseLayer.on('tileerror', () => { cdseStatus = 'error'; cdseError = 'CDSE 图层未返回瓦片。请检查 OAuth client、后端服务和观测日期。'; });
        cdseLayer.addTo(map);
        cdseVisible = true;
        cdseStatus = 'ready';
    };
    const toggleCdseLayer = () => { if (cdseVisible) { removeCdseLayer(); return; } loadCdseLayer(); };
    const refreshCdseLayer = () => { loadCdseLayer(); };
    const sentinel1ApiUrl = () => cdseApiUrl.replace('/sentinel2/', '/sentinel1/');
    const sentinel1TileUrl = (z: number, x: number, y: number) => sentinel1ApiUrl()
        .replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y)).replace('{date}', sentinel1Date);
    const loadSentinel1Layer = async () => {
        removeSentinel1Layer();
        sentinel1Status = 'loading'; sentinel1Error = '';
        try {
            const response = await fetch(sentinel1TileUrl(10, 759, 428));
            if (!response.ok) throw new Error(`CDSE 后端返回 ${response.status}`);
            if (!response.headers.get('content-type')?.startsWith('image/')) throw new Error('CDSE 后端没有返回 SAR 图像');
        } catch (error) {
            sentinel1Status = 'error';
            sentinel1Error = error instanceof Error ? error.message : 'SAR 图层预检失败';
            return;
        }
        sentinel1Layer = new L.TileLayer(sentinel1ApiUrl().replace('{date}', sentinel1Date), {
            minZoom: 0, maxNativeZoom: 12, maxZoom: 19, opacity: 0.7, tileSize: 256,
            layerBucketId: layerOrder.AIRSPACES, noWrap: true, continuousWorld: true,
            bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
        });
        sentinel1Layer.on('tileerror', () => { sentinel1Status = 'error'; sentinel1Error = 'SAR 图层未返回瓦片。请检查观测日期和 CDSE 后端。'; });
        sentinel1Layer.addTo(map);
        sentinel1Visible = true;
        sentinel1Status = 'ready';
    };
    const toggleSentinel1Layer = () => { if (sentinel1Visible) { removeSentinel1Layer(); return; } loadSentinel1Layer(); };
    const refreshSentinel1Layer = () => { loadSentinel1Layer(); };
    const coherenceTileUrl = (z: number, x: number, y: number) => coherenceApiUrl.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y));
    const loadCoherenceLayer = async () => {
        removeCoherenceLayer();
        coherenceStatus = 'loading'; coherenceError = '';
        try {
            const response = await fetch(coherenceTileUrl(10, 759, 428));
            if (!response.ok) throw new Error(`相干性服务返回 ${response.status}`);
            if (!response.headers.get('content-type')?.startsWith('image/')) throw new Error('相干性服务没有返回图像');
        } catch (error) {
            coherenceStatus = 'error';
            coherenceError = error instanceof Error ? error.message : '相干性图层预检失败';
            return;
        }
        coherenceLayer = new L.TileLayer(coherenceApiUrl, {
            minZoom: 0, maxNativeZoom: 12, maxZoom: 19, opacity: 0.75, tileSize: 256,
            layerBucketId: layerOrder.AIRSPACES, noWrap: true, continuousWorld: true,
            bounds: [[27.1462136287, 86.0142622641], [28.8179722136, 87.1975460433]],
        });
        coherenceLayer.on('tileerror', () => { coherenceStatus = 'error'; coherenceError = '相干性瓦片未返回。请检查本机 TiTiler 服务。'; });
        coherenceLayer.addTo(map);
        coherenceVisible = true;
        coherenceStatus = 'ready';
    };
    const toggleCoherenceLayer = () => { if (coherenceVisible) { removeCoherenceLayer(); return; } loadCoherenceLayer(); };
    const refreshCoherenceLayer = () => { loadCoherenceLayer(); };

    const loadCatalog = async () => {
        catalogController?.abort();
        const controller = new AbortController();
        catalogController = controller;
        const timeout = setTimeout(() => controller.abort(), 20000);
        catalogStatus = 'loading'; catalogError = '';
        try {
            const response = await fetch(capabilitiesUrl, { signal: controller.signal });
            if (!response.ok) throw new Error(`NASA GIBS: ${response.status}`);
            const parsed = parseCapabilities(await response.text());
            if (catalogController !== controller) return;
            if (!parsed.length) throw new Error('NASA GIBS 未返回可用图层');
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
            if (catalogController !== controller) return;
            catalogStatus = 'error';
            catalogError = controller.signal.aborted ? 'NASA GIBS 目录请求超时，请重试。' : error instanceof Error ? error.message : 'NASA GIBS catalog is unavailable.';
        } finally {
            clearTimeout(timeout);
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
    onDestroy(() => { catalogController?.abort(); testController?.abort(); earthquakeController?.abort(); fireController?.abort(); removeLayer(); removeBaselineLayer(); removeEarthquakes(); removeFires(); removeCdseLayer(); removeSentinel1Layer(); removeCoherenceLayer(); });
</script>

<style lang="less">
    h3 { font-size: 15px; margin: 18px 0 4px; color: #e8edf0; }
    .event-list { display: grid; gap: 4px; max-height: 150px; overflow-y: auto; margin-top: 8px; }
    .event-list button { text-align: left; }
    .connection-settings { margin-top: 12px; }
    .cdse-direct { border: 1px solid #304047; border-left: 3px solid #8bc34a; margin: 12px 0; padding: 8px 10px; }
    .cdse-direct summary { display:flex; justify-content:space-between; color:#d7e1e3; font-size:12px; }
    .cdse-direct summary strong { color:#8bc34a; font-size:10px; }
    .cdse-direct p { color:#a8babf; font-size:11px; line-height:1.4; }
    .cdse-sar { border-top: 1px solid #304047; margin-top: 12px; padding-top: 10px; }
    .cdse-sar > span { color:#d7e1e3; font-size:12px; }
    .cdse-sar > strong { color:#8bc34a; float:right; font-size:10px; }
    .coherence-layer { border-top: 1px solid #304047; margin-top: 12px; padding-top: 10px; }
    .coherence-layer > span { color:#d7e1e3; font-size:12px; }
    .coherence-layer > strong { color:#8bc34a; float:right; font-size:10px; }
    .coherence-layer > small { display:block; color:#71858a; font-size:10px; line-height:1.4; margin-top:5px; }
    .plugin__content .integration-status { display: flex; flex-wrap: wrap; gap: 8px; }
    .plugin__content .integration-status > span { flex: 1; font-size: 12px; }
    .plugin__content .integration-status > small { flex-basis: 100%; font-size: 11px; }
    .plugin__content .hazard-card { min-height: 54px; text-align: left; padding: 9px; }
    .plugin__content .hazard-card small { margin-top: 5px; font-size: 10px; }
    .plugin__content button { min-height: 32px; font-size: 11px; }
    .plugin__content { padding: 12px 14px 24px; color: #e8edf0; background: #11191e; min-height: 100%; } .intro { color: #a8babf; font-size: 12px; line-height: 1.5; margin: 12px 0 18px; } .hazard-overview { border:1px solid #304047; border-left:3px solid #52b6c7; margin:0 0 14px; padding:8px 10px; } .hazard-overview summary { display:flex; align-items:center; justify-content:space-between; color:#d7e1e3; font-size:11px; letter-spacing:1px; } .hazard-overview summary strong,.hazard-card strong,.integration-status strong { color:#52b6c7; font-size:10px; } .hazard-overview__content > p { color:#a8babf; font-size:11px; line-height:1.45; margin:8px 0; } .hazard-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:6px; } .hazard-card { border:1px solid #304047; padding:7px; min-height:76px; } .hazard-card span,.integration-status span { display:block; color:#d7e1e3; font-size:10px; line-height:1.25; } .hazard-card strong { display:block; margin:4px 0; } .hazard-card small,.integration-status small { display:block; color:#71858a; font-size:9px; line-height:1.3; } .hazard-card button { margin-top:6px; padding:4px 6px; } .integration-status { display:grid; grid-template-columns:minmax(0,1fr) auto auto; column-gap:8px; border-top:1px solid #304047; margin-top:8px; padding-top:8px; } .integration-status small { grid-column:1 / -1; margin-top:3px; } .earthquake-status button,.fire-status button { padding:4px 6px; } .fire-api-field { margin-top:10px; } .source-feedback { color:#d7e1e3; font-size:10px; line-height:1.4; border:1px solid #304047; margin-top:8px; padding:7px; }
    .field-label { display: block; color: #91a5aa; font-size: 10px; letter-spacing: 1px; margin: 15px 0 6px; } input, select { box-sizing: border-box; width: 100%; background: #172126; border: 1px solid #33464d; color: #e8edf0; padding: 8px; } input[type='range'] { accent-color: #52b6c7; padding: 0; } select { font-size: 11px; } .monitor { border:1px solid #304047; border-left:3px solid #f2ad42; margin-top:14px; padding:8px 10px; } .monitor summary { display:flex; align-items:center; justify-content:space-between; color:#d7e1e3; font-size:11px; letter-spacing:1px; } .monitor summary strong { color:#f2ad42; font-size:10px; } .monitor p,.monitor small { display:block; color:#a8babf; font-size:11px; line-height:1.45; margin:8px 0; } .monitor small { color:#71858a; font-size:10px; } .monitor__actions { display:flex; gap:6px; margin-top:12px; } .compare-toggle { display:block; color:#d7e1e3; font-size:11px; margin-top:12px; } .compare-toggle input { width:auto; vertical-align:middle; } .theme-group { border-top: 1px solid #304047; margin-top: 12px; padding-top: 8px; } summary { color:#a8babf; cursor:pointer; font-size:11px; } .theme-group small { display:block; color:#71858a; font-size:10px; margin-top:8px; line-height:1.4; } .quick-filters { display:flex; flex-wrap:wrap; align-items:center; gap:5px; margin-top:8px; } .quick-filters button { padding:5px 6px; } .quick-filters button.active { background:#52b6c7; border-color:#52b6c7; color:#101719; } .catalog-actions { display:flex; align-items:center; justify-content:space-between; margin-top:6px; } .result-count { color: #71858a; font-size: 10px; } button:disabled { cursor: wait; opacity: 0.55; }
    .catalog-status, .tile-status { color: #f2ad42; font-size: 10px; letter-spacing: 1px; } .catalog-status { display: flex; align-items: center; justify-content: space-between; border: 1px solid #33464d; padding: 7px; } .catalog-status.ready, .tile-status.ready { color: #51c7a3; } .catalog-status i, .tile-status i { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: currentColor; margin-right: 5px; } button { background: #172126; border: 1px solid #33464d; color: #d7e1e3; padding: 7px 9px; font-size: 10px; cursor: pointer; }
    .control-row { margin-top: 16px; } .action-row { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #304047; padding-top: 14px; } .map-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:6px; } .legend-panel { border:1px solid #304047; margin-top:12px; padding:7px; } .legend-panel summary { color:#a8babf; } .legend-panel img { display:block; max-width:100%; margin-top:8px; background:#fff; } .legend-note { display:block; color:#71858a; font-size:10px; margin-top:12px; } .error-message { color:#f2ad42; font-size:11px; border:1px solid #7b5c2c; padding:8px; margin-top:10px; overflow-wrap:anywhere; } .details { display:grid; gap:4px; margin-top:18px; color:#71858a; font-size:10px; } footer { color:#869ba0; font-size:10px; border-top:1px solid #304047; margin-top:18px; padding-top:12px; } a { color:#52b6c7; }
</style>
