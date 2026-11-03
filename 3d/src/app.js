/* cGENIE in 3D: the cGENIE.cookie master-step cycle, module by module and routine by routine,
   on a 3D globe with the worjh2 grid (36 × 36 × 16).
   Inputs:  window.CGENIE_INPUTS  (data/cgenie_inputs.js, made by build_data.py from the worjh2 files)
   Text:    window.CG_V1          (step cards and module tables of the 2D walkthrough, EN + ZH)
   cGENIE has not been run for this page, so there are no model-state fields (T, S, currents,
   tracers, pCO2). Everything coloured on the globe is a boundary condition the model reads,
   or computed here from one (insolation from the orbit, runoff routes, remineralisation profiles).
   The animation shows which routine runs, in which order, on which cells and levels. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

window.__cg3dStarted = true;
THREE.ColorManagement.enabled = false;

const IN = window.CGENIE_INPUTS, V1 = window.CG_V1;
const D2R = Math.PI / 180;
const $ = (s, el = document) => el.querySelector(s);
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const wrap360 = x => ((x % 360) + 360) % 360;
const REDUCED = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ================================================================ language */
const L = (en, zh) => ({ en, zh });
let LANG = (() => {
  if (window.CG3D_LANG === 'en' || window.CG3D_LANG === 'zh') return window.CG3D_LANG;   // set by the per-language builds
  try { const s = localStorage.getItem('cg3d-lang'); if (s === 'en' || s === 'zh') return s; } catch (e) { /* storage blocked */ }
  return /^zh/i.test(navigator.language || '') ? 'zh' : 'en';
})();
const tx = o => o == null ? '' : (typeof o === 'object' ? (o[LANG] != null ? o[LANG] : o.en) : String(o));
const fmt = (s, o) => tx(s).replace(/\{(\w+)\}/g, (m, k) => (o[k] != null ? o[k] : m));

const U = {
  sub: L('cGENIE.cookie · worjh2 36 × 36 × 16 · CBSR base config · one biogeochemistry cycle and the year end, routine by routine',
         'cGENIE.cookie · worjh2 36 × 36 × 16 · CBSR 基础配置 · 一轮生物地球化学周期和年末，逐个子程序'),
  layers: L('Layers', '图层'), home: L('Reset view', '复位视角'), spin: L('Rotate', '自转'), had: L('HadCM3 3D ↗', 'HadCM3 三维 ↗'),
  play: L('▶ Play', '▶ 播放'), pause: L('❚❚ Pause', '❚❚ 暂停'), prev: L('◀', '◀'), next: L('▶▶', '▶▶'),
  prevT: L('Previous routine', '上一个子程序'), nextT: L('Next routine', '下一个子程序'),
  speed: L('Speed', '速度'), detail: L('All routines on every step', '每一步都展开全部子程序'),
  loading: L('Loading cGENIE inputs…', '正在载入 cGENIE 输入场…'),
  nodata: L('The input file data/cgenie_inputs.js did not load. Keep it next to this page (run 3d/build_data.py to make it).', '输入文件 data/cgenie_inputs.js 没有载入。请把它放在页面旁边（用 3d/build_data.py 生成）。'),
  nogl: L('This page needs WebGL, which is not available in this browser.', '本页需要 WebGL，但当前浏览器不支持。'),
  start: L('start', '启动'), end: L('end', '结束'), loopT: L('11 … 479', '11 … 479'),
  startup: L('Start-up', '启动'), runEnd: L('End of run', '运行结束'), yearLoop: L('The rest of the year', '这一年的其余步'),
  masterH: L('master step k', '主时间步 k'), yearEnd: L('year end', '年末'),
  kStep: L('master step k = {k}', '主时间步 k = {k}'), dayOf: L('day {a} → {b}', '第 {a} → {b} 天'),
  inView: L('In the 3D view', '3D 视图中'), params: L('Parameters', '参数'),
  procs: L('{m}: routines in call order', '{m}：按调用顺序的子程序'), card: L('From the 2D walkthrough', '2D 版步骤说明'),
  modTab: L('Module parameters (2D walkthrough)', '模块参数（2D 版）'),
  cIn: L('In', '输入'), cCalc: L('Computed', '计算'), cOut: L('Out', '输出'),
  rel: L('For the CO₂ question', '对 CO₂ 问题'), had2: L('Compared with HadCM3', '与 HadCM3 相比'),
  zero: L('zero in this config', '本配置中为零'), all: L('all routines', '全部子程序'),
  surfH: L('Surface colour', '地表着色'), atmH: L('Atmosphere', '大气'), ocnH: L('Ocean', '海洋'), gridH: L('Grid', '网格'), cutH: L('Cutaway', '剖面'), viewH: L('View', '视图'),
  follow: L('Layers follow the step', '图层随步骤切换'), followHint: L('Untick to keep your own layer choice while playing.', '取消勾选后，播放时保留你自己选的图层。'),
  shell: L('EMBM layer (one level)', 'EMBM 大气层（单层）'), emWinds: L('EMBM advecting winds', 'EMBM 平流风场'), halo: L('ATCHEM box (well mixed)', 'ATCHEM 箱（充分混合）'),
  tauP: L('Wind stress on the ocean', '海面风应力'), runoff: L('Runoff routes to the coast', '径流入海路线'), path: L('Island path (Antarctica)', '岛屿积分路径（南极）'),
  grid: L('36 × 36 grid lines', '36 × 36 网格线'),
  cut: L('Cut away a wedge', '切开一个楔形'), cutLon: L('Western face (°E)', '西侧剖面（°E）'), cutW: L('Wedge width (°)', '楔形宽度（°）'),
  cutO: L('Section colour', '剖面着色'), cutFollow: L('Wedge follows the camera', '楔形跟随视角'),
  vscale: L('Vertical axis', '垂直坐标'), vLevels: L('model levels', '模式层'), vPhys: L('true depth', '真实深度'),
  autoCam: L('Move the camera with the step', '视角随步骤移动'),
  grpGeo: L('Geometry', '几何'), grpForce: L('Boundary conditions', '边界条件'), grpCalc: L('Computed here', '本页计算'),
  tipLand: L('land', '陆地'), tipSea: L('ocean', '海洋'), tipCell: L('cell', '格点'), tipLev: L('{n} levels, floor {d} m', '{n} 层，海底 {d} m'),
  tipRun: L('runoff → cell i={i}, j={j}', '径流 → 格点 i={i}, j={j}'),
  about: L('About the data', '关于数据'),
  aboutText: L('cGENIE has not been run for this page, so no model-state field is shown: there is no temperature, salinity, current, tracer or pCO₂ on the globe. What is coloured are the worjh2 boundary conditions that the CBSR base configuration points to (genie-paleo/p_worjh2, genie-biogem/data/input/windspeed.dat), read by 3d/build_data.py, and a few things computed here from them: insolation from the orbit with the radfor.F formula, runoff routes with readroff.f, remineralisation profiles from the BIOGEM XML defaults. Call order and source lines: cgenie.cookie genie.F and the module sources, as in the 2D walkthrough.',
    '本页没有运行 cGENIE，因此不显示任何模式状态场：地球上没有温度、盐度、洋流、示踪物或 pCO₂。着色的是 CBSR 基础配置所用的 worjh2 边界条件（genie-paleo/p_worjh2、genie-biogem/data/input/windspeed.dat），由 3d/build_data.py 读入；另有几项由它们在本页算出：用 radfor.F 公式由轨道算的日射、用 readroff.f 追出的径流路线、用 BIOGEM XML 默认值算的再矿化廓线。调用顺序和源码行号取自 cgenie.cookie 的 genie.F 和各模块源码，与 2D 版一致。'),
};

/* ================================================================ modules */
const COMP = {
  surflux: { c: '#E7B04C', n: L('surflux', 'surflux') },
  embm: { c: '#6FAEE0', n: L('EMBM', 'EMBM') },
  seaice: { c: '#A9B9E4', n: L('Sea ice', '海冰') },
  goldstein: { c: '#35B6C2', n: L('GOLDSTEIN', 'GOLDSTEIN') },
  rokgem: { c: '#C99A5B', n: L('ROKGEM', 'ROKGEM') },
  biogem: { c: '#93C45A', n: L('BIOGEM', 'BIOGEM') },
  atchem: { c: '#F06BB4', n: L('ATCHEM', 'ATCHEM') },
  sedgem: { c: '#E5864A', n: L('SEDGEM', 'SEDGEM') },
  main: { c: '#95A6AE', n: L('genie.F', 'genie.F') },
};
const ORDER = ['surflux', 'embm', 'seaice', 'goldstein', 'rokgem', 'biogem', 'atchem', 'sedgem'];
const compColor = k => (COMP[k] || COMP.main).c;

/* ================================================================ grid */
const NI = 36, NJ = 36, NK = 16, LON0 = IN ? IN.grid.lon0 : -260;
const G = IN ? IN.grid : null;
const LATC = G ? G.latC : [], LATE = G ? G.latEdges : [], DEPE = G ? G.depthEdges : [];
const NLEV = IN ? IN.nlev : [];
const isWet = c => NLEV[c] > 0;
const lonW = i => wrap360(LON0 + 10 * i), lonC = i => wrap360(LON0 + 10 * i + 5);
const jOf = lat => clamp(Math.floor((Math.sin(lat * D2R) + 1) * 18), 0, 35);
const iOf = lon => Math.floor(wrap360(lon - LON0) / 10) % 36;
const cellOf = (lat, lon) => jOf(lat) * NI + iOf(lon);
const fmtLat = lat => `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'}`;
const DAYK = 365.25 / 480;                      // master step, days
const fmtD = d => d.toFixed(1);

/* bilinear interpolation of a cell-centred field; NaN cells are left out */
function sampleC(arr, lat, lon) {
  const x = wrap360(lon - LON0) / 10 - 0.5, y = (Math.sin(lat * D2R) + 1) * 18 - 0.5;
  const i0 = Math.floor(x), fx = x - i0, j0 = clamp(Math.floor(y), 0, 34), fy = clamp(y - j0, 0, 1);
  const a = (i0 + 36) % 36, b = (i0 + 1 + 36) % 36;
  const v = [arr[j0 * 36 + a], arr[j0 * 36 + b], arr[(j0 + 1) * 36 + a], arr[(j0 + 1) * 36 + b]];
  const w = [(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy];
  let s = 0, ws = 0;
  for (let q = 0; q < 4; q++) if (v[q] === v[q]) { s += v[q] * w[q]; ws += w[q]; }
  return ws > 0.2 ? s / ws : NaN;
}

/* ---------------------------------------------------------------- vertical axis (top-down boundary index n = 0 … 16) */
const OCN_H = 0.48, LAND_H = 0.010, EMBM_R = 1.065, ATCHEM_R = 1.17, CORE_R = 1 - OCN_H - 0.004;
const VIEW = {
  surf: 'depth', shell: false, emWinds: false, halo: false, tauP: false, runoff: false, path: false, grid: false,
  cut: true, cutLon: 320, cutW: 80, cutO: 'levels', cutFollow: true, vmode: 'levels', autoCam: true, follow: true, spin: false,
};
function depthAt(nf) { const n0 = clamp(Math.floor(nf), 0, 15); return lerp(DEPE[n0], DEPE[n0 + 1], clamp(nf - n0, 0, 1)); }
const ocnR = nf => VIEW.vmode === 'levels' ? 1 - OCN_H * nf / 16 : 1 - OCN_H * depthAt(nf) / 5000;
const kOfN = n => 16 - n;                      // GOLDSTEIN numbers levels from the bottom: k = 1 bottom, 16 top

function xyz(lat, lon, r, v = new THREE.Vector3()) {
  const la = lat * D2R, lo = lon * D2R;
  return v.set(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo));
}
function lonlatOf(v) { const r = v.length(); return [Math.asin(clamp(v.y / r, -1, 1)) / D2R, wrap360(Math.atan2(-v.z, v.x) / D2R)]; }
const inCut = lon => { if (!VIEW.cut) return false; const [a, b] = faceLons(); return wrap360(lon - a) < (wrap360(b - a) || 360); };

/* ================================================================ insolation: radfor.F (opt_orbit_old), CBSR defaults */
const ORB = (() => {
  const e = 0.0167, sob = 0.397789, gamDeg = 102.92, S0 = 1368, nyear = 96;
  let zw1 = 180 + gamDeg; if (zw1 > 360) zw1 -= 360;
  const zv = Math.PI / 180 * (360 - zw1); let zm = zv;
  for (let i = 0; i < 10; i++) zm = zv - (2 * e - 0.25 * e * e * e) * Math.sin(zm) - 1.25 * e * e * Math.sin(2 * zm) - 13 / 12 * e * e * e * Math.sin(3 * zm);
  const gam = 0.5 * (zv + zm), tv = e * e;
  return { e, sob, gam, S0, nyear, e1: e * (2 - 0.25 * tv), e2: 1.25 * tv, e3: e * tv * 13 / 12, e4: ((1 + 0.5 * tv) / (1 - tv)) ** 2 };
})();
/* day: days since 1 Jan; returns {decl (deg), insol(j)} exactly as solfor(j, istep) with istep = day/365.25*96 (osctau0 = -0.5) */
function orbitAt(day) {
  const O = ORB, osct = (day / 365.25 * O.nyear) * 2 * Math.PI / O.nyear;
  const v = osct + O.e1 * Math.sin(osct) + O.e2 * Math.sin(2 * osct) + O.e3 * Math.sin(3 * osct);
  const solf = O.e4 * (1 + O.e * Math.cos(v)) ** 2, sind = O.sob * Math.sin(v - O.gam);
  const ins = new Float32Array(NJ);
  for (let j = 0; j < NJ; j++) {
    const s = Math.sin(LATC[j] * D2R), c = Math.cos(LATC[j] * D2R), ss = sind * s, cc = Math.sqrt(1 - sind * sind) * c;
    const day0 = Math.acos(-clamp(ss / cc, -1, 1));
    ins[j] = O.S0 * solf / Math.PI * (ss * day0 + cc * Math.sin(day0));
  }
  return { decl: Math.asin(sind) / D2R, ins };
}

/* ================================================================ fields from the inputs */
const FLD = {};
function prepFields() {
  const n = NI * NJ, nan = () => new Float32Array(n).fill(NaN);
  /* wind stress and EMBM winds: u-point x and v-point y components averaged to cell centres */
  const centre = (xu, yv, wetOnly) => {
    const U = nan(), V = nan();
    for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) {
      const c = j * NI + i; if (wetOnly && !isWet(c)) continue;
      U[c] = 0.5 * (xu[j * NI + (i + NI - 1) % NI] + xu[c]);
      V[c] = 0.5 * ((j > 0 ? yv[(j - 1) * NI + i] : 0) + yv[c]);
    }
    return [U, V];
  };
  [FLD.tx, FLD.ty] = centre(IN.tau.xu, IN.tau.yv, true);
  [FLD.ua, FLD.va] = centre(IN.uatm, IN.vatm, false);
  FLD.tau = nan(); FLD.wa = nan(); FLD.ws = nan(); FLD.depth = nan(); FLD.sed = nan(); FLD.nlev = nan();
  for (let c = 0; c < n; c++) {
    FLD.wa[c] = Math.hypot(FLD.ua[c], FLD.va[c]);
    if (!isWet(c)) continue;
    FLD.tau[c] = Math.hypot(FLD.tx[c], FLD.ty[c]);
    FLD.ws[c] = IN.windspeed[c] == null ? NaN : IN.windspeed[c];
    FLD.depth[c] = DEPE[NLEV[c]]; FLD.nlev[c] = NLEV[c];
    FLD.sed[c] = IN.sedDepth[c] > 0 ? IN.sedDepth[c] : NaN;
  }
  /* coastal cells that receive runoff, and the catchment of each */
  FLD.coast = new Set(IN.runoffTo.filter(x => x >= 0));
  FLD.catch = {}; IN.runoffTo.forEach((d, c) => { if (d >= 0) (FLD.catch[d] = FLD.catch[d] || []).push(c); });
  /* island land (psiles value 2 at any corner of the cell) */
  FLD.island = new Uint8Array(n);
  for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) {
    const c = j * NI + i; if (isWet(c)) continue;
    const ps = (ii, jj) => IN.psiles[jj * NI + ((ii + NI) % NI)];
    if ([ps(i, j), ps(i - 1, j), ps(i, j + 1), ps(i - 1, j + 1)].some(v => v === 2)) FLD.island[c] = 1;
  }
  /* JEBAR acts where the bottom slopes: wet columns whose depth differs from a wet neighbour by ≥ 4 levels */
  FLD.slope = new Uint8Array(n);
  for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) {
    const c = j * NI + i; if (!isWet(c)) continue;
    const nb = [j * NI + (i + 1) % NI, j * NI + (i + NI - 1) % NI, j > 0 ? c - NI : -1, j < NJ - 1 ? c + NI : -1];
    if (nb.some(o => o >= 0 && isWet(o) && Math.abs(NLEV[o] - NLEV[c]) >= 4)) FLD.slope[c] = 1;
  }
  FLD.wetList = []; for (let c = 0; c < n; c++) if (isWet(c)) FLD.wetList.push(c);
}
/* remineralisation: fraction of the export (at the base of the top cell, 80.8 m) still sinking at depth z (m) */
const REMIN = { poc: { L1: 500, f2: 0.05, L2: 1e6 }, caco3: { L1: 1000, f2: 0.5, L2: 1e6 } };
function fluxFrac(kind, z) {
  const r = REMIN[kind], dz = Math.max(z - DEPE[1], 0);
  return (1 - r.f2) * Math.exp(-dz / r.L1) + r.f2 * Math.exp(-dz / r.L2);
}

