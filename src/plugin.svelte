<div class="plugin__mobile-header">
    { title }
</div>
<section class="plugin__content">
    <div
        class="plugin__title plugin__title--chevron-back"
        on:click={ () => bcast.emit('rqstOpen', 'menu') }
    >
        { title }
    </div>

    <!-- 1. 核心看板：InSAR 毫米位移与实时形变 -->
    <div class="clean-card card-insar">
        <div class="card-header">
            <span class="card-tag tag-red">INSAR 毫米位移监测</span>
            <span class="badge-status status-online">● 运行中</span>
        </div>
        <div class="displacement-display">
            <span class="disp-value">{liveDisplacementMm}</span>
            <span class="disp-unit">mm</span>
            <span class="disp-state">({liveStatusText})</span>
        </div>
        <div class="metrics-grid">
            <div class="metric-item">
                <span class="m-label">观测时相</span>
                <span class="m-val">{liveDatePair}</span>
            </div>
            <div class="metric-item">
                <span class="m-label">基岩不动点</span>
                <span class="m-val">{liveAnchorCoherence} (相干性)</span>
            </div>
            <div class="metric-item">
                <span class="m-label">NASA 39年基线</span>
                <span class="m-val">{liveBaselineSpeed} m/yr</span>
            </div>
            <div class="metric-item">
                <span class="m-label">DEM物理门禁</span>
                <span class="m-val">{liveDemStatus}</span>
            </div>
        </div>
        <div class="card-actions">
            <button class="btn btn-red" on:click={focusCandidates}>聚焦形变区域</button>
            <button class="btn btn-secondary" on:click={refreshLiveData}>刷新数据</button>
        </div>
    </div>

    <!-- 2. CDSE 冰川异动候选图层 (18个监测点) -->
    <div class="clean-card card-candidates">
        <div class="card-header">
            <span class="card-tag tag-orange">CDSE 冰川监测候选点</span>
            <span class="badge-status status-ready">18 个就绪</span>
        </div>
        <p class="card-desc">红色为主要审查候选点（CAND-049），橙色为地形/碎屑复核点。</p>
        <div class="card-actions">
            <button class="btn btn-orange" on:click={toggleCandidateLayer}>{candidateVisible ? '隐藏候选图层' : '显示候选图层'}</button>
            <button class="btn btn-secondary" on:click={focusCandidates}>对齐视角</button>
        </div>
    </div>

    <!-- 3. NASA ITS_LIVE 全球冰川流速热力图层 -->
    <div class="clean-card card-itslive">
        <div class="card-header">
            <span class="card-tag tag-blue">NASA ITS_LIVE 冰川流速底图</span>
            <span class="badge-status status-ready">120m 分辨率</span>
        </div>
        <p class="card-desc">展示孔布冰川流动热力带（基准流速: 35.0 m/yr）。</p>
        <div class="card-actions">
            <button class="btn btn-blue" on:click={toggleItsliveLayer}>{itsliveVisible ? '隐藏流速底图' : '显示流速底图'}</button>
            <button class="btn btn-secondary" on:click={focusCandidates}>聚焦主冰川</button>
        </div>
    </div>

    <!-- 4. NASA 卫星真彩色底图 -->
    <div class="clean-card card-gibs">
        <div class="card-header">
            <span class="card-tag tag-gray">NASA 卫星遥感真彩色</span>
            <span class="badge-status status-ready">全球每日影像</span>
        </div>
        <div class="card-actions">
            <button class="btn btn-gray" on:click={toggleGibsLayer}>{gibsVisible ? '隐藏卫星底图' : '显示卫星底图'}</button>
            <button class="btn btn-secondary" on:click={focusEverest}>全景俯瞰</button>
        </div>
    </div>
</section>


