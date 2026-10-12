# cGENIE visualization

An interactive, step-by-step walkthrough of how the [cGENIE.cookie](https://github.com/genie-model/cgenie.cookie) Earth system model advances through time.

- **Overview flowchart**: the call order inside one master time step, and how often each module runs.
- **Step player**: play, pause or scrub through one biogeochemistry cycle (k = 1–10) and the year-end sediment step; a module map highlights the data exchanged at each step.
- **Module tabs**: what EMBM, surflux, sea ice, GOLDSTEIN, BIOGEM, ATCHEM, ROKGEM and SEDGEM read, compute and write, with key parameters and their default values.

| File | Language |
|---|---|
| [`index.html`](index.html) | English |
| [`zh.html`](zh.html) | 中文 |

Open either file in a browser. They are self-contained apart from Google Fonts.

## Basis

Numbers and call order were read from cgenie.cookie commit `ed0eacff` (2026-08-26): `genie-main/genie.F`, `genie_loop_wrappers.f90`, `runcookie.sh`, the module sources and `genie-main/src/xml-config/xml/definition.xml`. Time steps are those `runcookie.sh` writes for the default 36×36×16 grid (worjh2 topography, CBSR base configuration). Parameter values marked "XML default" may be overridden by a user config.

The cGENIE.cookie manual lives at [genie-model/cookiedoc](https://github.com/genie-model/cookiedoc).