/* ================================================================ colour maps */
const CM = {
  deep: ['#E3F7FA', '#86CDD9', '#3C9CB4', '#1C6C8C', '#16435F', '#121F33'],
  sun: ['#120D06', '#3F2B0E', '#7A5214', '#B57F1E', '#E8B444', '#FBE7A0'],
  heat: ['#14091F', '#3E1550', '#79215A', '#B53A4A', '#E2683A', '#F7A93B', '#FCE38A'],
  gray: ['#0F151B', '#353D44', '#666E74', '#9EA5A9', '#D3D7D9', '#FFFFFF'],
  wind: ['#16283A', '#2B5C8A', '#4FA3D1', '#A6E1F0', '#FFFFFF', '#FFD98A'],
  green: ['#0C1A12', '#183A22', '#2C6B32', '#5C9E3A', '#A4C95A', '#E3F0A6'],
  sed: ['#F3E2C2', '#D9B77A', '#B98A4A', '#8A5B2E', '#583619', '#2B1A0C'],
  levels: ['#9FE0EA', '#3C9CB4', '#1C5F86', '#183E66', '#14284A'],
  thick: ['#E3F7FA', '#86CDD9', '#3C9CB4', '#1C6C8C', '#16435F'],
  tauc: ['#0E1F2C', '#14425A', '#1F7590', '#4FB3C4', '#BDEBF0', '#FFF6D8'],
  windT: ['#2B5C8A', '#4FA3D1', '#A6E1F0', '#FFFFFF', '#FFD98A'],
  stressT: ['#5FC3D0', '#9FE6EE', '#E6FBFD', '#FFFFFF'],
};
const hex3 = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const LUTS = {};
function lut(name) {
  if (LUTS[name]) return LUTS[name];
  const st = CM[name].map(hex3), out = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const x = i / 255 * (st.length - 1), k = Math.min(Math.floor(x), st.length - 2), f = x - k;
    for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(lerp(st[k][c], st[k + 1][c], f));
  }
  return (LUTS[name] = out);
}
const rgbOf = (cmap, t) => { const L3 = lut(cmap), k = Math.round(clamp(t, 0, 1) * 255) * 3; return [L3[k], L3[k + 1], L3[k + 2]]; };
const LAND_RGB = [92, 82, 68];
const BASIN = ['#C99A5B', '#93C45A', '#E7B04C', '#A58CF2', '#E5864A', '#6FAEE0', '#F06BB4', '#4FC79A', '#D9C27A', '#8796B0'];

/* ================================================================ surface layers */
const SURF = {
  depth: { grp: 'grpGeo', name: L('Ocean depth (worjh2.k1)', '海洋深度（worjh2.k1）'), units: 'm', cmap: 'deep', lo: 0, hi: 5000, f: 'depth', src: 'worjh2.k1 (17 − k1)' },
  sedDepth: { grp: 'grpGeo', name: L('Sediment-grid depth', '沉积物网格水深'), units: 'm', cmap: 'deep', lo: 0, hi: 6000, f: 'sed', src: 'worjh2_topo.36x36 (sg_par_sed_topo_D_name)' },
  basins: { grp: 'grpGeo', cat: 'basins', name: L('Runoff catchments', '径流汇水区'), src: 'worjh2.k1 (91–94) → readroff.f' },
  islands: { grp: 'grpGeo', cat: 'islands', name: L('Landmasses for the barotropic solve', '正压求解中的陆块'), src: 'worjh2.psiles, worjh2.paths' },
  tau: { grp: 'grpForce', name: L('Wind stress |τ|', '风应力 |τ|'), units: 'N m⁻²', cmap: 'tauc', lo: 0, hi: 0.2, f: 'tau', src: 'taux_u, tauy_v .interp (ea_taux_u …)' },
  uatm: { grp: 'grpForce', name: L('EMBM advecting wind speed', 'EMBM 平流风速'), units: 'm s⁻¹', cmap: 'wind', lo: 0, hi: 8, f: 'wa', land: true, src: 'uncep.silo, vncep.silo (ea_adv_u/v)' },
  windspeed: { grp: 'grpForce', name: L('Wind speed for gas exchange', '气体交换用风速'), units: 'm s⁻¹', cmap: 'wind', lo: 2, hi: 13, f: 'ws', src: 'genie-biogem/data/input/windspeed.dat' },
  albedo: { grp: 'grpForce', name: L('Planetary albedo (zonal)', '行星反照率（纬向）'), units: '', cmap: 'gray', lo: 0.1, hi: 0.6, zonal: 'albedo', land: true, src: 'worjh2.albd.dat (ea_par_albedo1d_name)' },
  insol: { grp: 'grpCalc', name: L('Daily-mean insolation', '日平均日射'), units: 'W m⁻²', cmap: 'sun', lo: 0, hi: 560, zonal: 'insol', land: true, timed: true, src: 'radfor.F, S₀ = 1368, modern orbit' },
  swabs: { grp: 'grpCalc', name: L('Absorbed shortwave = insolation × (1 − albedo)', '吸收短波 = 日射 × (1 − 反照率)'), units: 'W m⁻²', cmap: 'heat', lo: 0, hi: 450, zonal: 'swabs', land: true, timed: true, src: 'radfor.F × worjh2.albd.dat' },
};
const SURF_GROUPS = [['grpGeo', ['depth', 'sedDepth', 'basins', 'islands']], ['grpForce', ['tau', 'uatm', 'windspeed', 'albedo']], ['grpCalc', ['insol', 'swabs']]];
let MODEL_DAY = 0, ORBNOW = null;
function zonalOf(kind, j) {
  if (kind === 'albedo') return IN.albedo[j];
  if (kind === 'insol') return ORBNOW.ins[j];
  return ORBNOW.ins[j] * (1 - IN.albedo[j]);
}
function surfValue(s, c) {
  if (s.zonal) return zonalOf(s.zonal, Math.floor(c / NI));
  if (s.f) return FLD[s.f][c];
  return NaN;
}
const basinColor = d => hex3(BASIN[(Math.floor(d / NI) * 7 + (d % NI) * 3) % BASIN.length]);
function fillSurface(s, out) {
  for (let c = 0; c < NI * NJ; c++) {
    const wet = isWet(c);
    let rgb;
    if (s.cat === 'basins') rgb = wet ? (FLD.coast.has(c) ? [214, 236, 240] : [22, 52, 74]) : basinColor(IN.runoffTo[c]);
    else if (s.cat === 'islands') rgb = wet ? [22, 52, 74] : (FLD.island[c] ? [240, 107, 180] : [150, 128, 96]);
    else if (!wet && !s.land) rgb = LAND_RGB;
    else {
      const v = surfValue(s, c);
      rgb = v === v ? rgbOf(s.cmap, (v - s.lo) / (s.hi - s.lo)) : (wet ? [30, 40, 48] : LAND_RGB);
      if (!wet && s.land) rgb = rgb.map(x => Math.round(x * 0.78 + 14));
    }
    out[c * 4] = rgb[0]; out[c * 4 + 1] = rgb[1]; out[c * 4 + 2] = rgb[2]; out[c * 4 + 3] = 255;
  }
}