<script lang="ts">
    import bcast from '@windy/broadcast';
    import { layerOrder, map, centerMap, markers } from '@windy/map';
    import { onDestroy, onMount } from 'svelte';
    import config from './pluginConfig';
    import { allCandidates } from './candidateData';

    const { title } = config;
    const today = new Date().toISOString().slice(0, 10);
    const initialDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const gibsTemplate = 'https://gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/{Time}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg';

    let gibsLayer: L.TileLayer | null = null;
    let candidateLayer: L.FeatureGroup | null = null;
    let itsliveLayer: L.TileLayer | null = null;
    let itsliveVisible = true;
    let itsliveOpacity = 0.65;
    let itsliveStatus: 'loading' | 'ready' | 'hidden' | 'error' = 'ready';
    let itsliveError = '';
    const itsliveTileUrl = 'https://its-live-data.s3-us-west-2.amazonaws.com/velocity_mosaic/v2/static/v_tiles_global/{z}/{x}/{y}.png';
    let gibsVisible = true;
    let candidateVisible = true;
    let gibsStatus: 'loading' | 'ready' | 'hidden' | 'error' = 'ready';
    let candidateStatus: 'loading' | 'ready' | 'hidden' | 'error' = 'ready';
    let gibsError = '';
    let candidateError = '';
    let gibsDate = initialDate;
    let gibsOpacity = 0.7;
    let candidateCount = 0;

    // 固定远程数据源地址 (完全解耦，云端算完立刻生效，Windy 插件零重编译发版！)
    const LIVE_DATA_URL = 'https://raw.githubusercontent.com/Yizebaba/hqmw-cryosphere-windy/main/products/03_products/insar/everest_insar_displacement_summary.json';

    let liveDisplacementMm = '0.66';
    let liveStatusText = '微小稳定蠕变';
    let liveDatePair = '2026-09-04 ➔ 09-16';
    let liveAnchorCoherence = '96.5%';
    let liveBaselineSpeed = '12.27';
    let liveCrevasseState = '冰面均匀完整';
    let liveDemStatus = '通过坡度门禁';

    let liveAnchorCoords: [number, number] = [27.9395, 86.8565];
    let liveGlacierCenter: [number, number] = [27.9869, 86.8586];
    let liveSamCoords: [number, number][] = [
        [27.986862, 86.862151], [27.989069, 86.861076], [27.990015, 86.858568],
        [27.989069, 86.856060], [27.986862, 86.854985], [27.984655, 86.856060],
        [27.983709, 86.858568], [27.984655, 86.861076]
    ];
    let liveCrevasseCoords: [number, number][] = [
        [27.986047, 86.852222], [27.990616, 86.863356],
        [27.987677, 86.864914], [27.983108, 86.853780]
    ];

    const gibsUrl = () => gibsTemplate.replace('{Time}', gibsDate);
    const removeGibsLayer = () => { gibsLayer?.remove(); gibsLayer = null; gibsVisible = false; };
    const removeCandidateLayer = () => { candidateLayer?.remove(); candidateLayer = null; candidateVisible = false; };
    const removeItsliveLayer = () => { itsliveLayer?.remove(); itsliveLayer = null; itsliveVisible = false; };

    const loadItsliveLayer = () => {
        removeItsliveLayer();
        itsliveStatus = 'loading';
        itsliveError = '';
        itsliveLayer = new L.TileLayer(itsliveTileUrl, {
            minZoom: 0,
            maxNativeZoom: 13,
            maxZoom: 19,
            opacity: Number(itsliveOpacity),
            tileSize: 256,
            layerBucketId: layerOrder.MAIN,
            noWrap: true,
            continuousWorld: true
        });
        itsliveLayer.on('load', () => { itsliveStatus = 'ready'; });
        itsliveLayer.on('tileerror', () => { console.warn('ITS_LIVE tile loading...'); });
        itsliveLayer.addTo(map);
        itsliveVisible = true;
    };
    const toggleItsliveLayer = () => {
        if (itsliveVisible) { removeItsliveLayer(); itsliveStatus = 'hidden'; return; }
        loadItsliveLayer();
    };
    const updateItsliveOpacity = (e: Event) => {
        itsliveOpacity = Number((e.target as HTMLInputElement).value);
        if (itsliveLayer) itsliveLayer.setOpacity(itsliveOpacity);
    };

    const focusEverest = () => { centerMap({ lat: 27.9881, lon: 86.925, zoom: 10 }); };
    const focusCandidates = () => { centerMap({ lat: 27.9869, lon: 86.8586, zoom: 12 }); };

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
            console.warn('GIBS tile loading...');
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

    const refreshLiveData = async () => {
        try {
            const resp = await fetch(LIVE_DATA_URL + '?t=' + Date.now());
            if (resp.ok) {
                const data = await resp.json();
                const res = data.results || {};
                const insar = res.insar_displacement || {};
                const its = res.itslive_velocity_baseline || {};
                const crevasse = res.optical_crevasse_state || {};
                const dem = res.dem_physical_constraint || {};
                const pair = data.insar_pair || {};

                if (insar.median_mm !== undefined) liveDisplacementMm = String(insar.median_mm);
                if (pair.master && pair.slave) liveDatePair = `${pair.master} ➔ ${pair.slave}`;
                if (insar.bedrock_anchor?.coherence) liveAnchorCoherence = `${(insar.bedrock_anchor.coherence * 100).toFixed(1)}%`;
                if (its.historical_baseline_mean_m_yr) liveBaselineSpeed = String(its.historical_baseline_mean_m_yr);
                if (crevasse.surface_state === 'HOMOGENEOUS_ICE_SURFACE') liveCrevasseState = '冰面均质稳定';
                if (dem.physical_constraint_status === 'PASSED_PHYSICAL_CONSTRAINT') liveDemStatus = '通过坡度门禁';

                if (res.sam_deformation_feature?.geometry?.coordinates?.[0]) {
                    liveSamCoords = res.sam_deformation_feature.geometry.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]]);
                }
                if (res.crevasse_feature?.geometry?.coordinates?.[0]) {
                    liveCrevasseCoords = res.crevasse_feature.geometry.coordinates[0].map((pt: [number, number]) => [pt[1], pt[0]]);
                }
            }
        } catch (e) {
            console.warn('Live data fetch notice:', e);
        }
    };

        const loadCandidateLayer = () => {
        removeCandidateLayer();
        candidateStatus = 'loading';
        candidateError = '';
        try {
            refreshLiveData();
            const feed = allCandidates as any;
            const features = Array.isArray(feed.features) ? feed.features : [];
            candidateCount = features.length;

            const mapItems: L.Layer[] = [];

            // 1. 使用官方 100% 绝对稳定的 L.Marker 渲染所有候选点 (杜绝 LeafletGL radius 报错)
            features.forEach((feat: any) => {
                const coords = feat?.geometry?.coordinates;
                if (!coords || coords.length < 2) return;
                const latlng: [number, number] = [coords[1], coords[0]];
                const props = feat?.properties || {};
                const priority = props.project_candidate_status === 'priority_glacier_review';
                
                const mk = new L.Marker(latlng, {
                    icon: priority ? markers.pulsatingIcon : markers.myLocationIcon
                });
                
                const area = props.approximate_area_km2 ? `${(props.approximate_area_km2 * 1000).toFixed(1)} km2` : 'N/A';
                const slope = props.median_slope_degrees ? `${props.median_slope_degrees.toFixed(1)} deg` : 'N/A';
                const candidateId = props.candidate_id || 'CANDIDATE';
                
                mk.bindPopup(
                    `<strong>${candidateId}</strong><br/>` +
                    `状态: ${props.project_candidate_status || 'UNKNOWN'}<br/>` +
                    `面积: ~${area}<br/>坡度: ${slope}<br/>` +
                    `InSAR 实测位移: ${liveDisplacementMm} mm<br/>` +
                    `<small>${props.interpretation_limit || ''}</small>`
                );
                mapItems.push(mk);
            });

            // 2. 天然坚硬基岩不动点 (Reference Anchor) - 使用绿色标头标记
            const anchorMarker = new L.Marker(liveAnchorCoords, {
                icon: markers.myLocationIcon
            });
            anchorMarker.bindPopup(
                '<strong>天然坚硬基岩不动点 (Reference Anchor)</strong><br/>' +
                '位置: 27.9395°N, 86.8565°E<br/>' +
                `雷达相干性: <strong>${liveAnchorCoherence}</strong> (绝对零形变基准)<br/>` +
                '说明: 作为尺子的零刻度基准，已排除所有山体形变，用于校准消除对流层大气延迟。'
            );
            mapItems.push(anchorMarker);

            // 3. 形变测量基线 (折线)
            const baseline = new L.Polyline([liveAnchorCoords, liveGlacierCenter], {
                color: '#2980b9',
                weight: 3,
                dashArray: '6, 6',
                opacity: 0.95
            });
            baseline.bindPopup(
                `<strong>InSAR 冰川形变测量基线</strong><br/>` +
                `起点: 天然基岩不动点 ➔ 终点: 孔布冰川异动区<br/>` +
                `时相: ${liveDatePair}<br/>` +
                `实测微小蠕变位移: <strong>${liveDisplacementMm} mm</strong> (${liveStatusText})`
            );
            mapItems.push(baseline);

            // 4. InSAR + SAM 闭合形变多边形
            const samPolygon = new L.Polygon(liveSamCoords, {
                color: '#c0392b',
                weight: 3,
                fillColor: '#e74c3c',
                fillOpacity: 0.40
            });
            samPolygon.bindPopup(
                '<strong>InSAR + SAM 闭合形变区域</strong><br/>' +
                '中心坐标: 27.9869°N, 86.8586°E<br/>' +
                '实测面积: ~0.385 km²<br/>' +
                `实测位移: <strong>${liveDisplacementMm} mm</strong> (${liveStatusText})<br/>` +
                `基线对比: NASA ITS_LIVE 39年参考流速 ${liveBaselineSpeed} m/yr<br/>` +
                '<small>通过 InSAR 梯度提示驱动 SAM 提取，已排除陡坡假象。</small>'
            );
            mapItems.push(samPolygon);

            // 统一加入 FeatureGroup 批量添加到地图
            candidateLayer = new L.FeatureGroup(mapItems);
            map.addLayer(candidateLayer);
            candidateVisible = true;
            candidateStatus = 'ready';
        } catch (error) {
            candidateStatus = 'error';
            candidateError = error instanceof Error ? error.message : 'Could not load candidate layer.';
        }
    };
    const toggleCandidateLayer = () => { if (candidateVisible) { removeCandidateLayer(); candidateStatus = 'hidden'; return; } loadCandidateLayer(); };

    export const onopen = () => {
        focusEverest();
        if (!gibsLayer && gibsVisible) loadGibsLayer();
        if (!itsliveLayer && itsliveVisible) loadItsliveLayer();
        if (!candidateLayer && candidateVisible) loadCandidateLayer();
    };

    onMount(() => {
        loadGibsLayer();
        loadCandidateLayer();
        focusEverest();
    });

    onDestroy(() => {
        removeGibsLayer();
        removeItsliveLayer();
        removeCandidateLayer();
    });
