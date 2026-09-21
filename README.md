# HQMW Cryosphere - Windy Plugin

[English](#english) | [中文说明](#chinese)

---

<a name="english"></a>
## English Overview

**HQMW Cryosphere** is a specialized Windy.com map plugin designed for high-mountain natural environment observation and glacier anomaly screening in the Mount Everest region. It integrates **NASA EOSDIS GIBS** satellite layers with automated multi-temporal SAR (Sentinel-1 GRD / InSAR coherence) and optical (Sentinel-2) screening pipelines from **Copernicus Data Space Ecosystem (CDSE)**.

### Pipeline Architecture & Methodology

The backend screening workflow in Copernicus Data Space follows a multi-stage triage pipeline:
1. **01_catalog**: AOI specification and multi-temporal Sentinel-1 / Sentinel-2 STAC metadata query and acquisition batch grouping.
2. **03_products**: 
   - Multi-temporal Sentinel-1 SAR backscatter difference calculation (Orbit 12 ascending track).
   - InSAR pair processing and interferometric coherence map generation (Burst 23790 IW1/VV).
   - High-resolution cloud-free Sentinel-2 composite generation (2026-08-01 to 2026-09-20).
   - Joint candidate extraction coupling backscatter drop and loss of coherence.
3. **04_validation**:
   - **Automated Optical Triage**: Multispectral Scene Classification (SCL) validation distinguishing clean ice/snow from bare rock/moraine and cloud gaps.
   - **Copernicus 30m DEM Triage**: Slope, elevation, and terrain artifact screening (filtering false anomalies from steep rock faces >= 45°).
4. **05_candidate_status**:
   - Classification into `priority_glacier_review`, `terrain_review_required`, and `high_terrain_artifact_risk`.
   - Direct export to standard GeoJSON and CSV for Windy plugin rendering.

### Generated Pipeline Visualizations (Period: 2026-09-04 to 2026-09-16)

#### 1. Everest Project Candidate Status Map
> Comprehensive screening of candidate anomalies across the Everest AOI, categorizing priority glacier review points and steep terrain review regions.

![Everest Project Candidate Status Map](docs/images/everest_project_candidate_status_map_20260904_20260916.png)

#### 2. Joint GRD + InSAR Candidate Overlay
> Sentinel-1 multi-temporal backscatter changes coupled with InSAR coherence drop indicators.

![GRD InSAR Joint Overlay](docs/images/everest_grd_insar_joint_candidate_overlay_20260904_20260916.png)

#### 3. Priority Glacier Candidate Review Map
> Optical triage (Sentinel-2 clear composite) validating clean ice/snow versus rock/moraine spectral signatures.

![Priority Glacier Candidate Review Map](docs/images/everest_priority_glacier_candidate_review_map.png)

#### 4. Sentinel-2 Cloud-Free Base Composite (2026-08-01 ~ 2026-09-20)
> Cloud-optimized, high-resolution optical surface reference aligned to candidate footprints.

![Sentinel-2 Clear Composite](docs/images/everest_s2_clear_composite_20260801_20260920.png)

### Complete Pipeline Products Synced
The repository contains the complete verified pipeline deliverables under [`products/`](./products):
- `products/03_products/sar_orbit12/`: SAR difference rasters, summary tables, and candidate maps.
- `products/03_products/grd_insar_overlay/`: Combined radar + InSAR coherence overlay maps and metadata.
- `products/03_products/optical_composite/`: Sentinel-2 reference composite.
- `products/04_validation/automated_optical_triage/`: Automated optical triage results (`clean_ice_snow`, `needs_debris_review`).
- `products/04_validation/priority_candidate_dem_triage/`: Candidates enriched with DEM elevation & slope metrics.
- `products/05_candidate_status/`: Final GeoJSON and CSV status datasets.

### Safety & Interpretation Boundary
This plugin is an imagery viewer and experimental screening interface. It does **not** confirm disasters, issue CAP messages, trigger evacuations, or declare route closures. All candidates require verified multi-source confirmation.

---

<a name="chinese"></a>
## 中文说明

**HQMW Cryosphere（珠峰冰冻圈环境监测系统）** 是为 [Windy.com](https://www.windy.com) 定制开发的高山冰冻圈卫星遥感与冰川异常检测插件。本插件将 **NASA EOSDIS GIBS** 遥感底图与来自 **欧空局 Copernicus Data Space (CDSE)** 的 Sentinel-1 合成孔径雷达（GRD/InSAR 相干性）及 Sentinel-2 多光谱自动化初筛管线成果完整融合。

### CDSE 完整处理流程与架构体系

云端处理管线严密涵盖以下各个核心处理阶段：
1. **01 数据编目 (01_catalog)**：制定珠峰监测核心区域（AOI），通过 STAC 接口检索近 90~365 天内升轨 12 轨的 Sentinel-1 SAR 数据集与 Sentinel-2 低云光学数据集。
2. **03 遥感产品计算 (03_products)**：
   - Sentinel-1 升轨（Orbit 12）多时相后向散射差值计算（VV/VH极化强度变动）。
   - InSAR 干涉相干性计算（针对珠峰核心 Burst 23790 进行干涉配准与失相干提取）。
   - Sentinel-2 无云高清合成图生成（2026-08-01 至 2026-09-20 多景像素级去云合成）。
   - 雷达强度变化与 InSAR 失相干双指标联合提取初筛网格。
3. **04 多源数据分流验证 (04_validation)**：
   - **多光谱光学分流 (Automated Optical Triage)**：根据 SCL 场景分类与波段反射率，自动核算每个候选区域内的积雪/纯冰占比、裸岩碎石占比及云间隙率，将假阳性剔除。
   - **Copernicus 30m 高精 DEM 地形分流**：计算每个候选区域的高程、中位数坡度以及陡坡占比（>=45°），标记陡峭岩壁造成的人工假象风险。
4. **05 最终状态研判 (05_candidate_status)**：
   - 输出标准评级结果（`priority_glacier_review` 重点冰川审查、`terrain_review_required` 地形复核），并生成适用于 Windy 的标准化 GeoJSON 成果。

### 核心成果图件展示（周期：2026-09-04 至 2026-09-16）

#### 1. 珠峰候选异常状态分布图 (Candidate Status Map)
> 全面展示珠峰区域通过雷达后向散射与相干性变动筛选出的 18 个评估候选点，并依据地形坡度与光谱特征进行分级管控。

![珠峰候选异常状态分布图](docs/images/everest_project_candidate_status_map_20260904_20260916.png)

#### 2. Sentinel-1 GRD 强度与 InSAR 相干性联合叠加图
> 结合了 Sentinel-1 升降轨后向散射差值与 InSAR 干涉失相干区域的多时相联合变化掩模。

![GRD 与 InSAR 联合叠加图](docs/images/everest_grd_insar_joint_candidate_overlay_20260904_20260916.png)

#### 3. 优先级冰川审查候选点分布图 (Priority Review Map)
> 结合哨兵2号多光谱（SCL分类与积雪/裸岩占比）对候选点进行的精细分流核验。

![优先级冰川审查分布图](docs/images/everest_priority_glacier_candidate_review_map.png)

#### 4. 珠峰区域 Sentinel-2 无云清晰合成底图 (2026-08-01 ~ 2026-09-20)
> 覆盖核心观测区的高清真彩色光学背景参考影像，与雷达异常检测候选网格完全对齐。

![Sentinel-2 无云合成图](docs/images/everest_s2_clear_composite_20260801_20260920.png)

### 已完整同步的流程产出包 (`products/`)
所有在 CDSE 生成的完整中间层与验证成果现已全量存放在仓库 [`products/`](./products) 目录：
- `products/03_products/`：包含 Orbit 12 SAR 变化图、InSAR 叠加图、光学合成底图及元数据。
- `products/04_validation/`：包含光学自动化初筛表格、纯冰雪分类 GeoJSON、DEM 高程与坡度分析结果。
- `products/05_candidate_status/`：包含 Windy 插件消费的完整 GeoJSON 与 CSV 数据。

### 安全与业务边界
本插件仅作为遥感影像观测与实验性初筛的可视化工具。任何检测到的候选点并不等同于已发生的冰崩、雪崩或灾害事件，不得直接用于触发 CAP 应急报文发布、路线关闭或人员疏散。