/* ================================================================ shaders */
const GLSL_COMMON = `
uniform vec3 uCut;
vec2 lonlat(vec3 p) { vec3 n = normalize(p); return vec2(mod(degrees(atan(-n.z, n.x + 1e-7)) + 360.0, 360.0), degrees(asin(clamp(n.y, -1.0, 1.0)))); }
bool inCut(float lon) { return uCut.x > 0.5 && mod(lon - uCut.y + 720.0, 360.0) < uCut.z; }
vec2 cellUV(vec2 ll) {
  float i = floor(mod(ll.x + 260.0, 360.0) / 10.0);
  float j = clamp(floor((sin(radians(ll.y)) + 1.0) * 18.0), 0.0, 35.0);
  return vec2((i + 0.5) / 36.0, (j + 0.5) / 36.0);
}
`;
const GLSL_GRID = `
float gl1(float x) { float w = fwidth(x); return 1.0 - smoothstep(0.0, 1.2 * w, abs(fract(x - 0.5) - 0.5)); }
float gridAt(vec2 ll) { return max(gl1(mod(ll.x + 260.0, 360.0) / 10.0), gl1((sin(radians(ll.y)) + 1.0) * 18.0)); }
`;
const SH = {
  globeV: `${GLSL_COMMON}
uniform sampler2D uLand; uniform float uLandH;
varying vec3 vN;
void main() {
  vec3 n = normalize(position); vN = n;
  float land = texture2D(uLand, cellUV(lonlat(n))).r;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(n * (1.0 + uLandH * land), 1.0);
}`,
  globeF: `${GLSL_COMMON}${GLSL_GRID}
uniform sampler2D uSurf; uniform sampler2D uLand; uniform sampler2D uMark; uniform float uGrid; uniform vec3 uLight;
uniform vec4 uPulse; uniform float uTime;
varying vec3 vN;
void main() {
  vec3 n = normalize(vN); vec2 ll = lonlat(n);
  if (inCut(ll.x)) discard;
  vec2 uv = cellUV(ll);
  vec3 col = texture2D(uSurf, uv).rgb;
  float land = texture2D(uLand, uv).r;
  vec4 mk = texture2D(uMark, uv);
  col = mix(col, mk.rgb, mk.a);
  if (uPulse.w > 0.0) col = mix(col, uPulse.rgb, uPulse.w * (1.0 - land));
  float lit = 0.80 + 0.30 * clamp(dot(n, uLight), 0.0, 1.0);
  col *= lit;
  if (uGrid > 0.0) col = mix(col, vec3(0.92, 0.97, 1.0), gridAt(ll) * uGrid * 0.30);
  gl_FragColor = vec4(col, 1.0);
}`,
  shellV: `varying vec3 vN; void main() { vN = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  shellF: `${GLSL_COMMON}${GLSL_GRID}
uniform vec3 uColor; uniform float uOpacity; uniform float uGrid; uniform float uTime; uniform float uPatch;
varying vec3 vN;
void main() {
  vec2 ll = lonlat(vN);
  if (inCut(ll.x)) discard;
  float a = uOpacity;
  if (uPatch > 0.0) {
    vec3 p = vN * 3.0;
    float nz = sin(p.x * 2.1 + uTime * 0.7) * sin(p.y * 2.7 - uTime * 0.5) * sin(p.z * 1.9 + uTime * 0.3);
    a *= 1.0 + uPatch * 1.6 * nz;
  }
  vec3 col = uColor;
  if (uGrid > 0.0) { float g = gridAt(ll); col = mix(col, vec3(1.0), g * 0.6 * uGrid); a = max(a, g * 0.35 * uGrid); }
  if (a < 0.004) discard;
  gl_FragColor = vec4(col, a);
}`,
  slabF: `${GLSL_COMMON}
uniform sampler2D uNlev; uniform float uN; uniform vec3 uColor; uniform float uOpacity;
varying vec3 vN;
void main() {
  vec2 ll = lonlat(vN);
  if (!inCut(ll.x)) discard;
  float nl = texture2D(uNlev, cellUV(ll)).r * 255.0;
  if (nl < uN + 0.5) discard;
  gl_FragColor = vec4(uColor, uOpacity);
}`,
  lineV: `attribute vec4 acol; attribute float at;
varying vec4 vC; varying float vT; varying vec3 vW;
void main() { vC = acol; vT = at; vW = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  lineF: `uniform vec3 uCut; uniform float uTime; uniform float uDash; uniform float uSpeed; uniform float uAlpha; uniform float uNoCut;
varying vec4 vC; varying float vT; varying vec3 vW;
bool inCut(float lon) { return uCut.x > 0.5 && mod(lon - uCut.y + 720.0, 360.0) < uCut.z; }
void main() {
  if (uNoCut < 0.5) { vec3 n = normalize(vW); float lon = mod(degrees(atan(-n.z, n.x)) + 360.0, 360.0); if (inCut(lon)) discard; }
  float a = vC.a * uAlpha;
  if (uDash > 0.0) { float f = fract(vT * uDash - uTime * uSpeed); a *= smoothstep(0.0, 0.12, f) * (1.0 - smoothstep(0.45, 0.6, f)); }
  if (a < 0.01) discard;
  gl_FragColor = vec4(vC.rgb, a);
}`,
  haloV: `varying vec3 vN; varying vec3 vV;
void main() { vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
  haloF: `uniform vec3 uColor; uniform float uPow; uniform float uAlpha; varying vec3 vN; varying vec3 vV;
void main() { float f = pow(1.0 - abs(dot(vN, vV)), uPow); gl_FragColor = vec4(uColor, f * uAlpha); }`,
  starV: `attribute float sz; void main() { gl_PointSize = sz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  starF: `void main() { vec2 d = gl_PointCoord - 0.5; float a = 1.0 - smoothstep(0.2, 0.5, length(d)); gl_FragColor = vec4(vec3(0.85, 0.9, 1.0), a * 0.55); }`,
};

/* ================================================================ scene */
let renderer, scene, camera, controls, CAMTWEEN = null;
const SHARED = { uCut: { value: new THREE.Vector3(1, 330, 60) }, uTime: { value: 0 } };
const OBJ = {};
let surfData, surfTex, markData, markTex;
function dataTex(data, w, h, format) {
  const t = new THREE.DataTexture(data, w, h, format, THREE.UnsignedByteType);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping;
  t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
}
function initScene() {
  const canvas = $('#gl');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x060B11, 1);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 1, 0.01, 200);
  camera.position.copy(xyz(20, 345, 6.2));
  controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, enablePan: false, minDistance: 1.6, maxDistance: 12, rotateSpeed: 0.55, zoomSpeed: 0.8, autoRotateSpeed: 0.6 });
  controls.addEventListener('start', () => { CAMTWEEN = null; });
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const dl = new THREE.DirectionalLight(0xffffff, 0.6); dl.position.set(3, 4, 5); scene.add(dl);

  const land = new Uint8Array(NI * NJ), nl = new Uint8Array(NI * NJ);
  for (let c = 0; c < NI * NJ; c++) { land[c] = isWet(c) ? 0 : 255; nl[c] = NLEV[c]; }
  OBJ.landTex = dataTex(land, NI, NJ, THREE.RedFormat);
  OBJ.nlevTex = dataTex(nl, NI, NJ, THREE.RedFormat);
  surfData = new Uint8Array(NI * NJ * 4); surfTex = dataTex(surfData, NI, NJ, THREE.RGBAFormat);
  markData = new Uint8Array(NI * NJ * 4); markTex = dataTex(markData, NI, NJ, THREE.RGBAFormat);

  OBJ.globe = new THREE.Mesh(new THREE.SphereGeometry(1, 360, 180), new THREE.ShaderMaterial({
    uniforms: Object.assign({}, SHARED, { uLand: { value: OBJ.landTex }, uLandH: { value: LAND_H }, uSurf: { value: surfTex }, uMark: { value: markTex },
      uGrid: { value: 0 }, uLight: { value: new THREE.Vector3(0.4, 0.6, 0.7).normalize() }, uPulse: { value: new THREE.Vector4(0, 0, 0, 0) } }),
    vertexShader: SH.globeV, fragmentShader: SH.globeF }));
  scene.add(OBJ.globe);

  OBJ.glow = new THREE.Mesh(new THREE.SphereGeometry(1.09, 96, 48), new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(0x3E7FB8) }, uPow: { value: 2.8 }, uAlpha: { value: 0.28 } },
    vertexShader: SH.haloV, fragmentShader: SH.haloF, transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending }));
  OBJ.glow.renderOrder = -1; scene.add(OBJ.glow);

  const shell = (r, color, order) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 180, 90), new THREE.ShaderMaterial({
      uniforms: Object.assign({}, SHARED, { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 0.1 }, uGrid: { value: 0 }, uPatch: { value: 0 } }),
      vertexShader: SH.shellV, fragmentShader: SH.shellF, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    m.renderOrder = order; m.visible = false; scene.add(m); return m;
  };
  OBJ.embm = shell(EMBM_R, 0x6FAEE0, 20);
  OBJ.atchem = shell(ATCHEM_R, 0xF06BB4, 22);
  OBJ.atchemGlow = new THREE.Mesh(new THREE.SphereGeometry(ATCHEM_R + 0.01, 96, 48), new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(0xF06BB4) }, uPow: { value: 2.2 }, uAlpha: { value: 0.0 } },
    vertexShader: SH.haloV, fragmentShader: SH.haloF, transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending }));
  OBJ.atchemGlow.renderOrder = -1; OBJ.atchemGlow.visible = false; scene.add(OBJ.atchemGlow);

  OBJ.slab = new THREE.Mesh(new THREE.SphereGeometry(1, 180, 90), new THREE.ShaderMaterial({
    uniforms: Object.assign({}, SHARED, { uNlev: { value: OBJ.nlevTex }, uN: { value: 0 }, uColor: { value: new THREE.Color(0xE7B04C) }, uOpacity: { value: 0.35 } }),
    vertexShader: SH.shellV, fragmentShader: SH.slabF, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  OBJ.slab.renderOrder = 15; OBJ.slab.visible = false; scene.add(OBJ.slab);

  const ns = 1400, sp = new Float32Array(ns * 3), sz = new Float32Array(ns);
  for (let i = 0; i < ns; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(60 + Math.random() * 40); sp.set([v.x, v.y, v.z], i * 3); sz[i] = 0.8 + Math.random() * 1.8; }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('sz', new THREE.BufferAttribute(sz, 1));
  scene.add(new THREE.Points(sg, new THREE.ShaderMaterial({ vertexShader: SH.starV, fragmentShader: SH.starF, transparent: true, depthWrite: false })));

  const sc = document.createElement('canvas'); sc.width = sc.height = 128;
  const g = sc.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,248,220,1)'); gr.addColorStop(0.18, 'rgba(255,214,120,0.9)'); gr.addColorStop(0.5, 'rgba(231,176,76,0.25)'); gr.addColorStop(1, 'rgba(231,176,76,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  OBJ.sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  OBJ.sun.scale.set(2.2, 2.2, 1); OBJ.sun.visible = false; scene.add(OBJ.sun);

  buildParticles(); buildLines(); buildCut();
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe($('#stage'));
  resize();
}
function resize() {
  const el = $('#stage'), w = el.clientWidth, h = el.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = Math.max(30, 2 * Math.atan(Math.tan(15 * D2R) / Math.min(camera.aspect, 1)) / D2R);
  camera.updateProjectionMatrix();
}

/* ---------------------------------------------------------------- lines and particles */
function lineMat(o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { uCut: SHARED.uCut, uTime: SHARED.uTime, uDash: { value: o.dash || 0 }, uSpeed: { value: o.speed || 0 }, uAlpha: { value: o.alpha == null ? 1 : o.alpha }, uNoCut: { value: o.nocut ? 1 : 0 } },
    vertexShader: SH.lineV, fragmentShader: SH.lineF, transparent: true, depthWrite: false, blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}
function lineGeo(n) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('acol', new THREE.BufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('at', new THREE.BufferAttribute(new Float32Array(n), 1).setUsage(THREE.DynamicDrawUsage));
  return g;
}
class Flow {
  constructor(n, o) {
    this.n = n; this.o = o; this.lat = new Float32Array(n); this.lon = new Float32Array(n); this.age = new Float32Array(n); this.life = new Float32Array(n);
    this.geo = lineGeo(n * 2); this.obj = new THREE.LineSegments(this.geo, lineMat({ additive: o.additive }));
    this.obj.renderOrder = o.order || 30; this.obj.visible = false; this.obj.frustumCulled = false; scene.add(this.obj);
    this.lut = lut(o.cmap); this.ready = false;
  }
  reset() { for (let i = 0; i < this.n; i++) this.spawn(i, true); this.ready = true; }
  spawn(i, first) {
    const [la, lo] = this.o.spawn(); this.lat[i] = la; this.lon[i] = lo;
    this.life[i] = 2 + Math.random() * 3; this.age[i] = first ? Math.random() * this.life[i] : 0;
  }
  update(dt) {
    if (!this.obj.visible) return;
    if (!this.ready) this.reset();
    const P = this.geo.attributes.position.array, C = this.geo.attributes.acol.array, o = this.o, v3 = new THREE.Vector3();
    for (let i = 0; i < this.n; i++) {
      let [u, v] = o.sample(this.lat[i], this.lon[i]);
      this.age[i] += dt;
      if (!(u === u) || !(v === v) || this.age[i] > this.life[i]) { this.spawn(i); [u, v] = o.sample(this.lat[i], this.lon[i]); if (!(u === u)) { u = 0; v = 0; } }
      const cl = Math.max(Math.cos(this.lat[i] * D2R), 0.08);
      let dla = v * o.speed * dt, dlo = u * o.speed * dt / cl;
      const cap = 8 * dt; dla = clamp(dla, -cap, cap); dlo = clamp(dlo, -cap / cl, cap / cl);
      this.lat[i] += dla; this.lon[i] = wrap360(this.lon[i] + dlo);
      if (Math.abs(this.lat[i]) > 88.5) this.spawn(i);
      const la = this.lat[i], lo = this.lon[i], r = o.radius, sp = Math.hypot(u, v);
      const tl = o.trail, tla = la - clamp(v * o.speed * tl, -3, 3), tlo = lo - clamp(u * o.speed * tl / cl, -6, 6);
      xyz(la, lo, r, v3); P[i * 6] = v3.x; P[i * 6 + 1] = v3.y; P[i * 6 + 2] = v3.z;
      xyz(tla, tlo, r, v3); P[i * 6 + 3] = v3.x; P[i * 6 + 4] = v3.y; P[i * 6 + 5] = v3.z;
      const k = Math.round(clamp(sp / o.vmax, 0, 1) * 255) * 3, a = Math.min(1, this.age[i] * 2, (this.life[i] - this.age[i]) * 2) * o.alpha;
      C[i * 8] = C[i * 8 + 4] = this.lut[k] / 255; C[i * 8 + 1] = C[i * 8 + 5] = this.lut[k + 1] / 255; C[i * 8 + 2] = C[i * 8 + 6] = this.lut[k + 2] / 255;
      C[i * 8 + 3] = a; C[i * 8 + 7] = 0;
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.acol.needsUpdate = true;
  }
}
const FLOW = {};
function pickWet() {
  const L1 = FLD.wetList;
  for (let t = 0; t < 30; t++) {
    const c = L1[(Math.random() * L1.length) | 0], j = Math.floor(c / NI), i = c % NI;
    const lat = Math.asin(lerp(Math.sin(LATE[j] * D2R), Math.sin(LATE[j + 1] * D2R), Math.random())) / D2R;
    return [lat, lonW(i) + Math.random() * 10];
  }
  return [0, 0];
}
const randomSphere = () => [Math.asin(Math.random() * 2 - 1) / D2R, Math.random() * 360];
function buildParticles() {
  FLOW.tau = new Flow(4200, { cmap: 'stressT', vmax: 0.15, speed: 55, trail: 0.5, alpha: 0.95, spawn: pickWet, sample: (la, lo) => [sampleC(FLD.tx, la, lo), sampleC(FLD.ty, la, lo)], radius: 1.004 });
  FLOW.wind = new Flow(4200, { cmap: 'windT', vmax: 7, speed: 1.3, trail: 0.45, alpha: 0.85, additive: true, order: 31, spawn: randomSphere, sample: (la, lo) => [sampleC(FLD.ua, la, lo), sampleC(FLD.va, la, lo)], radius: EMBM_R + 0.002 });
}

const LINES = {};
function makeLines(name, n, o) {
  const geo = lineGeo(n), obj = new THREE.LineSegments(geo, lineMat(o));
  obj.renderOrder = o.order || 32; obj.visible = false; obj.frustumCulled = false; scene.add(obj);
  LINES[name] = { geo, obj, n, used: 0 };
  return LINES[name];
}
function writer(Lr) {
  const P = Lr.geo.attributes.position.array, C = Lr.geo.attributes.acol.array, T = Lr.geo.attributes.at.array; let i = 0;
  return {
    seg(a, b, ca, cb, ta = 0, tb = 1) {
      if (i + 2 > Lr.n) return;
      P.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 3); C.set(ca, i * 4); C.set(cb || ca, i * 4 + 4); T[i] = ta; T[i + 1] = tb; i += 2;
    },
    done() {
      Lr.used = i; Lr.geo.setDrawRange(0, i);
      Lr.geo.attributes.position.needsUpdate = Lr.geo.attributes.acol.needsUpdate = Lr.geo.attributes.at.needsUpdate = true;
    },
  };
}
const rgba = (h, a) => { const c = hex3(h); return [c[0] / 255, c[1] / 255, c[2] / 255, a]; };
function buildLines() {
  makeLines('runoff', 362 * 16 + 64, { dash: 2, speed: 0.7, order: 34, nocut: true });
  makeLines('path', 400, { order: 35, nocut: true });
  makeLines('spikes', 2400 * 2, { dash: 2.5, speed: 1.0, additive: true, order: 33 });
  makeLines('sink', 80 * 20 * 2, { dash: 5, speed: 0.6, additive: true, order: 36, nocut: true });
  makeLines('pin', 64, { order: 37, nocut: true });
  makeLines('cutLines', 20000, { order: 3, nocut: true });
  makeLines('cutHi', 3000, { order: 4, nocut: true, additive: true });
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
function cellCentre(c) { const j = Math.floor(c / NI), i = c % NI; return [LATC[j], lonC(i)]; }
function buildRunoff() {
  const w = writer(LINES.runoff), cl = rgba('#FFF1D6', 1), co = rgba('#7DE3EC', 1);
  IN.runoffTo.forEach((d, c) => {
    if (d < 0) return;
    const [la0, lo0] = cellCentre(c), [la1, lo1] = cellCentre(d);
    let dl = wrap360(lo1 - lo0); if (dl > 180) dl -= 360;
    const dist = Math.hypot(la1 - la0, dl * Math.cos(la0 * D2R)), h = 0.02 + dist / 450, n = 12;
    for (let s = 0; s < n; s++) {
      const t0 = s / n, t1 = (s + 1) / n;
      xyz(lerp(la0, la1, t0), lo0 + dl * t0, 1 + LAND_H + h * Math.sin(Math.PI * t0), _a);
      xyz(lerp(la0, la1, t1), lo0 + dl * t1, 1 + LAND_H + h * Math.sin(Math.PI * t1), _b);
      w.seg(_a, _b, cl.map((x, q) => q < 3 ? lerp(x, co[q], t0) : x), cl.map((x, q) => q < 3 ? lerp(x, co[q], t1) : x), t0 * dist / 10, t1 * dist / 10);
    }
  });
  w.done();
}
function buildPath() {
  const w = writer(LINES.path), col = rgba('#F06BB4', 1), p = IN.paths[0] || [];
  p.forEach(([l, i, j], q) => {
    const [l2, i2, j2] = p[(q + 1) % p.length];
    xyz(LATC[j - 1], lonW(i - 1) + 10, 1.01, _a); xyz(LATC[j2 - 1], lonW(i2 - 1) + 10, 1.01, _b); w.seg(_a, _b, col, col);
    xyz(LATC[j - 1], lonW(i - 1) + 10, 1.0, _a); xyz(LATC[j - 1], lonW(i - 1) + 10, 1.03, _b); w.seg(_a, _b, col, rgba('#F06BB4', 0.2));
    void l; void l2;
  });
  w.done();
}
function buildSpikes(mode) {
  const w = writer(LINES.spikes);
  const C = { up: '#E2683A', down: '#E7B04C', both: '#E2683A', gas: '#F06BB4', olr: '#E2683A', rain: '#6FAEE0', ice: '#A9B9E4' }[mode] || '#E7B04C';
  const col = rgba(C, 0.9), col2 = rgba(mode === 'both' ? '#4FC79A' : C, 0.9), fade = c => [c[0], c[1], c[2], 0.15];
  const list = mode === 'olr' || mode === 'rain' ? Array.from({ length: NI * NJ }, (_, c) => c) : FLD.wetList;
  for (const c of list) {
    if (mode === 'rain' && Math.random() > 0.55) continue;
    const j = Math.floor(c / NI), i = c % NI, lat = LATC[j], lon = lonC(i);
    if (mode === 'up' || mode === 'both' || mode === 'gas') { xyz(lat, lon - 1.5, 1.003, _a); xyz(lat, lon - 1.5, EMBM_R - 0.004, _b); w.seg(_a, _b, col, fade(col), 0, 1); }
    if (mode === 'down' || mode === 'both' || mode === 'gas' || mode === 'rain') { xyz(lat, lon + 1.5, EMBM_R - 0.004, _a); xyz(lat, lon + 1.5, 1.003, _b); w.seg(_a, _b, fade(col2), col2, 0, 1); }
    if (mode === 'olr') { xyz(lat, lon, EMBM_R + 0.004, _a); xyz(lat, lon, EMBM_R + 0.07, _b); w.seg(_a, _b, col, fade(col), 0, 1); }
  }
  w.done();
}

/* ---------------------------------------------------------------- cutaway: two meridional sections through the ocean */
const CUTO = {
  levels: { name: L('Model levels (k = 16 at the top … 1 at the floor)', '模式层（顶层 k = 16 … 底层 k = 1）') },
  thick: { name: L('Level thickness', '层厚'), cmap: 'thick', lo: 80, hi: 770, units: 'm' },
  poc: { name: L('POC flux left at depth (remin, XML defaults)', '到达该深度的 POC 通量比例（再矿化，XML 默认）'), cmap: 'green', lo: 0, hi: 1, units: '' },
  caco3: { name: L('CaCO₃ flux left at depth (XML defaults)', '到达该深度的 CaCO₃ 通量比例（XML 默认）'), cmap: 'sed', lo: 0, hi: 1, units: '', rev: true },
};
let CUTMESH = null;
const faceLons = () => [Math.round(VIEW.cutLon / 10) * 10 % 360, Math.round((VIEW.cutLon + VIEW.cutW) / 10) * 10 % 360];
function faceCols(fi, lon) { return iOf(fi === 0 ? lon - 5 : lon + 5); }
function sectionColor(n, shade) {
  const z0 = DEPE[n], z1 = DEPE[n + 1], zm = 0.5 * (z0 + z1), m = VIEW.cutO;
  let rgb;
  if (m === 'thick') rgb = rgbOf('thick', (z1 - z0 - 80) / 690);
  else if (m === 'poc') rgb = rgbOf('green', n === 0 ? 1 : fluxFrac('poc', zm));
  else if (m === 'caco3') rgb = rgbOf('sed', 1 - (n === 0 ? 1 : fluxFrac('caco3', zm)));
  else { rgb = rgbOf('levels', n / 15); const b = n % 2 ? 0.86 : 1.0; rgb = rgb.map(x => x * b); }
  return rgb.map(x => x / 255 * shade);
}
function buildCut() {
  if (CUTMESH) { scene.remove(CUTMESH); CUTMESH.geometry.dispose(); }
  const pos = [], col = [], P = new THREE.Vector3();
  const quad = (lon, laS, laN, r0S, r1S, r0N, r1N, c) => {
    const v = [xyz(laS, lon, r0S, P).toArray(), xyz(laS, lon, r1S, P).toArray(), xyz(laN, lon, r1N, P).toArray(), xyz(laN, lon, r0N, P).toArray()];
    for (const q of [0, 1, 2, 0, 2, 3]) { pos.push(v[q][0], v[q][1], v[q][2]); col.push(c[0], c[1], c[2]); }
  };
  const lw = writer(LINES.cutLines), lineC = [1, 1, 1, 0.16], surfC = [1, 1, 1, 0.65];
  if (VIEW.cut) {
    faceLons().forEach((lon, fi) => {
      const shade = fi === 0 ? 1 : 0.8, i = faceCols(fi, lon);
      for (let j = 0; j < NJ; j++) {
        const c = j * NI + i, laS = LATE[j], laN = LATE[j + 1], nl = NLEV[c];
        if (nl > 0) {
          for (let n = 0; n < nl; n++) {
            const r0 = ocnR(n), r1 = ocnR(n + 1);
            quad(lon, laS, laN, r1, r0, r1, r0, sectionColor(n, shade));
            xyz(laS, lon, r1, _a); xyz(laN, lon, r1, _b); lw.seg(_a, _b, lineC, lineC);
          }
          const rb = ocnR(nl), sedC = FX.floor ? [0.98 * shade, 0.62 * shade, 0.30 * shade] : [0.72 * shade, 0.54 * shade, 0.29 * shade];
          quad(lon, laS, laN, rb - 0.009, rb, rb - 0.009, rb, sedC);
          quad(lon, laS, laN, CORE_R, rb - 0.009, CORE_R, rb - 0.009, [0.24 * shade, 0.21 * shade, 0.18 * shade]);
          xyz(laS, lon, 1.0005, _a); xyz(laN, lon, 1.0005, _b); lw.seg(_a, _b, surfC, surfC);
        } else {
          quad(lon, laS, laN, CORE_R, 1 + LAND_H, CORE_R, 1 + LAND_H, [0.36 * shade, 0.32 * shade, 0.27 * shade]);
          xyz(laS, lon, 1 + LAND_H + 0.0005, _a); xyz(laN, lon, 1 + LAND_H + 0.0005, _b); lw.seg(_a, _b, [0.8, 0.7, 0.55, 0.6], [0.8, 0.7, 0.55, 0.6]);
        }
        if (nl > 0) { xyz(laS, lon, ocnR(nl), _a); xyz(laS, lon, 1, _b); lw.seg(_a, _b, lineC, lineC); }
      }
      for (let j = 0; j < 36; j++) {
        const laS = -90 + 5 * j, laN = laS + 5;
        quad(lon, laS, laN, 0.02, CORE_R, 0.02, CORE_R, [0.13 * shade, 0.15 * shade, 0.17 * shade]);
      }
    });
  }
  lw.done();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  CUTMESH = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
  CUTMESH.renderOrder = 2; scene.add(CUTMESH);
  LINES.cutLines.obj.visible = VIEW.cut;
  updateCutLabels();
}
/* highlight level boundaries n0..n1 on both faces */
function cutBand(n0, n1, color) {
  const w = writer(LINES.cutHi), col = rgba(color, 0.95);
  if (VIEW.cut) faceLons().forEach((lon, fi) => {
    const i = faceCols(fi, lon);
    for (let j = 0; j < NJ; j++) {
      const nl = NLEV[j * NI + i]; if (nl <= n0) continue;
      for (const n of [n0, Math.min(n1, nl)]) { xyz(LATE[j], lon, ocnR(n), _a); xyz(LATE[j + 1], lon, ocnR(n), _b); w.seg(_a, _b, col, col); }
    }
  });
  w.done(); LINES.cutHi.obj.visible = VIEW.cut;
}
function cutAllLevels(color, alpha) {
  const w = writer(LINES.cutHi), col = rgba(color, alpha);
  if (VIEW.cut) faceLons().forEach((lon, fi) => {
    const i = faceCols(fi, lon);
    for (let j = 0; j < NJ; j++) {
      const nl = NLEV[j * NI + i];
      for (let n = 0; n <= nl; n++) { xyz(LATE[j], lon, ocnR(n), _a); xyz(LATE[j + 1], lon, ocnR(n), _b); w.seg(_a, _b, col, col); }
    }
  });
  w.done(); LINES.cutHi.obj.visible = VIEW.cut;
}
/* sinking particles just inside each face; brightness = share of the export still sinking */
function buildSink(kind) {
  const w = writer(LINES.sink), base = kind === 'caco3' ? '#F3E2C2' : '#BFE38A';
  if (VIEW.cut) faceLons().forEach((lon, fi) => {
    const i = faceCols(fi, lon), lo = fi === 0 ? lon + 1.5 : lon - 1.5;
    for (let j = 0; j < NJ; j++) {
      const nl = NLEV[j * NI + i]; if (!nl) continue;
      const la = LATC[j];
      for (let n = 0; n < nl; n++) {
        const fa = n === 0 ? 1 : fluxFrac(kind, DEPE[n]), fb = fluxFrac(kind, DEPE[n + 1]);
        xyz(la, lo, ocnR(n), _a); xyz(la, lo, ocnR(n + 1), _b);
        w.seg(_a, _b, rgba(base, 0.25 + 0.75 * fa), rgba(base, 0.25 + 0.75 * fb), n, n + 1);
      }
      xyz(la, lo - 0.8, ocnR(nl) - 0.002, _a); xyz(la, lo + 0.8, ocnR(nl) - 0.002, _b); w.seg(_a, _b, rgba('#E5864A', 1), rgba('#E5864A', 1), 0, 0);
    }
  });
  w.done();
}
function setPin(c, color) {
  const w = writer(LINES.pin);
  if (c >= 0) {
    const j = Math.floor(c / NI), i = c % NI, la = LATC[j], lo = lonC(i), col = rgba(color, 1), r = isWet(c) ? 1.004 : 1 + LAND_H + 0.004;
    xyz(la, lo, r, _a); xyz(la, lo, r + 0.09, _b); w.seg(_a, _b, col, rgba(color, 0.1));
    const sq = [[LATE[j], lonW(i)], [LATE[j], lonW(i) + 10], [LATE[j + 1], lonW(i) + 10], [LATE[j + 1], lonW(i)]];
    for (let q = 0; q < 4; q++) {
      const [a1, o1] = sq[q], [a2, o2] = sq[(q + 1) % 4];
      for (let s = 0; s < 4; s++) { xyz(lerp(a1, a2, s / 4), lerp(o1, o2, s / 4), r, _a); xyz(lerp(a1, a2, (s + 1) / 4), lerp(o1, o2, (s + 1) / 4), r, _b); w.seg(_a, _b, col, col); }
    }
  }
  w.done(); LINES.pin.obj.visible = c >= 0;
}

/* ---------------------------------------------------------------- cell marks over the surface colour */
function setMarks(fn) {
  for (let c = 0; c < NI * NJ; c++) {
    const m = fn ? fn(c) : null;
    if (m) { markData[c * 4] = m[0]; markData[c * 4 + 1] = m[1]; markData[c * 4 + 2] = m[2]; markData[c * 4 + 3] = m[3]; }
    else markData[c * 4 + 3] = 0;
  }
  markTex.needsUpdate = true;
}

/* ---------------------------------------------------------------- labels */
const LABELS = new Map();
function setLabel(key, text, pos, cls = '', vis = 'surf') {
  let L0 = LABELS.get(key);
  if (!L0) { const el = document.createElement('div'); el.className = 'lbl ' + cls; $('#labels').appendChild(el); L0 = { el, pos: new THREE.Vector3(), vis }; LABELS.set(key, L0); }
  if (L0.el.textContent !== text) L0.el.textContent = text;
  L0.pos.copy(pos); L0.vis = vis;
}
function dropLabels(prefix) { for (const [k, v] of LABELS) if (k.startsWith(prefix)) { v.el.remove(); LABELS.delete(k); } }
const _p = new THREE.Vector3(), _cd = new THREE.Vector3();
function updateLabels() {
  const el = $('#stage'), w = el.clientWidth, h = el.clientHeight;
  for (const [, L0] of LABELS) {
    let show = true;
    if (L0.vis === 'surf') { _cd.copy(camera.position).sub(L0.pos); show = L0.pos.clone().normalize().dot(_cd.normalize()) > 0.12; }
    else if (L0.vis && L0.vis.face != null) {
      const lo = L0.vis.lon * D2R, nrm = new THREE.Vector3(-Math.sin(lo), 0, -Math.cos(lo)).multiplyScalar(L0.vis.face === 0 ? 1 : -1);
      show = VIEW.cut && camera.position.clone().sub(L0.pos).dot(nrm) > 0;
    }
    _p.copy(L0.pos).project(camera);
    if (!show || _p.z > 1) { L0.el.style.display = 'none'; continue; }
    L0.el.style.display = '';
    L0.el.style.transform = `translate(${((_p.x + 1) / 2 * w).toFixed(1)}px, ${((1 - _p.y) / 2 * h).toFixed(1)}px) translate(-50%, -50%)`;
  }
}
function updateCutLabels() {
  dropLabels('lv:');
  if (!VIEW.cut) return;
  const [lon] = faceLons(), i = faceCols(0, lon);
  let jBest = -1, best = 1e9;
  for (let j = 0; j < NJ; j++) if (NLEV[j * NI + i] === 16 && Math.abs(LATC[j] - 8) < best) { best = Math.abs(LATC[j] - 8); jBest = j; }
  if (jBest < 0) for (let j = 0; j < NJ; j++) if (NLEV[j * NI + i] > 0 && Math.abs(LATC[j]) < best) { best = Math.abs(LATC[j]); jBest = j; }
  if (jBest < 0) return;
  /* three labels, stepped in latitude so they do not sit on one line when the face is seen from the side */
  const nl = NLEV[jBest * NI + i], show = [[16, 9], [8, 0], [1, -9]];
  for (const [k, dl] of show) {
    const n = 16 - k; if (n >= nl) continue;
    const t = `k ${k} · ${Math.round(DEPE[n])}–${Math.round(DEPE[n + 1])} m`;
    setLabel('lv:' + n, t, xyz(LATC[jBest] + dl, lon - 0.4, ocnR(n + 0.5)), 'lvl', { face: 0, lon });
  }
}

/* ================================================================ routines, in call order, with what the 3D view shows */
/* t title, r routine · source, d what it does, p parameters [name, value], zero: switched to zero in this config,
   fx: effects, surf: surface layer, cutO: section colour, cam: camera preset, dur: seconds at 1× */
const PROCS = {
  main: [
    { id: 'init1', t: L('Read the configuration', '读配置'), r: 'initialise_genie · genie.F:36–113', surf: 'depth', cam: 'globe',
      d: L('Base config + user config + the time steps runcookie.sh appends for 36 × 36 × 16: 96 ocean steps a year, BIOGEM every 2 ocean steps, SEDGEM every 96 (once a year).', '基础配置 + 用户配置 + runcookie.sh 按 36 × 36 × 16 追加的时间步：每年 96 个海洋步，BIOGEM 每 2 个海洋步一次，SEDGEM 每 96 个（每年一次）。'),
      p: [['ma_kocn_loop', '5'], ['ma_conv_kocn_kbiogem', '2'], ['ma_conv_kocn_ksedgem', '96']] },
    { id: 'init2', t: L('Build the grid', '建网格'), r: 'INITIALISE_GOLDSTEIN · initialise_goldstein.F:425–600', fx: { grid: 1 }, surf: 'depth', cam: 'globe',
      d: L('36 columns of 10° from 100°E (offset −260°), 36 rows equally spaced in sin(latitude), so every cell has the same area; 16 levels that thicken from 81 m at the top to 765 m at the floor (ez0 = 0.1, 5000 m).', '经向 36 列，每列 10°，从 100°E 起（偏移 −260°）；纬向 36 行按 sin(纬度) 等距，所以每个格点面积相同；垂直 16 层，从顶层 81 m 加厚到底层 765 m（ez0 = 0.1，总深 5000 m）。'),
      p: [['gm_par_grid_lon_offset', '−260'], ['go_par_dsc', '5000 m'], ['GOLDSTEINNLEVS', '16']] },
    { id: 'init3', t: L('Read the boundary conditions', '读边界条件'), r: 'initialise_goldstein.F:715 · initialise_embm.F:700–745, 900 · readroff.f', fx: { grid: 1, tau: 1, runoff: 1 }, surf: 'depth', cam: 'globe',
      d: L('worjh2.k1 (deepest wet level of each column; 91–94 on land give the runoff direction), wind stress, the EMBM advecting winds, the zonal albedo, the gas-exchange wind speed, the sediment depth and the island path. None of these change during the run.', 'worjh2.k1（各柱最深湿层；陆地上的 91–94 给出径流方向）、风应力、EMBM 平流风场、纬向反照率、气体交换风速、沉积物水深和岛屿路径。运行中这些都不变。') },
    { id: 'init4', t: L('Initial state', '初始状态'), r: 'initialise_*_wrapper · genie.F:36–113', fx: { halo: 1 }, cam: 'globe',
      d: L('A restart file, or uniform starting values from the CBSR base config: pCO₂ 278 ppm, DIC 2244 and ALK 2363 µmol kg⁻¹, PO₄ 2.16 µmol kg⁻¹, O₂ 170 µmol kg⁻¹.', '读 restart 文件，或用 CBSR 基础配置的均匀初值：pCO₂ 278 ppm，DIC 2244、ALK 2363 µmol kg⁻¹，PO₄ 2.16 µmol kg⁻¹，O₂ 170 µmol kg⁻¹。'),
      p: [['ac_atm_init_3', '278×10⁻⁶ atm'], ['bg_ocn_init_3', '2.244×10⁻³'], ['bg_ocn_init_12', '2.363×10⁻³'], ['bg_ocn_init_8', '2.159×10⁻⁶']] },
    { id: 'year', t: L('k = 11 … 479: the same cycle 47 more times', 'k = 11 … 479：同样的周期再走 47 轮'), r: 'genie.F:262–663 (main loop)', fx: { shell: 1, emWinds: 1, sun: 1, year: 1 }, surf: 'swabs', cam: 'globe', dur: 18,
      d: L('Fast-forward through the rest of the year: the insolation follows the season (from the orbit, no day and night); every module keeps its own clock.', '快进这一年剩下的步：日射随季节变化（由轨道算出，没有昼夜）；每个模块按自己的频率运行。') },
    { id: 'end', t: L('Save restarts and finish', '保存 restart 并结束'), r: '*_save_restart_wrapper · genie.F:881–1001', cam: 'globe',
      d: L('ECOGEM, BIOGEM, ATCHEM, SEDGEM and ROKGEM each write a restart; a long spin-up is usually saved here and perturbation runs start from it.', 'ECOGEM、BIOGEM、ATCHEM、SEDGEM 和 ROKGEM 各自写 restart；通常长时间 spin-up 在这里保存，扰动试验从它开始。') },
  ],
  surflux: [
    { id: 's1', t: L('Insolation for this step', '本步的日射'), r: 'solfor(j, istep) · radfor.F', fx: { sun: 1 }, surf: 'insol', cam: 'sun',
      d: L('Daily-mean insolation for each latitude row, from the orbit (e = 0.0167, sin ε = 0.3978, ϖ = 102.92°) and S₀ = 1368 W m⁻². There is no diurnal cycle: cGENIE never sees day and night. This is where an orbital change enters the model.', '每个纬度行的日平均日射，由轨道（e = 0.0167，sin ε = 0.3978，ϖ = 102.92°）和 S₀ = 1368 W m⁻² 算出。没有日变化：cGENIE 不区分昼夜。轨道变化就是从这里进入模式的。'),
      p: [['ea_par_orbit_osce', '0.0167'], ['ea_par_orbit_oscsob', '0.397789'], ['ea_par_orbit_oscgam', '102.92'], ['ma_genie_solar_constant', '1368']] },
    { id: 's2', t: L('Precipitation', '降水'), r: 'SURFLUX · surflux.F:700–755', fx: { shell: 1, spikes: 'rain' }, surf: 'insol',
      d: L('Humidity above rmax × saturation (rmax = 0.85) falls out at once as precipitation, and its latent heat warms the air. There are no clouds. Drops: falls from the EMBM layer, positions only schematic (they depend on q, a model state not shown).', '超过 rmax × 饱和比湿（rmax = 0.85）的水汽立即降落，潜热加热空气。没有云。雨滴从 EMBM 层落下，位置只是示意（取决于未显示的模式状态 q）。'),
      p: [['rmax', '0.85']] },
    { id: 's3', t: L('Shortwave', '短波'), r: 'SURFLUX · surflux.F:756–799', surf: 'swabs',
      d: L('Absorbed shortwave = insolation × (1 − albedo), with the zonal planetary albedo read from worjh2.albd.dat (over sea ice it is changed later).', '吸收短波 = 日射 × (1 − 反照率)，反照率是从 worjh2.albd.dat 读入的纬向行星反照率（海冰上稍后再改）。'),
      p: [['ea_par_albedo1d_name', 'worjh2.albd.dat']] },
    { id: 's4', t: L('Outgoing longwave and CO₂', '出射长波与 CO₂'), r: 'SURFLUX · surflux.F:800–853', fx: { shell: 1, spikes: 'olr' }, surf: 'swabs',
      d: L('OLR is a polynomial in air temperature and humidity, minus delf2x · ln(CO₂ / CO₂₀) (delf2x = 5.77 W m⁻²). With ea_36 = n, which is the default, the CO₂ used here stays at the reference value whatever ATCHEM does.', 'OLR 是气温和湿度的多项式，再减去 delf2x · ln(CO₂ / CO₂₀)（delf2x = 5.77 W m⁻²）。默认 ea_36 = n，这里用的 CO₂ 一直是参考值，不管 ATCHEM 算出多少。'),
      p: [['ea_36', 'n'], ['ea_delf2x', '5.77']] },
    { id: 's5', cut: false, t: L('Over sea ice', '海冰上'), r: 'SURFLUX · surflux.F:882–1043', fx: { iceGrid: 1 }, cam: 'npole',
      d: L('Where there is ice: iterate for the ice-surface temperature, then sensible heat, sublimation and the conductive flux through the ice. The resulting growth and melt rates go to the sea-ice module. Tinted: every ocean cell is checked; cells without ice skip this.', '有冰的地方：迭代求冰面温度，再算感热、升华和穿过冰层的传导热通量；得到的增长和融化率交给海冰模块。着色：检查每个海洋格点，没有冰的格点跳过。') },
    { id: 's6', t: L('Over open ocean', '开阔海面上'), r: 'SURFLUX · surflux.F:1044–1118', fx: { shell: 1, spikes: 'both' },
      d: L('Sensible heat and evaporation from bulk formulae, then the net heat into the atmosphere. Orange up: heat to the air; green down: what the air gives back.', '用整体公式算感热和蒸发，再得到进入大气的净热量。橙色向上：海洋给空气的热量；绿色向下：空气返回的部分。') },
    { id: 's7', t: L('Fluxes for the ocean', '给海洋的通量'), r: 'SURFLUX · surflux.F:1119–1174', fx: { spikes: 'down' },
      d: L('Net heat into the ocean (including ice growth over open water) and freshwater P − E for GOLDSTEIN; they are used for the next 5 master steps.', '进入海洋的净热量（含开阔水面上的结冰）和淡水 P − E，交给 GOLDSTEIN；之后 5 个主时间步都用它们。') },
    { id: 's8', cut: false, t: L('Over land', '陆地上'), r: 'SURFLUX · surflux.F:1175–1210', fx: { land: 1 },
      d: L('Land has no heat capacity here: its surface fluxes balance at once and the heat goes into the air above it.', '这里陆地没有热容：地表通量立即平衡，热量进入其上的空气。') },
    { id: 's9', cut: false, t: L('Runoff to the coast', '径流入海'), r: 'SURFLUX · surflux.F:1211–1222, 1543', fx: { runoff: 1 }, surf: 'basins', cam: 'africa',
      d: L('Precipitation on land is moved, unchanged, to one coastal ocean cell along the routes coded in worjh2.k1 (91 east, 92 south, 93 west, 94 north), traced once by readroff.f.', '陆地上的降水原样搬到一个沿海格点，路线由 worjh2.k1 中的编码给出（91 东、92 南、93 西、94 北），由 readroff.f 在启动时追一次。') },
  ],
  embm: [
    { id: 'a1', t: L('Add the surface fluxes', '加入地表通量'), r: 'TSTIPA · embm.F:196 (tstipa.f)', fx: { shell: 1, spikes: 'up' }, surf: 'uatm', cam: 'globe',
      d: L('The heat and moisture fluxes from surflux enter T and q of the single atmospheric layer as source terms. The same fluxes are reused for 5 master steps.', 'surflux 算出的热量和水汽通量作为源项进入单层大气的 T 和 q。同一组通量连用 5 个主时间步。') },
    { id: 'a2', t: L('Advect and diffuse T and q', '平流和扩散 T、q'), r: 'TSTIPA · tstipa.f (iterative implicit)', fx: { shell: 1, emWinds: 1 }, surf: 'uatm',
      d: L('Implicit 2-D advection by the prescribed winds (uncep / vncep) and diffusion (T 5.2×10⁶, q 1.17×10⁶ m² s⁻¹, larger in the tropics). There is no momentum equation, so the winds never change.', '用给定风场（uncep / vncep）做隐式二维平流，加扩散（T 5.2×10⁶、q 1.17×10⁶ m² s⁻¹，热带更大）。没有动量方程，所以风场一直不变。'),
      p: [['ea_12', '5.2×10⁶'], ['ea_13', '1.17×10⁶'], ['ea_adv_u / v', 'uncep / vncep.silo'], ['ea_diffa_scl', '0.25']] },
  ],
  seaice: [
    { id: 'i1', cut: false, t: L('Take the growth rates', '取得增长率'), r: 'GOLD_SEAICE · gold_seaice.F:100–115', fx: { iceGrid: 1 }, cam: 'npole',
      d: L('Copy the thickness and cover tendencies that surflux computed at k = 1 (or 6), and the ocean surface velocity.', '复制 surflux 在 k = 1（或 6）算出的冰厚和覆盖率倾向，以及海洋表层流速。') },
    { id: 'i2', cut: false, t: L('Grow, drift, diffuse', '增长、漂移、扩散'), r: 'TSTIPSIC / TSTEPSIC · gold_seaice.F:143–148', fx: { iceGrid: 1 }, cam: 'spole',
      d: L('Add the thermodynamic change, advect thickness and cover with the ocean surface current, and diffuse them (gs_11 = 3574 m² s⁻¹). No rheology.', '加上热力学变化，用海洋表层流平流冰厚和覆盖率，再做扩散（gs_11 = 3574 m² s⁻¹）。没有冰流变学。'),
      p: [['gs_11', '3573.7'], ['ma_ksic_loop', '5']] },
    { id: 'i3', cut: false, t: L('Limits and fluxes to the ocean', '限值与给海洋的通量'), r: 'GOLD_SEAICE · gold_seaice.F:160–200', fx: { iceGrid: 1, spikes: 'down' }, cam: 'npole',
      d: L('Keep the cover between 0 and 1; ice thinner than hmin is removed, and its heat and freshwater are handed to GOLDSTEIN together with the freezing and melting fluxes.', '把覆盖率限制在 0–1；薄于 hmin 的冰被去掉，它的热量和淡水连同冻融通量一起交给 GOLDSTEIN。') },
  ],
  goldstein: [
    { id: 'o1', t: L('Surface boundary fluxes', '表层边界通量'), r: 'GOLDSTEIN · goldstein.F:256–318', fx: { top: 1, spikes: 'down' }, cam: 'atl', cutO: 'levels',
      d: L('Net heat (shortwave + sensible + longwave + latent + ice) and freshwater (P + E + runoff + ice) become fluxes through the top of cell k = 16. Freshwater acts as a virtual salt flux: with a rigid lid the volume never changes.', '净热量（短波 + 感热 + 长波 + 潜热 + 海冰）和淡水（P + E + 径流 + 海冰）成为通过 k = 16 顶面的通量。淡水作为虚盐通量：刚盖近似下体积不变。') },
    { id: 'o2', t: L('Take BIOGEM’s tracers', '取回 BIOGEM 的示踪物'), r: 'GOLDSTEIN · goldstein.F:322–346', fx: { pulse: '#93C45A', allLev: '#93C45A' },
      d: L('Copy in all 14 tracers, including the increments BIOGEM made at its last call, and fill the periodic east–west halo.', '复制全部 14 个示踪物（含 BIOGEM 上次调用做的增量），并填好东西向周期边界。'),
      p: [['GOLDSTEINNTRACS', '14']] },
    { id: 'o3', t: L('Wind forcing', '风应力强迫'), r: 'WIND · goldstein.F:427 (wind.f)', fx: { tau: 1 }, surf: 'tau',
      d: L('The prescribed wind stress, scaled by go_13 = 1.531, becomes the forcing of the depth-integrated flow. It was read once at start-up and does not respond to climate.', '给定风应力乘以 go_13 = 1.531，成为深度积分流的强迫。它在启动时读入一次，不随气候变化。'),
      p: [['go_13', '1.531'], ['ea_taux_u …', 'taux_u.interp …']] },
    { id: 'o4', t: L('JEBAR term', 'JEBAR 项'), r: 'JBAR · goldstein.F:428 (jbar.f)', fx: { slope: 1 }, surf: 'depth',
      d: L('The joint effect of baroclinicity and relief: density gradients over a sloping floor also drive the depth-integrated flow. Marked: columns whose floor differs from a neighbour by four levels or more.', '斜压与地形的联合效应（JEBAR）：倾斜海底上的密度梯度也驱动深度积分流。标记：与相邻格点海底相差 ≥ 4 层的柱子。') },
    { id: 'o5', t: L('Barotropic streamfunction', '正压流函数'), r: 'UBARSOLV · goldstein.F:429 (ubarsolv.f)', fx: { pulse: '#35B6C2' },
      d: L('Solve the elliptic equation for the barotropic streamfunction ψ with the matrix factorised at start-up (rigid lid, one solve per step for the whole ocean).', '用启动时分解好的矩阵求解正压流函数 ψ 的椭圆方程（刚盖，每步对整个海洋解一次）。') },
    { id: 'o6', cut: false, t: L('Flow around the island', '绕岛环流'), r: 'ISLAND · goldstein.F:430–466 (island.f)', fx: { path: 1 }, surf: 'islands', cam: 'so',
      d: L('ψ on Antarctica, the one island in worjh2.psiles, is fixed by a path integral around it: 36 cells along row j = 3 (worjh2.paths). This sets how much water passes through Drake Passage.', 'ψ 在南极（worjh2.psiles 中唯一的岛）上的值由绕它的路径积分确定：沿第 j = 3 行的 36 个格点（worjh2.paths）。它决定了通过德雷克海峡的水量。') },
    { id: 'o7', t: L('3-D velocity', '三维流速'), r: 'VELC · goldstein.F:475 (velc.f)', fx: { allLev: '#35B6C2' },
      d: L('Frictional-geostrophic velocities on all 16 levels: the thermal wind from the density field plus the barotropic part. Friction (drag time 2.71 days) stands in for momentum advection, which is left out.', '16 层上的摩擦地转流速：由密度场得到的热成风，加上正压部分。用摩擦（拖曳时间 2.71 天）代替被略去的动量平流。'),
      p: [['go_16', '2.71 d']] },
    { id: 'o8', t: L('Transport of all tracers', '所有示踪物的输运'), r: 'TSTEPO_FLUX · tstepo.F:88 (tstepo_flux.F)', fx: { kSweep: 1 }, dur: 9,
      d: L('Upstream-weighted advection, isopycnal diffusion (go_14 = 1494 m² s⁻¹) and vertical diffusion (go_15 = 2.5×10⁻⁵ m² s⁻¹) for T, S and the 12 biogeochemical tracers, level by level.', '对 T、S 和 12 个生物地球化学示踪物逐层做迎风加权平流、等密度面扩散（go_14 = 1494 m² s⁻¹）和垂直扩散（go_15 = 2.5×10⁻⁵ m² s⁻¹）。'),
      p: [['go_14', '1494'], ['go_15', '2.5×10⁻⁵']] },
    { id: 'o9', t: L('Convective adjustment', '对流调整'), r: 'CO · tstepo.F:190 (co.F)', fx: { colSweep: 'conv' }, dur: 10,
      d: L('Every column is checked for static instability (j outer loop, i inner); unstable cells are mixed downward until the column is stable.', '逐柱检查静力不稳定（外层循环 j，内层 i）；不稳定的格点向下混合，直到整柱稳定。') },
    { id: 'o10', t: L('Density and halo', '密度与边界'), r: 'EOS · tstepo.F:193–234', fx: { pulse: '#35B6C2', allLev: '#35B6C2' },
      d: L('Density from the new T and S, and the periodic east–west boundary for the next step.', '由新的 T、S 算密度，并为下一步填好东西向周期边界。') },
  ],
  rokgem: [
    { id: 'g1', cut: false, t: L('Global-average weathering', '全球平均风化'), r: 'SUB_GLOB_AVG_WEATH · rokgem.f90:68', fx: { land: 1, runoff: 1 }, surf: 'basins', cam: 'africa',
      zero: L('zero in CBSR BASES (rg_par_weather_* = 0)', 'CBSR BASES 中为零（rg_par_weather_* = 0）'),
      d: L('par_weathopt = Global_avg: one global carbonate and one silicate weathering flux, delivered to the coastal cells that receive runoff. Both, and volcanic outgassing, are zero in this base config.', 'par_weathopt = Global_avg：一个全球碳酸盐风化通量和一个硅酸盐风化通量，送到接收径流的沿海格点。本基础配置中二者以及火山排气都为零。'),
      p: [['rg_par_weather_CaCO3', '0.0'], ['rg_par_weather_CaSiO3', '0.0'], ['rg_par_outgas_CO2', '0.0']] },
    { id: 'g2', cut: false, t: L('Fluxes to ATCHEM and BIOGEM', '给 ATCHEM 和 BIOGEM 的通量'), r: 'CPL_FLUX_ROKATM / ROKOCN · genie.F:476–479', fx: { coast: 1, halo: 1 },
      d: L('CO₂ consumed by weathering goes to ATCHEM; ALK, DIC and Ca reach the coastal ocean cells (marked), where BIOGEM adds them.', '风化消耗的 CO₂ 交给 ATCHEM；ALK、DIC 和 Ca 进入沿海格点（标记处），由 BIOGEM 加入。') },
  ],
  biogem: [
    { id: 'b0', t: L('Forcings', '强迫'), r: 'BIOGEM_FORCING · genie.F:554', cam: 'pac', cutO: 'poc',
      d: L('Apply any prescribed forcings before the step (none in this base config).', '在本步之前施加给定的强迫（本基础配置中没有）。') },
    { id: 'b1', t: L('DOM remineralisation', 'DOM 再矿化'), r: 'SUB_BOX_REMIN_DOM · biogem.f90:800', fx: { pulse: '#93C45A', allLev: '#93C45A' },
      d: L('Dissolved organic matter decays back to PO₄ and DIC with a 0.5-year lifetime, in every wet cell.', '溶解有机物以 0.5 年的寿命在每个湿格点中分解回 PO₄ 和 DIC。'),
      p: [['bg_par_bio_remin_DOMlifetime', '0.5 yr']] },
    { id: 'b2', t: L('Particle remineralisation', '颗粒物再矿化'), r: 'SUB_BOX_REMIN_PART · biogem.f90:805', fx: { sink: 'poc' }, cutO: 'poc', dur: 6,
      d: L('The last export is spread down each column within this same step: POC as 0.95 · e^(−Δz / 500 m) + 0.05; CaCO₃ with 1000 m and half refractory. Whatever reaches the floor is rain for SEDGEM (orange ticks).', '上一次的输出在同一步内沿柱子向下分配：POC 按 0.95 · e^(−Δz / 500 m) + 0.05；CaCO₃ 用 1000 m，且一半难分解。到达海底的部分成为 SEDGEM 的沉降（橙色短线）。'),
      p: [['bg_par_bio_remin_POC_eL1', '500 m'], ['bg_par_bio_remin_POC_frac2', '0.05'], ['bg_par_bio_remin_CaCO3_eL1', '1000 m'], ['bg_par_bio_remin_CaCO3_frac2', '0.5']] },
    { id: 'b3', t: L('Carbonate chemistry', '碳酸盐化学'), r: 'SUB_CALC_CARBCONST / SUB_CALC_CARB · biogem.f90:871–925', fx: { colSweep: 'carb' }, dur: 10,
      d: L('For each wet column (i outer loop, j inner): dissociation constants from T, S and pressure, then pH, CO₃²⁻, Ω and pCO₂ from DIC and ALK. With ctrl_carbchemupdate_full = .false. only the surface cell is updated every call.', '对每个湿柱（外层循环 i，内层 j）：由 T、S 和压力算解离常数，再由 DIC、ALK 算 pH、CO₃²⁻、Ω 和 pCO₂。ctrl_carbchemupdate_full = .false.，所以每次只更新表层格点。'),
      p: [['ctrl_carbchemupdate_full', '.false.']] },
    { id: 'b4', t: L('Solubility and piston velocity', '溶解度与活塞速度'), r: 'SUB_CALC_SOLCONST / SUB_CALC_PV · biogem.f90:1042–1044', surf: 'windspeed',
      d: L('Gas solubility from SST and SSS; the piston velocity from the prescribed wind speed (windspeed.dat), not from EMBM.', '由 SST 和 SSS 算气体溶解度；活塞速度用给定风速（windspeed.dat），而不是 EMBM 的风。'),
      p: [['bg_par_windspeed_file', 'windspeed.dat'], ['bg_ctrl_force_windspeed', '.true.']] },
    { id: 'b5', t: L('Air–sea gas exchange', '海气气体交换'), r: 'FUN_CALC_OCNATM_FLUX · biogem.f90:1858 (biogem_box.f90:148)', fx: { spikes: 'gas', halo: 1 }, surf: 'windspeed',
      d: L('Flux = k(wind) · (pCO₂ air − pCO₂ ocean) · (1 − ice cover), with a = 0.310; the same for O₂. The fluxes are booked for ATCHEM.', '通量 = k(风速) · (大气 pCO₂ − 海洋 pCO₂) · (1 − 海冰覆盖)，a = 0.310；O₂ 同理。通量记账交给 ATCHEM。'),
      p: [['bg_par_gastransfer_a', '0.310']] },
    { id: 'b6', cut: false, t: L('Weathering input', '风化输入'), r: 'BIOGEM · biogem.f90:1942', fx: { coast: 1 }, surf: 'basins',
      d: L('ROKGEM’s river input (zero in this config) is added to the coastal surface cells that receive runoff.', 'ROKGEM 的河流输入（本配置为零）加到接收径流的沿海表层格点。') },
    { id: 'b7', t: L('Surface productivity', '表层生产力'), r: 'SUB_CALC_BIO · biogem.f90:2006 (biogem_box.f90:391–430)', fx: { top: 1, sun: 1 }, surf: 'insol',
      d: L('PO₄ uptake in the top cell (80.8 m) = 2 µmol kg⁻¹ yr⁻¹ × PO₄ / (PO₄ + 0.05 µmol kg⁻¹) × light × (1 − ice). Light follows the insolation shown. 66 % goes to DOM; the rest is exported as POC with CaCO₃.', '顶层格点（80.8 m）的 PO₄ 吸收 = 2 µmol kg⁻¹ yr⁻¹ × PO₄ / (PO₄ + 0.05 µmol kg⁻¹) × 光照 × (1 − 海冰)。光照随图中日射变化。66 % 进入 DOM，其余以 POC 和 CaCO₃ 形式输出。'),
      p: [['bg_par_bio_k0_PO4', '2.0×10⁻⁶'], ['bg_par_bio_c0_PO4', '0.05×10⁻⁶'], ['bg_par_bio_red_DOMfrac', '0.66'], ['bg_par_bio_zc', '75 m']] },
    { id: 'b8', t: L('Hand tracers to GOLDSTEIN', '把示踪物交给 GOLDSTEIN'), r: 'BIOGEM_TRACERCOUPLING · genie.F:556 (biogem.f90:2288)', fx: { pulse: '#35B6C2' },
      d: L('Write the increments into the shared tracer array; GOLDSTEIN moves them on its next step.', '把增量写进共用的示踪物数组；GOLDSTEIN 下一步再输运它们。') },
    { id: 'b9', t: L('Copy the ocean physics', '复制海洋物理场'), r: 'BIOGEM_CLIMATE · genie.F:557 (biogem.f90:2739)',
      d: L('Take T, S, velocities, ice cover and insolation for the next BIOGEM call.', '为下次 BIOGEM 调用复制 T、S、流速、海冰覆盖和日射。') },
    { id: 'b10', t: L('Diagnostics', '诊断输出'), r: 'DIAG_BIOGEM_TIMESLICE / TIMESERIES · genie.F:561–566',
      d: L('Accumulate the time-slice and time-series output (fields_biogem_*.nc, biogem_series_*.res).', '累积时间切片和时间序列输出（fields_biogem_*.nc、biogem_series_*.res）。') },
    { id: 'b11', t: L('Fluxes to ATCHEM and SEDGEM', '给 ATCHEM 和 SEDGEM 的通量'), r: 'CPL_FLUX_OCNATM / OCNSED · CPL_COMP_OCNSED · genie.F:568–570', fx: { halo: 1, floor: 1, sink: 'poc' },
      d: L('Air–sea fluxes are added to ATCHEM’s running sum; particle rain and bottom-water chemistry to SEDGEM’s, which settles them once a year.', '海气通量加到 ATCHEM 的累计中；颗粒沉降和底层水化学加到 SEDGEM 的累计中，由它每年结算一次。') },
  ],
  atchem: [
    { id: 'c1', t: L('Chemistry in the air', '大气中的化学'), r: 'ATCHEM · atchem.f90:38–128', fx: { halo: 1 }, cam: 'globe',
      d: L('CH₄ oxidation, radioactive decay and an optional terrestrial carbon reservoir. This base config carries only CO₂, δ¹³C, O₂ and H₂S, so little happens here.', 'CH₄ 氧化、放射性衰变和可选的陆地碳库。本基础配置只有 CO₂、δ¹³C、O₂ 和 H₂S，所以这里几乎不做什么。') },
    { id: 'c2', t: L('Update and mix', '更新并混合'), r: 'ATCHEM · atchem.f90:129–146', fx: { halo: 1, mix: 1 },
      d: L('Composition += the accumulated air–sea and weathering fluxes × time step; then every grid cell gets the global mean: the atmosphere is one well-mixed box.', '成分 += 累计的海气和风化通量 × 时间步；然后每个格点都取全球平均：大气是一个充分混合的箱子。') },
    { id: 'c3', t: L('Interface arrays', '接口数组'), r: 'ATCHEM · atchem.f90:147–168', fx: { halo: 1 } },
    { id: 'c4', t: L('Hand on pCO₂', '传出 pCO₂'), r: 'CPL_COMP_EMBMATM / ATMOCN / ATMLND · genie.F:586–588', fx: { halo: 1, spikes: 'down' },
      d: L('pCO₂ goes to BIOGEM for the next gas exchange, and to surflux’s radiation only if ea_36 = y (it is n by default). CO₂ is an output of the model here, not an input.', 'pCO₂ 交给 BIOGEM 用于下次气体交换；只有 ea_36 = y 时才进入 surflux 的辐射（默认是 n）。这里 CO₂ 是模式的输出，不是输入。'),
      p: [['ea_36', 'n']] },
  ],
  sedgem: [
    { id: 'd1', t: L('Masks and units', '掩膜与单位'), r: 'SEDGEM · sedgem.f90:99–141', fx: { floor: 1 }, surf: 'sedDepth', cam: 'pac', cutO: 'levels' },
    { id: 'd2', t: L('Bottom-water means', '底层水年平均'), r: 'SEDGEM · sedgem.f90:142–149', fx: { floor: 1, bottom: 1 },
      d: L('Average the year’s bottom-water composition, booked by BIOGEM at every call.', '对一年中 BIOGEM 每次记账的底层水成分求平均。') },
    { id: 'd3', t: L('Bottom-water carbonate chemistry', '底层水碳酸盐化学'), r: 'SUB_CALC_CARB · sedgem.f90:150–218', fx: { floor: 1, bottom: 1 } },
    { id: 'd4', t: L('Early diagenesis', '早期成岩'), r: 'SEDGEM · sedgem.f90:219–345', fx: { floor: 1, colSweep: 'sed' }, surf: 'sedDepth', dur: 10,
      d: L('For each sediment cell (i outer loop, j inner): from bottom-water CO₃²⁻ and the POC rain, decide how much CaCO₃ is preserved or dissolved; add the year’s layer and bury the excess. Depth comes from the sediment grid (worjh2_topo.36x36), not from the 16 levels.', '对每个沉积物格点（外层循环 i，内层 j）：由底层水 CO₃²⁻ 和 POC 沉降决定 CaCO₃ 保存或溶解多少；加上这一年的沉积层并埋藏多余部分。水深取自沉积物网格（worjh2_topo.36x36），而不是 16 个模式层。') },
    { id: 'd5', t: L('Hydrothermal input', '热液输入'), r: 'SEDGEM · sedgem.f90:540', fx: { floor: 1 }, zero: L('zero by default', '默认为零'),
      d: L('Hydrothermal and seafloor-alteration fluxes (par_sed_hydroip_* = 0 by default).', '热液与海底蚀变通量（默认 par_sed_hydroip_* = 0）。') },
    { id: 'd6', t: L('Return the dissolution flux', '返回溶解通量'), r: 'SEDGEM · sedgem.f90:767 · CPL_FLUX_SEDOCN · genie.F:660–663', fx: { floor: 1, bottom: 1 },
      d: L('Dissolution fluxes go back to BIOGEM and are added over the next year; buried material leaves the system for good.', '溶解通量返回 BIOGEM，在下一年内加入；被埋藏的物质永久离开系统。') },
  ],
};
const procOf = (mod, p) => (PROCS[mod] || []).find(x => x.id === p);
const procNum = (mod, p) => (PROCS[mod] || []).findIndex(x => x.id === p) + 1;
const DEF = {   /* module defaults: surface layer, effects, camera */
  surflux: { surf: 'insol', cam: 'globe' }, embm: { surf: 'uatm', cam: 'globe', fx: { shell: 1, emWinds: 1 } },
  seaice: { surf: 'depth', cam: 'npole', fx: { iceGrid: 1 }, cut: false }, goldstein: { surf: 'depth', cam: 'atl', cutO: 'levels' },
  rokgem: { surf: 'basins', cam: 'africa', fx: { runoff: 1 }, cut: false }, biogem: { surf: 'insol', cam: 'pac', cutO: 'poc' },
  atchem: { surf: 'depth', cam: 'globe', fx: { halo: 1 } }, sedgem: { surf: 'sedDepth', cam: 'pac', fx: { floor: 1 }, cutO: 'levels' }, main: { surf: 'depth', cam: 'globe', cutO: 'levels' },
};

/* ================================================================ schedule */
const FIRST = { surflux: 1, embm: 1, seaice: 5, goldstein: 5, rokgem: 10, biogem: 10, atchem: 10, sedgem: 480 };
const runsAt = (mod, k) => mod === 'embm' || (mod === 'surflux' && k % 5 === 1) || ((mod === 'seaice' || mod === 'goldstein') && k % 5 === 0)
  || ((mod === 'rokgem' || mod === 'biogem' || mod === 'atchem') && k % 10 === 0) || (mod === 'sedgem' && k % 480 === 0);
const MACRO = [{ kind: 'init' }];
for (let k = 1; k <= 10; k++) MACRO.push({ kind: 'k', k });
MACRO.push({ kind: 'loop' }, { kind: 'k', k: 480 }, { kind: 'end' });
function stagesOf(m, detail) {
  const out = [];
  if (m.kind === 'init') { ['init1', 'init2', 'init3', 'init4'].forEach(p => out.push({ mod: 'main', p })); return out; }
  if (m.kind === 'loop') return [{ mod: 'main', p: 'year' }];
  if (m.kind === 'end') return [{ mod: 'main', p: 'end' }];
  for (const mod of ORDER) {
    if (!runsAt(mod, m.k)) continue;
    if (detail || FIRST[mod] === m.k) PROCS[mod].forEach(q => out.push({ mod, p: q.id }));
    else out.push({ mod, p: 'all' });
  }
  return out;
}
function cardOf(m, st) {
  if (m.kind === 'init') return 0; if (m.kind === 'loop') return 12; if (m.kind === 'end') return 14;
  const k = m.k;
  switch (st.mod) {
    case 'surflux': return k === 1 ? 1 : 6;
    case 'embm': return k === 1 ? 2 : (k <= 5 ? 3 : 7);
    case 'seaice': return k === 5 ? 4 : 7;
    case 'goldstein': return k === 5 ? 5 : 7;
    case 'rokgem': return 8;
    case 'biogem': return ['b8', 'b9', 'b10', 'b11'].includes(st.p) ? 10 : 9;
    case 'atchem': return 11;
    case 'sedgem': return 13;
  }
  return 0;
}
const P = { mi: 0, si: 0, t: 0, playing: false, speed: 1, detail: false, list: [] };
const curMacro = () => MACRO[P.mi];
function durOf(st) {
  if (st.p === 'all') return 1.4;
  const q = procOf(st.mod, st.p);
  return (q && q.dur) || 3.6;
}
function stageFrac() { const n = P.list.length, d = durOf(P.list[P.si]); return clamp((P.si + P.t / d) / Math.max(n, 1), 0, 0.999); }
function stageDay() {
  const m = curMacro();
  if (m.kind === 'init') return 0;
  if (m.kind === 'end') return 365.25;
  if (m.kind === 'loop') { const f = clamp(P.t / durOf(P.list[0]), 0, 1); return (10 + f * 469) * DAYK; }
  return (m.k - 1 + stageFrac()) * DAYK;
}
function presetOf(st) {
  const base = DEF[st.mod] || DEF.main;
  if (st.p === 'all') return Object.assign({}, base, { fx: Object.assign({}, base.fx || {}) });
  const q = procOf(st.mod, st.p) || {};
  return { surf: q.surf || base.surf, cam: q.cam || base.cam, cutO: q.cutO || base.cutO, fx: Object.assign({}, base.fx || {}, q.fx || {}), procCam: !!q.cam, cut: q.cut != null ? q.cut : base.cut };
}

/* ================================================================ camera */
const CAM = {
  globe: [18, 340, 6.4], atl: [8, 330, 6.0], pac: [5, 195, 6.0], npole: [70, 330, 5.6], spole: [-68, 300, 5.6], so: [-48, 290, 5.8],
  africa: [8, 20, 5.8], indian: [-10, 80, 5.8],
};
function camTo(lat, lon, d) {
  const p = xyz(lat, lon, d);
  if (!VIEW.autoCam) return;
  if (REDUCED) { camera.position.copy(p); return; }
  CAMTWEEN = { from: camera.position.clone(), to: p, t: 0, dur: 1.3 };
}
function applyCam(key) {
  if (!key) return;
  let [lat, lon, d] = CAM[key] || CAM.globe;
  if (key === 'sun') { lat = clamp((ORBNOW ? ORBNOW.decl : 0) * 0.8, -30, 30) + 8; lon = 340; d = 6.0; }
  const polar = Math.abs(lat) > 60;
  if (VIEW.cutFollow && !polar && VIEW.cut) VIEW.cutLon = Math.round(wrap360(lon) / 10) * 10 % 360;   /* the western face sits at the focus */
  const camLon = polar || !VIEW.cut ? lon : wrap360(faceLons()[0] + Math.max(VIEW.cutW - 16, VIEW.cutW / 2));
  camTo(clamp(polar || !VIEW.cut ? lat : lat * 0.5 + 10, -78, 78), camLon, d);
}

/* ================================================================ apply a stage */
const FX = {};
let CUR = { st: null, lastMod: null, loop: '', sweep: -1 };
function go(mi, si) {
  P.mi = clamp(mi, 0, MACRO.length - 1);
  P.list = stagesOf(curMacro(), P.detail);
  P.si = si < 0 ? P.list.length - 1 : clamp(si, 0, P.list.length - 1);
  P.t = 0;
  applyStage(); renderTimeline(); renderChips(); renderPanel(); renderHud();
}
function setStage(si) { P.si = si; P.t = 0; applyStage(); renderChips(); renderPanel(); renderHud(); }
function applyStage() {
  const st = P.list[P.si], pre = presetOf(st), modChanged = CUR.lastMod !== st.mod;
  CUR = { st, lastMod: st.mod, loop: '', sweep: -1 };
  MODEL_DAY = stageDay(); ORBNOW = orbitAt(MODEL_DAY);
  for (const k of Object.keys(FX)) delete FX[k];
  Object.assign(FX, pre.fx);
  if (VIEW.follow) {
    VIEW.surf = pre.surf || VIEW.surf;
    VIEW.shell = !!(FX.shell || ['up', 'olr', 'rain', 'both', 'gas'].includes(FX.spikes));
    VIEW.emWinds = !!FX.emWinds; VIEW.halo = !!FX.halo; VIEW.tauP = !!FX.tau; VIEW.runoff = !!FX.runoff; VIEW.path = !!FX.path; VIEW.grid = !!FX.grid;
    if (pre.cutO) VIEW.cutO = pre.cutO;
    VIEW.cut = pre.cut !== false;
  }
  const short = st.p === 'all';
  if (!short && (modChanged || pre.procCam)) applyCam(pre.cam);
  refreshAll();
  syncLayers();
}
let LAST_SURF = '', LAST_DAYKEY = -1, CUTKEY = '';
const SPK = { mode: '' };
function refreshAll() {
  ORBNOW = orbitAt(MODEL_DAY);
  const s = SURF[VIEW.surf] || SURF.depth, dayKey = s.timed ? Math.round(MODEL_DAY / (365.25 / 96)) : -1;
  if (VIEW.surf !== LAST_SURF || dayKey !== LAST_DAYKEY) { fillSurface(s, surfData); surfTex.needsUpdate = true; LAST_SURF = VIEW.surf; LAST_DAYKEY = dayKey; }
  const g = OBJ.globe.material.uniforms;
  g.uGrid.value = VIEW.grid ? 1 : 0;
  SHARED.uCut.value.set(VIEW.cut ? 1 : 0, faceLons()[0], wrap360(faceLons()[1] - faceLons()[0]) || 360);
  /* marks */
  const C = h => hex3(h);
  if (FX.land) setMarks(c => isWet(c) ? null : [...C('#C99A5B'), 150]);
  else if (FX.coast) setMarks(c => FLD.coast.has(c) ? [...C('#E7B04C'), 230] : null);
  else if (FX.slope) setMarks(c => FLD.slope[c] ? [...C('#E7B04C'), 200] : null);
  else if (FX.iceGrid) setMarks(c => isWet(c) ? [...C('#DDE6FA'), Math.abs(LATC[Math.floor(c / NI)]) > 45 ? 120 : 45] : null);
  else if (FX.path) setMarks(c => FLD.island[c] ? [...C('#F06BB4'), 170] : null);
  else setMarks(null);
  /* objects */
  OBJ.embm.visible = VIEW.shell; OBJ.embm.material.uniforms.uGrid.value = VIEW.grid ? 1 : 0; OBJ.embm.material.uniforms.uOpacity.value = 0.12;
  OBJ.atchem.visible = OBJ.atchemGlow.visible = VIEW.halo; OBJ.atchem.material.uniforms.uOpacity.value = 0.06; OBJ.atchem.material.uniforms.uPatch.value = 0;
  FLOW.tau.obj.visible = VIEW.tauP; FLOW.wind.obj.visible = VIEW.emWinds;
  LINES.runoff.obj.visible = VIEW.runoff; if (VIEW.runoff && !LINES.runoff.built) { buildRunoff(); LINES.runoff.built = true; }
  LINES.path.obj.visible = VIEW.path; if (VIEW.path && !LINES.path.built) { buildPath(); LINES.path.built = true; }
  LINES.spikes.obj.visible = !!FX.spikes; if (FX.spikes && SPK.mode !== FX.spikes) { buildSpikes(FX.spikes); SPK.mode = FX.spikes; }
  OBJ.sun.visible = !!FX.sun;
  const cutKey = [VIEW.cut, VIEW.cutLon, VIEW.cutW, VIEW.vmode, VIEW.cutO, !!FX.floor].join('|');
  if (cutKey !== CUTKEY) { CUTKEY = cutKey; buildCut(); }
  LINES.sink.obj.visible = !!FX.sink && VIEW.cut; if (FX.sink) buildSink(FX.sink);
  OBJ.slab.visible = false; LINES.cutHi.obj.visible = false; LINES.pin.obj.visible = false;
  if (FX.top) { slabAt(0, '#E7B04C', 0.30); cutBand(0, 1, '#E7B04C'); }
  if (FX.bottom) bottomBand();
  if (FX.allLev) cutAllLevels(FX.allLev, 0.9);
  dropLabels('fx:');
  if (VIEW.shell) setLabel('fx:embm', tx(L('EMBM · one layer: T, q', 'EMBM · 单层：T、q')), xyz(52, wrap360(faceLons()[1] + 25), EMBM_R), '', 'surf');
  if (VIEW.halo) setLabel('fx:atchem', tx(L('ATCHEM · one well-mixed box', 'ATCHEM · 一个充分混合的箱子')), xyz(-38, wrap360(faceLons()[1] + 30), ATCHEM_R), '', 'surf');
  if (VIEW.path) setLabel('fx:path', tx(L('island path, j = 3', '岛屿积分路径，j = 3')), xyz(LATC[2], 300, 1.03), '', 'surf');
  renderLegend();
}
function slabAt(n, color, alpha) {
  const u = OBJ.slab.material.uniforms;
  OBJ.slab.visible = VIEW.cut; OBJ.slab.scale.setScalar(ocnR(n + 0.5)); u.uN.value = n; u.uColor.value.set(color); u.uOpacity.value = alpha;
}
function bottomBand() {
  const w = writer(LINES.cutHi), col = rgba('#E5864A', 1);
  if (VIEW.cut) faceLons().forEach((lon, fi) => {
    const i = faceCols(fi, lon);
    for (let j = 0; j < NJ; j++) {
      const nl = NLEV[j * NI + i]; if (!nl) continue;
      for (const n of [nl - 1, nl]) { xyz(LATE[j], lon, ocnR(n), _a); xyz(LATE[j + 1], lon, ocnR(n), _b); w.seg(_a, _b, col, col); }
    }
  });
  w.done(); LINES.cutHi.obj.visible = VIEW.cut;
}

/* ================================================================ per-frame animation */
const SWEEP = {};
function sweepList(kind) {
  if (SWEEP[kind]) return SWEEP[kind];
  const out = [];
  if (kind === 'conv') { for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) if (isWet(j * NI + i)) out.push(j * NI + i); }
  else { for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++) if (isWet(j * NI + i)) out.push(j * NI + i); }
  return (SWEEP[kind] = out);
}
const SWC = { conv: '#35B6C2', carb: '#93C45A', sed: '#E5864A' };
function animate(dt, now) {
  SHARED.uTime.value = now;
  const st = P.list[P.si], d = durOf(st);
  if (P.playing) {
    P.t += dt * P.speed;
    if (P.t >= d) { advance(1); return; }
  }
  const f = clamp(P.t / d, 0, 1), m = curMacro();
  let loop = '';
  const day = stageDay();
  if (Math.abs(day - MODEL_DAY) > 1e-6) {
    MODEL_DAY = day; ORBNOW = orbitAt(day);
    const s = SURF[VIEW.surf];
    if (s && s.timed) { const key = Math.round(day / (365.25 / 96)); if (key !== LAST_DAYKEY) { fillSurface(s, surfData); surfTex.needsUpdate = true; LAST_DAYKEY = key; renderLegend(); } }
  }
  /* sun: daily mean, so only the declination matters; it sits beside the view */
  if (FX.sun) {
    const cl = lonlatOf(camera.position)[1], sl = wrap360(cl + 38), dir = xyz(ORBNOW.decl, sl, 1);
    OBJ.sun.position.copy(dir).multiplyScalar(14);
    setLabel('fx:sun', fmt(L('declination δ = {d}° · day {n}', '赤纬 δ = {d}° · 第 {n} 天'), { d: ORBNOW.decl.toFixed(1), n: day.toFixed(0) }), xyz(ORBNOW.decl, sl, 1.02), '', 'surf');
  }
  const g = OBJ.globe.material.uniforms;
  g.uPulse.value.w = 0;
  if (FX.pulse) { const c = hex3(FX.pulse); g.uPulse.value.set(c[0] / 255, c[1] / 255, c[2] / 255, 0.22 + 0.18 * Math.sin(now * 4)); }
  if (FX.allLev) LINES.cutHi.obj.material.uniforms.uAlpha.value = 0.35 + 0.35 * Math.sin(now * 4);
  else LINES.cutHi.obj.material.uniforms.uAlpha.value = 1;
  if (FX.top) OBJ.slab.material.uniforms.uOpacity.value = 0.22 + 0.12 * Math.sin(now * 4);
  if (FX.kSweep) {
    const k = Math.min(Math.floor(f * 16), 15) + 1, n = 16 - k;
    slabAt(n, '#35B6C2', 0.42); cutBand(n, n + 1, '#9FE6EE');
    loop = `k = ${k} / 16 · ${Math.round(DEPE[n])}–${Math.round(DEPE[n + 1])} m`;
  }
  if (FX.colSweep) {
    const list = sweepList(FX.colSweep), idx = Math.min(Math.floor(f * list.length), list.length - 1);
    if (idx !== CUR.sweep) {
      CUR.sweep = idx;
      const cur = list[idx], done = new Set(list.slice(0, idx)), col = hex3(SWC[FX.colSweep]);
      setMarks(c => c === cur ? [255, 246, 216, 255] : done.has(c) ? [...col, 110] : null);
      setPin(cur, SWC[FX.colSweep]);
    }
    const c = list[idx], i = c % NI + 1, j = Math.floor(c / NI) + 1;
    loop = fmt(L('(i, j) = ({i}, {j}) · column {n} / {N} · {l} levels', '(i, j) = ({i}, {j}) · 第 {n} / {N} 柱 · {l} 层'), { i, j, n: idx + 1, N: list.length, l: NLEV[c] });
  }
  if (FX.mix) OBJ.atchem.material.uniforms.uPatch.value = 1 - smooth(f);
  if (VIEW.halo) { OBJ.atchemGlow.material.uniforms.uAlpha.value = 0.20 + 0.10 * Math.sin(now * 2.5); OBJ.atchem.material.uniforms.uOpacity.value = 0.05 + 0.03 * Math.sin(now * 2.5); }
  if (FX.year) {
    const k = 11 + Math.min(Math.floor(f * 469), 468);
    loop = fmt(L('k = {k} · day {d} · ocean step {o} / 96 · BIOGEM call {b} / 48', 'k = {k} · 第 {d} 天 · 海洋步 {o} / 96 · BIOGEM 第 {b} / 48 次'), { k, d: (k * DAYK).toFixed(0), o: Math.floor(k / 5), b: Math.floor(k / 10) });
  }
  if (m.kind === 'k' && st.p === 'all') loop = '';
  CUR.loop = loop;
  FLOW.tau.update(dt); FLOW.wind.update(dt);
  if (CAMTWEEN) {
    CAMTWEEN.t += dt; const x = smooth(clamp(CAMTWEEN.t / CAMTWEEN.dur, 0, 1));
    const a = CAMTWEEN.from.clone().normalize(), b = CAMTWEEN.to.clone().normalize(), r = lerp(CAMTWEEN.from.length(), CAMTWEEN.to.length(), x);
    camera.position.copy(slerpTo(a, b, x, new THREE.Vector3()).multiplyScalar(r));
    if (x >= 1) CAMTWEEN = null;
  }
  const L3 = camera.position.clone().normalize(); g.uLight.value.copy(L3.add(new THREE.Vector3(0, 0.5, 0)).normalize());
  hudTick();
}
function slerpTo(A, B, t, out) {
  const d = clamp(A.dot(B), -1, 1), th = Math.acos(d);
  if (th < 1e-4) return out.copy(A);
  return out.copy(A).multiplyScalar(Math.sin((1 - t) * th) / Math.sin(th)).addScaledVector(B, Math.sin(t * th) / Math.sin(th));
}
function advance(dir) {
  if (dir > 0) {
    if (P.si < P.list.length - 1) { setStage(P.si + 1); return; }
    if (P.mi < MACRO.length - 1) { go(P.mi + 1, 0); return; }
    P.playing = false; renderTransport(); return;
  }
  if (P.si > 0) { setStage(P.si - 1); return; }
  if (P.mi > 0) go(P.mi - 1, -1);
}

/* ================================================================ UI: header, layers */
function renderStatic() {
  document.documentElement.lang = LANG === 'zh' ? 'zh-CN' : 'en';
  $('#layers').setAttribute('aria-label', tx(L('Layers', '图层'))); $('#gl').setAttribute('aria-label', tx(L('3D globe', '三维地球')));
  document.querySelector('.lang').setAttribute('aria-label', tx(L('Language', '语言')));
  $('#sub').textContent = tx(U.sub);
  $('#btnLayers').textContent = tx(U.layers); $('#btnHome').textContent = tx(U.home); $('#btnSpin').textContent = tx(U.spin);
  const h = $('#lnkHad'); h.textContent = tx(U.had);
  h.href = `../../HadCM3_visualization/v3/HadCM3_3D${LANG === 'zh' ? '_zh' : ''}.html`;
  document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === LANG)));
  $('#btnPrev').textContent = tx(U.prev); $('#btnPrev').title = tx(U.prevT); $('#btnNext').textContent = tx(U.next); $('#btnNext').title = tx(U.nextT);
  $('#lblSpeed').textContent = tx(U.speed); $('#lblDetail').textContent = tx(U.detail);
  renderTransport(); buildLayers();
}
function renderTransport() { $('#btnPlay').textContent = tx(P.playing ? U.pause : U.play); }
function opt(v, label, cur) { return `<option value="${esc(v)}"${String(v) === String(cur) ? ' selected' : ''}>${esc(label)}</option>`; }
function buildLayers() {
  const el = $('#layers');
  const surfSel = SURF_GROUPS.map(([g, keys]) => `<optgroup label="${esc(tx(U[g]))}">${keys.map(k => opt(k, tx(SURF[k].name), VIEW.surf)).join('')}</optgroup>`).join('');
  const chk = (id, on, label, sw) => `<label><input type="checkbox" id="${id}"${on ? ' checked' : ''}> ${sw ? `<i class="sw" style="background:${sw}"></i>` : ''}${esc(tx(label))}</label>`;
  el.innerHTML = `
  <div class="lg">${chk('chkFollow', VIEW.follow, U.follow)}<p class="hint">${esc(tx(U.followHint))}</p></div>
  <div class="lg"><h3>${esc(tx(U.surfH))}</h3><select id="selSurf" aria-label="${esc(tx(U.surfH))}">${surfSel}</select></div>
  <div class="lg"><h3>${esc(tx(U.atmH))}</h3>${chk('chkShell', VIEW.shell, U.shell, '#6FAEE0')}${chk('chkWind', VIEW.emWinds, U.emWinds)}${chk('chkHalo', VIEW.halo, U.halo, '#F06BB4')}</div>
  <div class="lg"><h3>${esc(tx(U.ocnH))}</h3>${chk('chkTau', VIEW.tauP, U.tauP)}${chk('chkRunoff', VIEW.runoff, U.runoff, '#C99A5B')}${chk('chkPath', VIEW.path, U.path, '#F06BB4')}</div>
  <div class="lg"><h3>${esc(tx(U.gridH))}</h3>${chk('chkGrid', VIEW.grid, U.grid)}</div>
  <div class="lg"><h3>${esc(tx(U.cutH))}</h3>${chk('chkCut', VIEW.cut, U.cut)}${chk('chkCutFollow', VIEW.cutFollow, U.cutFollow)}
    <label class="col"><span>${esc(tx(U.cutLon))}: <b id="cutLonV">${faceLons()[0]}</b></span><input type="range" id="rngCutLon" min="0" max="350" step="10" value="${faceLons()[0]}"></label>
    <label class="col"><span>${esc(tx(U.cutW))}: <b id="cutWV">${VIEW.cutW}</b></span><input type="range" id="rngCutW" min="20" max="140" step="10" value="${VIEW.cutW}"></label>
    <label class="col"><span>${esc(tx(U.cutO))}</span><select id="selCutO">${Object.entries(CUTO).map(([k, v]) => opt(k, tx(v.name), VIEW.cutO)).join('')}</select></label></div>
  <div class="lg"><h3>${esc(tx(U.viewH))}</h3>${chk('chkAutoCam', VIEW.autoCam, U.autoCam)}
    <label class="col"><span>${esc(tx(U.vscale))}</span><select id="selV">${opt('levels', tx(U.vLevels), VIEW.vmode)}${opt('phys', tx(U.vPhys), VIEW.vmode)}</select></label></div>`;
  const on = (id, ev, fn) => { const e = $('#' + id); if (e) e.addEventListener(ev, fn); };
  on('chkFollow', 'change', e => { VIEW.follow = e.target.checked; });
  on('selSurf', 'change', e => { VIEW.surf = e.target.value; refreshAll(); renderPanel(); });
  on('chkShell', 'change', e => { VIEW.shell = e.target.checked; refreshAll(); renderPanel(); });
  on('chkWind', 'change', e => { VIEW.emWinds = e.target.checked; if (VIEW.emWinds) VIEW.shell = true; refreshAll(); syncLayers(); renderPanel(); });
  on('chkHalo', 'change', e => { VIEW.halo = e.target.checked; refreshAll(); renderPanel(); });
  on('chkTau', 'change', e => { VIEW.tauP = e.target.checked; refreshAll(); renderPanel(); });
  on('chkRunoff', 'change', e => { VIEW.runoff = e.target.checked; refreshAll(); renderPanel(); });
  on('chkPath', 'change', e => { VIEW.path = e.target.checked; refreshAll(); renderPanel(); });
  on('chkGrid', 'change', e => { VIEW.grid = e.target.checked; refreshAll(); renderPanel(); });
  on('chkCut', 'change', e => { VIEW.cut = e.target.checked; refreshAll(); renderPanel(); });
  on('chkCutFollow', 'change', e => { VIEW.cutFollow = e.target.checked; });
  let ct = null;
  on('rngCutLon', 'input', e => { VIEW.cutLon = +e.target.value; $('#cutLonV').textContent = VIEW.cutLon; clearTimeout(ct); ct = setTimeout(() => { refreshAll(); renderPanel(); }, 60); });
  on('rngCutW', 'input', e => { VIEW.cutW = +e.target.value; $('#cutWV').textContent = VIEW.cutW; clearTimeout(ct); ct = setTimeout(() => { refreshAll(); renderPanel(); }, 60); });
  on('selCutO', 'change', e => { VIEW.cutO = e.target.value; refreshAll(); renderPanel(); });
  on('chkAutoCam', 'change', e => { VIEW.autoCam = e.target.checked; });
  on('selV', 'change', e => { VIEW.vmode = e.target.value; refreshAll(); updateCutLabels(); });
}
function syncLayers() {
  const set = (id, v) => { const e = $('#' + id); if (e) { if (e.type === 'checkbox') e.checked = !!v; else e.value = String(v); } };
  set('selSurf', VIEW.surf); set('chkShell', VIEW.shell); set('chkWind', VIEW.emWinds); set('chkHalo', VIEW.halo); set('chkTau', VIEW.tauP);
  set('chkRunoff', VIEW.runoff); set('chkPath', VIEW.path); set('chkGrid', VIEW.grid); set('chkCut', VIEW.cut); set('selCutO', VIEW.cutO);
  set('rngCutLon', faceLons()[0]); set('rngCutW', VIEW.cutW);
  const a = $('#cutLonV'); if (a) a.textContent = faceLons()[0];
}