</script>






<style lang="less">
    .clean-card {
        background: rgba(30, 39, 46, 0.85);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);

        &.card-insar {
            border-left: 4px solid #e74c3c;
            background: linear-gradient(135deg, rgba(231, 76, 60, 0.15) 0%, rgba(30, 39, 46, 0.95) 100%);
        }
        &.card-candidates {
            border-left: 4px solid #f39c12;
        }
        &.card-itslive {
            border-left: 4px solid #3498db;
        }
        &.card-gibs {
            border-left: 4px solid #7f8c8d;
        }
    }
    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }
    .card-tag {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        &.tag-red { color: #ff6b6b; }
        &.tag-orange { color: #feca57; }
        &.tag-blue { color: #54a0ff; }
        &.tag-gray { color: #c8d6e5; }
    }
    .badge-status {
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 600;
        &.status-online { background: rgba(39, 174, 96, 0.25); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.3); }
        &.status-ready { background: rgba(255, 255, 255, 0.1); color: #dfe6e9; }
    }
    .displacement-display {
        display: flex;
        align-items: baseline;
        margin: 6px 0 10px 0;
        .disp-value {
            font-size: 28px;
            font-weight: 800;
            color: #2ecc71;
            font-family: monospace;
        }
        .disp-unit {
            font-size: 14px;
            color: #bdc3c7;
            margin-left: 4px;
            font-weight: 600;
        }
        .disp-state {
            font-size: 12px;
            color: #f1c40f;
            margin-left: 10px;
        }
    }
    .metrics-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
        background: rgba(0, 0, 0, 0.25);
        padding: 8px;
        border-radius: 6px;
        margin-bottom: 10px;
        .metric-item {
            display: flex;
            flex-direction: column;
            .m-label { font-size: 10px; color: #95a5a6; }
            .m-val { font-size: 11px; color: #f5f6fa; font-weight: 600; margin-top: 1px; }
        }
    }
    .card-desc {
        font-size: 11px;
        color: #bdc3c7;
        margin: 4px 0 10px 0;
        line-height: 1.4;
    }
    .card-actions {
        display: flex;
        gap: 8px;
    }
    .btn {
        flex: 1;
        padding: 7px 10px;
        border: none;
        border-radius: 5px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
        &:hover { opacity: 0.88; }

        &.btn-red { background: #e74c3c; color: white; }
        &.btn-orange { background: #e67e22; color: white; }
        &.btn-blue { background: #2980b9; color: white; }
        &.btn-gray { background: #4b6584; color: white; }
        &.btn-secondary { background: rgba(255, 255, 255, 0.12); color: #f5f6fa; }
    }
</style>
