# cGENIE visualization

An interactive, step-by-step walkthrough of how the [cGENIE.cookie](https://github.com/genie-model/cgenie.cookie) Earth system model advances through time.

- **Overview flowchart**: the call order inside one master time step, and how often each module runs.
- **Step player**: play, pause or scrub through one biogeochemistry cycle (k = 1–10) and the year-end sediment step; a module map highlights the data exchanged at each step.
- **Module tabs**: what EMBM, surflux, sea ice, GOLDSTEIN, BIOGEM, ATCHEM, ROKGEM and SEDGEM read, compute and write, with key parameters and their default values.

| File | Language |
|---|---|
| [`cGENIE_timestep_walkthrough_en.html`](cGENIE_timestep_walkthrough_en.html) | English |

Open either file in a browser. They are self-contained apart from Google Fonts.

## Basis

Numbers and call order were read from cgenie.cookie commit `ed0eacff` (2026-08-26): `genie-main/genie.F`, `genie_loop_wrappers.f90`, `runcookie.sh`, the module sources and `genie-main/src/xml-config/xml/definition.xml`. Time steps are those `runcookie.sh` writes for the default 36×36×16 grid (worjh2 topography, CBSR base configuration). Parameter values marked "XML default" may be overridden by a user config.

The cGENIE.cookie manual lives at [genie-model/cookiedoc](https://github.com/genie-model/cookiedoc).

## 3D version

[`3d/`](3d) shows the same cycle on a 3D globe, in the style of the HadCM3 3D page ([`../HadCM3_visualization/v3`](../HadCM3_visualization/v3)): the worjh2 grid (36 × 36 cells of equal area, 16 levels down to 5000 m), a wedge cut out of the ocean to show the levels, the single-layer EMBM atmosphere and the well-mixed ATCHEM box as shells above it. The bottom bar shows which module runs at each master step (k = 1–10, the rest of the year, k = 480); each module then plays its routines in call order, with the source file and line, what the routine does and the cells or levels it works on.

| File | Language |
|---|---|
| [`3d/cGENIE_3D.html`](3d/cGENIE_3D.html) | follows the browser language, with a 中文 / EN switch |
| [`3d/cGENIE_3D_zh.html`](3d/cGENIE_3D_zh.html) | opens in Chinese |

The pages load `3d/data/cgenie_inputs.js` and three.js from jsDelivr, so serve the folder over HTTP (for example `python3 -m http.server` in `projects/emu-cGENIE`) rather than opening the file directly.

**No model output is shown.** cGENIE has not been run here, so there are no temperature, salinity, current, tracer or pCO₂ fields. The globe shows the boundary conditions the CBSR worjh2 base config reads (`genie-paleo/p_worjh2`: bathymetry and runoff codes in `worjh2.k1`, wind stress, EMBM winds, zonal albedo, island path, sediment depth; `genie-biogem/data/input/windspeed.dat`), plus a few things computed from them: insolation with the `radfor.F` formula, runoff routes with `readroff.f`, POC and CaCO₃ remineralisation profiles from the BIOGEM XML defaults.

Build: `python3 3d/build_data.py` reads the input files into `3d/data/cgenie_inputs.js`; `python3 3d/build_3d.py` assembles both pages from `3d/src/` (page, styles, app) and the step cards of the 2D page (English from `cGENIE_timestep_walkthrough_en.html`, Chinese from `3d/src/v1_cards_zh.js`, the Chinese 2D page of commit `3b5e5b8`). Edit `3d/src/`, then rebuild; do not edit the generated HTML.