/* ================================================================ legend */
const fmtV = v => { const a = Math.abs(v); return a === 0 ? '0' : a >= 1000 ? Math.round(v).toLocaleString('en') : a >= 10 ? v.toFixed(0) : a >= 1 ? v.toFixed(1).replace(/\.0$/, '') : a >= 0.01 ? v.toFixed(2).replace(/0$/, '') : v.toExponential(0); };
function ticks(lo, hi) { const out = []; for (let i = 0; i <= 4; i++) { const v = lo + (hi - lo) * i / 4; out.push([i / 4, v]); } return out; }
function bar(cmap, lo, hi, units, rev) {
  return `<canvas width="256" height="10" data-cmap="${cmap}"${rev ? ' data-rev="1"' : ''} aria-hidden="true"></canvas><div class="ticks">${ticks(lo, hi).map(([t, v]) => `<span style="left:${(t * 100).toFixed(1)}%">${fmtV(v)}</span>`).join('')}</div>`;
}
function renderLegend() {
  const s = SURF[VIEW.surf] || SURF.depth, el = $('#legend');
  const when = s.timed ? fmt(L('day {d} of 365 · computed here', '第 {d} 天（共 365 天）· 本页计算'), { d: MODEL_DAY.toFixed(0) }) : '';
  let h = `<div class="lt">${esc(tx(s.name))}${s.units ? ` <span style="color:var(--muted);font-weight:400">(${esc(s.units)})</span>` : ''}</div><div class="ls">${esc([when, s.src].filter(Boolean).join(' · '))}</div>`;
  if (s.cat === 'basins') h += `<div class="cats"><span><i class="sw" style="background:#C99A5B"></i>${esc(tx(L('land, coloured by outlet', '陆地，按入海点着色')))}</span><span><i class="sw" style="background:#D6ECF0"></i>${esc(tx(L('coastal cells with an inflow', '有径流汇入的沿海格点')))}</span></div>`;
  else if (s.cat === 'islands') h += `<div class="cats"><span><i class="sw" style="background:#F06BB4"></i>${esc(tx(L('island: Antarctica', '岛：南极')))}</span><span><i class="sw" style="background:#968060"></i>${esc(tx(L('main landmass, ψ = 0', '主陆块，ψ = 0')))}</span></div>`;
  else h += bar(s.cmap, s.lo, s.hi);
  const co = CUTO[VIEW.cutO];
  if (VIEW.cut && co.cmap) h += `<div class="lt" style="margin-top:8px">${esc(tx(L('Section', '剖面')))}: ${esc(tx(co.name))}${co.units ? ` (${co.units})` : ''}</div>` + bar(co.cmap, co.lo, co.hi, '', co.rev);
  el.innerHTML = h;
  el.querySelectorAll('canvas').forEach(cv => {
    const c = cv.getContext('2d'), L3 = lut(cv.dataset.cmap), rev = !!cv.dataset.rev;
    for (let i = 0; i < 256; i++) { const k = (rev ? 255 - i : i) * 3; c.fillStyle = `rgb(${L3[k]},${L3[k + 1]},${L3[k + 2]})`; c.fillRect(i, 0, 1, 10); }
  });
}

/* ================================================================ HUD */
function clockText() {
  const m = curMacro();
  if (m.kind === 'init') return [tx(U.startup), tx(L('k = 0 · 1 Jan', 'k = 0 · 1 月 1 日'))];
  if (m.kind === 'end') return [tx(U.runEnd), tx(L('k = N', 'k = N'))];
  if (m.kind === 'loop') return [tx(L('k = 11 … 479', 'k = 11 … 479')), tx(U.yearLoop)];
  const k = m.k, mods = ORDER.filter(x => runsAt(x, k)).map(x => tx(COMP[x].n)).join(' · ');
  return [`${fmt(U.kStep, { k })} · ${fmt(U.dayOf, { a: fmtD((k - 1) * DAYK), b: fmtD(k * DAYK) })}`, mods];
}
function renderHud() {
  const [c1, c2] = clockText(), st = P.list[P.si], q = procOf(st.mod, st.p);
  const name = q ? tx(q.t) : tx(U.all), num = q && st.mod !== 'main' ? procNum(st.mod, st.p) : '';
  let h = `<div class="clock">${esc(c1)}<small>${esc(c2)}</small></div>`;
  h += `<div class="now"><i class="dot" style="background:${compColor(st.mod)}"></i><b>${st.mod !== 'main' ? esc(tx(COMP[st.mod].n)) + (num ? ' · ' + num : '') : ''}</b> ${esc(name)} ${q ? `<span class="mono">${esc(q.r.split(' · ')[0])}</span>` : ''}</div>`;
  h += `<div class="loop" id="hudLoop"${CUR.loop ? '' : ' hidden'}>${esc(CUR.loop || '')}</div>`;
  const note = q && q.d ? tx(q.d) : (st.p === 'all' ? tx(L('Same routines as in its first call; tick “All routines on every step” to see them again.', '与首次调用相同的子程序；勾选“每一步都展开全部子程序”可再次逐个查看。')) : '');
  if (note) h += `<div class="note">${esc(note)}</div>`;
  $('#hud').innerHTML = h;
}
let HUD_LOOP = '';
function hudTick() {
  if (CUR.loop !== HUD_LOOP) { HUD_LOOP = CUR.loop; const e = $('#hudLoop'); if (e) { e.textContent = CUR.loop; e.hidden = !CUR.loop; } }
  const c = $('#clockline'); if (c) { const [c1, c2] = clockText(); const t = `${c1} · ${c2}`; if (c.textContent !== t) c.textContent = t; }
}

/* ================================================================ panel */
function visList() {
  const out = [], s = SURF[VIEW.surf];
  if (s) out.push(fmt(L('Surface: {n} — {src}', '地表：{n}——{src}'), { n: tx(s.name), src: s.src }));
  if (VIEW.shell) out.push(tx(L('Blue shell: the EMBM atmosphere, a single layer on the same 36 × 36 grid (height not to scale)', '蓝色壳层：EMBM 大气，同一 36 × 36 网格上的单层（高度不按比例）')));
  if (VIEW.emWinds) out.push(tx(L('Particles on the shell: the prescribed winds uncep / vncep that carry EMBM heat and moisture', '壳层上的粒子：携带 EMBM 热量和水汽的给定风场 uncep / vncep')));
  if (VIEW.halo) out.push(tx(L('Pink shell: ATCHEM, the whole atmosphere’s composition held as one well-mixed value', '粉色壳层：ATCHEM，整个大气的成分只有一个充分混合的值')));
  if (VIEW.tauP) out.push(tx(L('Particles on the sea: the prescribed wind stress (taux_u, tauy_v), the only momentum input to GOLDSTEIN', '海面粒子：给定风应力（taux_u、tauy_v），GOLDSTEIN 唯一的动量输入')));
  if (VIEW.runoff) out.push(tx(L('Arcs: runoff from each land cell to its coastal outlet (worjh2.k1 codes, readroff.f)', '弧线：每个陆地格点的径流到它的入海格点（worjh2.k1 编码，readroff.f）')));
  if (VIEW.path) out.push(tx(L('Pink ring: the island path integral along row j = 3 (worjh2.paths); pink land: Antarctica', '粉色环：沿第 j = 3 行的岛屿路径积分（worjh2.paths）；粉色陆地：南极')));
  if (FX.spikes) out.push(tx({ up: L('Dashes up: surface fluxes entering the EMBM layer, every cell', '向上短线：进入 EMBM 层的地表通量，每个格点'), down: L('Dashes down: fluxes delivered to the ocean surface, every ocean cell', '向下短线：交给海洋表层的通量，每个海洋格点'), both: L('Orange up, green down: heat between each ocean cell and the air above it', '橙色向上、绿色向下：每个海洋格点与上方空气之间的热量'), gas: L('Dashes both ways: air–sea gas exchange at every ocean cell', '双向短线：每个海洋格点的海气气体交换'), olr: L('Dashes from the shell: outgoing longwave, every cell', '从壳层射出的短线：出射长波，每个格点'), rain: L('Drops from the shell: precipitation (positions schematic)', '从壳层落下的雨滴：降水（位置为示意）') }[FX.spikes] || L('', '')));
  if (FX.colSweep) out.push(tx(L('Lit cell and pin: the column being worked on, in the loop order of the code; tinted: columns already done', '亮格和竖针：按代码循环顺序正在计算的柱子；着色：已完成的柱子')));
  if (FX.kSweep) out.push(tx(L('Cyan slab in the wedge: the level being transported, k = 1 (floor) → 16 (top)', '楔形中的青色薄层：正在输运的层，k = 1（海底）→ 16（顶层）')));
  if (FX.top) out.push(tx(L('Gold slab: the top cell, k = 16, 0–81 m', '金色薄层：顶层格点 k = 16，0–81 m')));
  if (FX.sink) out.push(tx(L('Falling dashes on the sections: export sinking, brightness = share still sinking; orange ticks: rain reaching the floor', '剖面上下落的短线：输出颗粒下沉，亮度 = 仍在下沉的比例；橙色短线：到达海底的沉降')));
  if (FX.floor || FX.bottom) out.push(tx(L('Orange band under each column: the sediment surface that SEDGEM keeps', '每柱底部的橙色带：SEDGEM 维护的沉积物表层')));
  if (FX.slope) out.push(tx(L('Marked cells: floor differs from a neighbour by ≥ 4 levels (where JEBAR matters)', '标记格点：海底与相邻格点相差 ≥ 4 层（JEBAR 起作用处）')));
  if (FX.coast) out.push(tx(L('Marked cells: coastal outlets that receive runoff and river input', '标记格点：接收径流和河流输入的入海格点')));
  if (FX.land) out.push(tx(L('Marked cells: land', '标记格点：陆地')));
  if (FX.iceGrid) out.push(tx(L('Pale tint: every ocean cell, where sea ice is computed (ice cover itself is a model state, not shown)', '浅色：每个海洋格点都计算海冰（冰的覆盖本身是模式状态，未显示）')));
  if (FX.pulse || FX.allLev) out.push(tx(L('Pulse: every wet cell on every level at once', '脉冲：所有层的所有湿格点同时')));
  if (FX.sun) out.push(tx(L('Sun at the declination of the model day; insolation is a daily mean, so there is no terminator', '太阳位于模式日期的赤纬；日射是日平均，因此没有晨昏线')));
  if (VIEW.grid) out.push(tx(L('Grid: 36 × 10° columns, 36 rows of equal area (equal steps in sin φ)', '网格：36 列 × 10°，36 行等面积（sin φ 等距）')));
  if (VIEW.cut) { const [a, b] = faceLons(); out.push(fmt(L('Sections at {a}°E and {b}°E: {n}; under each column its sediment, then rock', '剖面位于 {a}°E 和 {b}°E：{n}；每柱下方是沉积物，再往下是岩石'), { a, b, n: tx(CUTO[VIEW.cutO].name) })); }
  return out.filter(Boolean);
}
function curModInfo(mod) { return (V1[LANG].MODS || []).find(x => x.key === mod); }
function renderPanel() {
  const m = curMacro(), st = P.list[P.si], q = procOf(st.mod, st.p);
  const card = V1[LANG].STEPS[cardOf(m, st)], info = curModInfo(st.mod), [c1, c2] = clockText();
  let h = `<div class="chiprow"><span class="chip">${esc(c1)}</span>${st.mod !== 'main' ? `<span class="chip mod"><i class="dot" style="background:${compColor(st.mod)}"></i>${esc(tx(COMP[st.mod].n))}</span>` : ''}</div>`;
  h += `<h2>${card ? card.title : ''}</h2>`;
  if (card) h += `<div class="call">${esc(card.call)}${card.src ? ' · ' + esc(card.src) : ''}</div>`;
  if (q) {
    const num = st.mod !== 'main' ? procNum(st.mod, st.p) : '•', tag = q.zero ? `<span class="tag off">${esc(tx(q.zero))}</span>` : '';
    h += `<div class="proc"><div class="ph"><span class="pn" style="background:${compColor(st.mod)}">${num}</span><span class="pt">${esc(tx(q.t))}</span>${tag}</div><div class="pr">${esc(q.r)}</div>${q.d ? `<p>${esc(tx(q.d))}</p>` : ''}</div>`;
    if (q.p && q.p.length) h += `<div class="sec"><h4>${esc(tx(U.params))}</h4><div class="pchips">${q.p.map(([n, v]) => `<span class="pchip">${esc(n)}<b>${esc(v)}</b></span>`).join('')}</div></div>`;
  } else if (st.p === 'all' && info) h += `<div class="proc"><div class="ph"><span class="pn" style="background:${compColor(st.mod)}">∗</span><span class="pt">${esc(info.full || tx(COMP[st.mod].n))}</span><span class="tag">${esc(tx(U.all))}</span></div><p>${info.lead}</p></div>`;
  const vis = visList();
  if (vis.length) h += `<div class="sec"><h4>${esc(tx(U.inView))}</h4><ul class="vis">${vis.map(v => `<li>${esc(v)}</li>`).join('')}</ul></div>`;
  if (info && st.mod !== 'main') {
    h += `<div class="sec"><h4>${esc(info.name)} · ${esc((info.freq || []).join(' · '))}</h4><p style="margin:0;font-size:12.5px;color:var(--muted)">${info.full || ''}</p></div>`;
    if (info.rel) h += `<div class="sec"><h4>${esc(tx(U.rel))}</h4><p style="margin:0;font-size:12.5px">${info.rel}</p></div>`;
    if (info.had) h += `<div class="sec"><h4>${esc(tx(U.had2))}</h4><p style="margin:0;font-size:12.5px;color:var(--muted)">${info.had}</p></div>`;
  }
  if (st.mod !== 'main' && PROCS[st.mod]) {
    h += `<div class="sec"><h4>${esc(fmt(U.procs, { m: tx(COMP[st.mod].n) }))}</h4><ol class="plist">${PROCS[st.mod].map((x, i) => `<li><button type="button" data-proc="${x.id}" class="${x.id === st.p ? 'cur' : ''}${x.zero ? ' off' : ''}"><span class="n">${i + 1}</span><span>${esc(tx(x.t))}<span class="r">${esc(x.r)}</span></span></button></li>`).join('')}</ol></div>`;
  }
  if (card) {
    const li = a => (a || []).map(x => `<li>${x}</li>`).join('');
    h += `<details class="card"><summary>${esc(tx(U.card))}</summary><h5>${esc(tx(U.cIn))}</h5><ul>${li(card.in)}</ul><h5>${esc(tx(U.cCalc))}</h5><ul>${li(card.calc)}</ul><h5>${esc(tx(U.cOut))}</h5><ul>${li(card.out)}</ul>${card.note ? `<p>${card.note}</p>` : ''}</details>`;
  }
  if (info && info.params && info.params.length) h += `<details class="card"><summary>${esc(tx(U.modTab))}</summary><ul>${info.params.map(r => `<li><code>${esc(r[0])}</code> = <b>${esc(r[1])}</b> — ${esc(r[2])}</li>`).join('')}</ul></details>`;
  h += `<div class="about"><p><b>${esc(tx(U.about))}.</b> ${esc(tx(U.aboutText))}</p><p>${esc(IN.meta.source)}</p></div>`;
  const el = $('#panel'); el.innerHTML = h;
  el.querySelectorAll('[data-proc]').forEach(b => b.addEventListener('click', () => jumpToProc(st.mod, b.dataset.proc)));
}
function jumpToProc(mod, p) {
  const i = P.list.findIndex(s => s.mod === mod && s.p === p);
  if (i >= 0) { setStage(i); return; }
  for (let d = 1; d < MACRO.length; d++) {
    const mi = (P.mi + d) % MACRO.length, list = stagesOf(MACRO[mi], P.detail), k = list.findIndex(s => s.mod === mod && s.p === p);
    if (k >= 0) { go(mi, k); return; }
  }
  /* only summarised elsewhere: show it with every routine expanded */
  for (let mi = 0; mi < MACRO.length; mi++) { const list = stagesOf(MACRO[mi], true), k = list.findIndex(s => s.mod === mod && s.p === p); if (k >= 0) { P.detail = true; $('#chkDetail').checked = true; go(mi, k); return; } }
}

/* ================================================================ timeline: which module runs at which master step */
function renderTimeline() {
  const el = $('#day');
  const cell = (mi, label, mods, wide, title) => `<button type="button" class="tk${wide ? ' wide' : ''}${mi === P.mi ? ' cur' : ''}${mi < P.mi ? ' done' : ''}" data-mi="${mi}" title="${esc(title)}"><span class="kl">${esc(label)}</span>${ORDER.map(x => `<i class="m" style="${mods.includes(x) ? `background:${compColor(x)}` : ''}"></i>`).join('')}</button>`;
  let h = `<div class="rowlab"><span class="hd">${esc(tx(U.masterH))} →</span><div class="mods">${ORDER.map(x => `<span><i style="background:${compColor(x)}"></i>${esc(tx(COMP[x].n))}</span>`).join('')}</div></div>`;
  h += `<div class="sched">`;
  h += cell(0, tx(U.start), [], true, tx(U.startup));
  for (let k = 1; k <= 10; k++) { const mods = ORDER.filter(x => runsAt(x, k)); h += cell(k, String(k), mods, false, `k = ${k} · ${mods.map(x => tx(COMP[x].n)).join(', ')}`); }
  h += cell(11, tx(U.loopT), ['surflux', 'embm', 'seaice', 'goldstein', 'rokgem', 'biogem', 'atchem'], true, tx(U.yearLoop));
  h += cell(12, '480', ORDER.slice(), false, `k = 480 · ${tx(U.yearEnd)}`);
  h += cell(13, tx(U.end), [], true, tx(U.runEnd));
  h += `</div>`;
  el.innerHTML = h;
  el.querySelectorAll('[data-mi]').forEach(b => b.addEventListener('click', () => go(+b.dataset.mi, 0)));
}
function chipLabel(s) {
  if (s.p === 'all') return `${tx(COMP[s.mod].n)} · ${tx(U.all)}`;
  const q = procOf(s.mod, s.p); if (!q) return s.p;
  return s.mod === 'main' ? tx(q.t) : `${procNum(s.mod, s.p)} ${tx(q.t)}`;
}
function renderChips() {
  const el = $('#chips');
  el.innerHTML = P.list.map((s, i) => `<button type="button" class="sc${i === P.si ? ' cur' : i < P.si ? ' past' : ''}" data-si="${i}"><i class="dot" style="background:${compColor(s.mod)}"></i>${esc(chipLabel(s))}</button>`).join('');
  el.querySelectorAll('[data-si]').forEach(b => b.addEventListener('click', () => setStage(+b.dataset.si)));
  const cur = el.querySelector('.cur');
  if (cur) { const l = cur.offsetLeft - el.offsetLeft, w = el.clientWidth; if (l < el.scrollLeft + 20 || l > el.scrollLeft + w - 120) el.scrollLeft = Math.max(0, l - w / 3); }
}

/* ================================================================ hover tooltip */
const RAY = new THREE.Raycaster(), MOUSE = new THREE.Vector2();
let TIP_EV = null;
function tipTick() {
  const e = TIP_EV, tip = $('#tip'); if (!e) return; TIP_EV = null;
  if (e.type === 'pointerleave' || e.buttons) { tip.hidden = true; return; }
  const r = $('#gl').getBoundingClientRect();
  MOUSE.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  RAY.setFromCamera(MOUSE, camera);
  const o = RAY.ray.origin, d = RAY.ray.direction, b = o.dot(d), c = o.lengthSq() - 1, disc = b * b - c;
  if (disc < 0) { tip.hidden = true; return; }
  const p = o.clone().addScaledVector(d, -b - Math.sqrt(disc)), [lat, lon] = lonlatOf(p);
  if (inCut(lon)) { tip.hidden = true; return; }
  const cc = cellOf(lat, lon), i = cc % NI + 1, j = Math.floor(cc / NI) + 1, wet = isWet(cc), s = SURF[VIEW.surf];
  let h = `<div><b>${fmtLat(lat)} ${lon.toFixed(1)}°E</b> · ${esc(tx(wet ? U.tipSea : U.tipLand))}</div><div class="k">${esc(tx(U.tipCell))} i = ${i}, j = ${j} · k1 = ${IN.k1[cc]}</div>`;
  if (wet) h += `<div>${esc(fmt(U.tipLev, { n: NLEV[cc], d: Math.round(DEPE[NLEV[cc]]) }))}</div>`;
  else { const dd = IN.runoffTo[cc]; if (dd >= 0) h += `<div>${esc(fmt(U.tipRun, { i: dd % NI + 1, j: Math.floor(dd / NI) + 1 }))}</div>`; }
  if (s && !s.cat) { const v = (wet || s.land) ? surfValue(s, cc) : NaN; h += `<div>${esc(tx(s.name))}: <b>${v === v ? fmtV(v) + ' ' + esc(s.units) : '—'}</b></div>`; }
  tip.innerHTML = h; tip.hidden = false;
  const sr = $('#stage').getBoundingClientRect(); let x = e.clientX - sr.left + 14, y = e.clientY - sr.top + 14;
  if (x + 270 > sr.width) x -= 290; if (y + 110 > sr.height) y -= 120;
  tip.style.left = x + 'px'; tip.style.top = y + 'px';
}

/* ================================================================ controls and start-up */
function bindControls() {
  $('#btnPlay').addEventListener('click', () => { P.playing = !P.playing; renderTransport(); });
  $('#btnPrev').addEventListener('click', () => advance(-1));
  $('#btnNext').addEventListener('click', () => advance(1));
  $('#selSpeed').addEventListener('change', e => { P.speed = +e.target.value; });
  $('#chkDetail').addEventListener('change', e => { P.detail = e.target.checked; go(P.mi, 0); });
  $('#btnHome').addEventListener('click', () => { CAMTWEEN = null; const p = xyz(18, wrap360(faceLons()[0] + VIEW.cutW / 2), 6.2); if (!VIEW.autoCam || REDUCED) camera.position.copy(p); else CAMTWEEN = { from: camera.position.clone(), to: p, t: 0, dur: 1.2 }; });
  $('#btnSpin').addEventListener('click', e => { VIEW.spin = !VIEW.spin; controls.autoRotate = VIEW.spin; e.currentTarget.setAttribute('aria-pressed', String(VIEW.spin)); });
  $('#btnLayers').addEventListener('click', e => { const app = $('#app'), hide = !app.classList.contains('nolayers'); app.classList.toggle('nolayers', hide); e.currentTarget.setAttribute('aria-expanded', String(!hide)); setTimeout(resize, 30); });
  document.querySelectorAll('.lang button').forEach(b => b.addEventListener('click', () => {
    LANG = b.dataset.lang; try { localStorage.setItem('cg3d-lang', LANG); } catch (e) { /* storage blocked */ }
    renderStatic(); renderTimeline(); renderChips(); renderPanel(); renderHud(); refreshAll(); updateCutLabels();
  }));
  const gl = $('#gl');
  gl.addEventListener('pointermove', e => { TIP_EV = e; }); gl.addEventListener('pointerleave', e => { TIP_EV = e; }); gl.addEventListener('pointerdown', () => { $('#tip').hidden = true; });
  window.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input, select, textarea')) return;
    if (e.key === ' ') { e.preventDefault(); P.playing = !P.playing; renderTransport(); }
    else if (e.key === 'ArrowRight') advance(1); else if (e.key === 'ArrowLeft') advance(-1);
  });
  if (window.innerWidth <= 1180) { $('#app').classList.add('nolayers'); $('#btnLayers').setAttribute('aria-expanded', 'false'); }
}
async function main() {
  const msg = $('#loadMsg'); msg.textContent = tx(U.loading);
  if (!IN) { $('#loading').classList.add('err'); msg.textContent = tx(U.nodata); return; }
  try { const c = document.createElement('canvas'); if (!(c.getContext('webgl2') || c.getContext('webgl'))) throw new Error('nogl'); }
  catch (e) { $('#loading').classList.add('err'); msg.textContent = tx(U.nogl); return; }
  prepFields();
  ORBNOW = orbitAt(0);
  initScene();
  bindControls();
  renderStatic();
  go(0, 0);
  $('#loading').hidden = true;
  let last = performance.now();
  const loop = t => {
    const dt = Math.min((t - last) / 1000, 0.1); last = t;
    animate(dt, t / 1000);
    controls.update();
    updateLabels(); tipTick();
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  window.CG3D = { P, VIEW, FX, go, advance, MACRO, camera, renderer, LINES, OBJ, FLD, orbitAt,
    settle() { if (CAMTWEEN) { camera.position.copy(CAMTWEEN.to); CAMTWEEN = null; } } };
}
main().catch(e => { console.error(e); const l = $('#loading'); l.hidden = false; l.classList.add('err'); $('#loadMsg').textContent = String(e && e.message || e); });
