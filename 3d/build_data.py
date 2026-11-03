#!/usr/bin/env python3
"""Build 3d/data/cgenie_inputs.js: the real worjh2 boundary conditions for the cGENIE 3D page.

cGENIE has not been run here, so there are no model-state fields (T, S, currents, PO4, DIC,
pCO2). The page shows only what the model reads in, exactly as the CBSR worjh2 base config
(genie-baseconfigs/cookie.CBSR.p_worjh2.BASES.config) points to it:

  genie-paleo/p_worjh2/worjh2.k1            bottom level k1 of every column, runoff codes 91-94
  genie-paleo/p_worjh2/taux_u.interp ...    wind stress at u and v points (ea_taux_u etc.)
  genie-paleo/p_worjh2/uncep.silo, vncep    winds that advect EMBM heat and moisture (ea_adv_u/v)
  genie-paleo/p_worjh2/worjh2.albd.dat      zonal planetary albedo (ea_par_albedo1d_name)
  genie-paleo/p_worjh2/worjh2.psiles/.paths island mask and the path integral for the barotropic solve
  genie-paleo/p_worjh2/worjh2_topo.36x36    sediment-grid depth (sg_par_sed_topo_D_name)
  genie-paleo/p_worjh2/worjh2_reef_mask...  shallow-water carbonate (reef) cells
  genie-biogem/data/input/windspeed.dat     wind speed for air-sea gas exchange (bg_par_windspeed_file)

The grid is built the way initialise_goldstein.F builds it: 36 equal steps in sin(latitude),
36 x 10 deg in longitude starting at gm_par_grid_lon_offset = -260, and 16 levels whose
thickness grows exponentially (ez0 = 0.1) down to go_par_dsc = 5000 m. Runoff routing follows
readroff.f. No external modules are needed:  python3 3d/build_data.py
"""
import json
import math
import os
import subprocess

COOKIE = os.path.expanduser('~/cgenie.cookie')
PALEO = os.path.join(COOKIE, 'genie-paleo', 'p_worjh2')
WIND = os.path.join(COOKIE, 'genie-biogem', 'data', 'input', 'windspeed.dat')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'cgenie_inputs.js')

NI, NJ, NK = 36, 36, 16
LON0 = -260.0          # gm_par_grid_lon_offset
DSC = 5000.0           # go_par_dsc
EZ0 = 0.1              # initialise_goldstein.F


def nums(path):
    with open(path) as f:
        return [float(x) for x in f.read().split()]


def rows_north_first(path, ncol=NI, nrow=NJ):
    """Files read with DO j=n_j,1,-1 (sub_load_data_ij): first line is the northern row."""
    v = nums(path)
    assert len(v) == ncol * nrow, (path, len(v))
    out = [0.0] * (ncol * nrow)
    for r in range(nrow):
        j = nrow - 1 - r
        out[j * ncol:(j + 1) * ncol] = v[r * ncol:(r + 1) * ncol]
    return out


def grid():
    s0, s1 = -1.0, 1.0
    ds = (s1 - s0) / NJ
    sv = [s0 + j * ds for j in range(NJ + 1)]                     # cell edges in sin(lat)
    s = [sv[j + 1] - 0.5 * ds for j in range(NJ)]                  # centres
    lat_e = [math.degrees(math.asin(max(-1, min(1, x)))) for x in sv]
    lat_c = [math.degrees(math.asin(x)) for x in s]
    # vertical: same loop as initialise_goldstein.F (k = 1 bottom ... 16 top)
    z1 = EZ0 * ((1.0 + 1 / EZ0) ** (1.0 / NK) - 1.0)
    dz = [0.0] * (NK + 1)
    tv2 = 0.0
    for k in range(1, NK + 1):
        tv3 = EZ0 * ((z1 / EZ0 + 1) ** k - 1)
        dz[NK - k + 1] = tv3 - tv2
        tv2 = tv3
    zw = [0.0] * (NK + 1)                                          # zw(kmax) = 0 at the surface
    for k in range(NK, 0, -1):
        zw[k - 1] = zw[k] - dz[k]
    depth_e = [round(-zw[k] * DSC, 1) for k in range(NK + 1)]     # depth of the top of level k+1 ... index 0 = bottom
    # report top-down: edges[0] = 0 m, edges[16] = 5000 m
    edges = [round(-zw[NK - n] * DSC, 1) for n in range(NK + 1)]
    return {
        'ni': NI, 'nj': NJ, 'nk': NK, 'lon0': LON0, 'dlon': 360.0 / NI,
        'sEdges': [round(x, 6) for x in sv], 'latEdges': [round(x, 4) for x in lat_e],
        'latC': [round(x, 4) for x in lat_c],
        'depthEdges': edges,                                        # top-down, m
        'depthC': [round(0.5 * (edges[n] + edges[n + 1]), 1) for n in range(NK)],
    }, depth_e


def read_k1():
    """worjh2.k1: 38 x 38 with halo, first line j = jmax+1 (north halo)."""
    with open(os.path.join(PALEO, 'worjh2.k1')) as f:
        lines = [l.split() for l in f if l.strip()]
    assert len(lines) == NJ + 2
    k1 = {}
    for r, l in enumerate(lines):
        j = NJ + 1 - r
        vals = [int(x) for x in l]
        assert len(vals) == NI + 2
        for i in range(NI + 2):
            k1[(i, j)] = vals[i]
    for j in range(NJ + 2):                                        # periodic halo, as in the model
        k1[(0, j)] = k1[(NI, j)]
        k1[(NI + 1, j)] = k1[(1, j)]
    return k1


def runoff_routing(k1):
    """readroff.f: follow the 91 (E), 92 (S), 93 (W), 94 (N) codes until an ocean cell."""
    dest = [-1] * (NI * NJ)
    for j in range(1, NJ + 1):
        for i in range(1, NI + 1):
            if k1[(i, j)] <= NK:
                continue
            ii, jj, n = i, j, 0
            while k1[(ii, jj)] > NK:
                c = k1[(ii, jj)]
                if c == 91:
                    ii += 1
                elif c == 92:
                    jj -= 1
                elif c == 93:
                    ii -= 1
                elif c == 94:
                    jj += 1
                if ii == NI + 1:
                    ii = 1
                elif ii == 0:
                    ii = NI
                n += 1
                if n > 1000:
                    raise SystemExit('runoff loop at %d %d' % (i, j))
            dest[(j - 1) * NI + (i - 1)] = (jj - 1) * NI + (ii - 1)
    return dest


def islands():
    """worjh2.psiles: psi points j = 36..0 (north first), value = landmass number (0 = ocean)."""
    v = [int(float(x)) for x in nums(os.path.join(PALEO, 'worjh2.psiles'))]
    assert len(v) == NI * (NJ + 1)
    ps = [0] * (NI * (NJ + 1))
    for r in range(NJ + 1):
        j = NJ - r
        ps[j * NI:(j + 1) * NI] = v[r * NI:(r + 1) * NI]
    with open(os.path.join(PALEO, 'worjh2.paths')) as f:
        tok = f.read().split()
    isles = max(ps) - 1
    npi = [int(tok[n]) for n in range(isles)]
    p, paths = isles, []
    for n in npi:
        path = []
        for _ in range(n):
            path.append([int(tok[p]), int(tok[p + 1]), int(tok[p + 2])])
            p += 3
        paths.append(path)
    return ps, paths


def git_rev():
    try:
        return subprocess.check_output(['git', '-C', COOKIE, 'log', '-1', '--format=%h %ad', '--date=short'],
                                       text=True).strip()
    except Exception:
        return ''


def main():
    g, _ = grid()
    k1 = read_k1()
    K1 = [k1[(i, j)] for j in range(1, NJ + 1) for i in range(1, NI + 1)]
    lev = [NK - k + 1 if k <= NK else 0 for k in K1]               # number of wet levels
    route = runoff_routing(k1)

    def vec(name):                                                  # (i fastest, j from the south)
        v = nums(os.path.join(PALEO, name))
        assert len(v) == NI * NJ, name
        return [round(x, 5) for x in v]

    ws = rows_north_first(WIND)
    ws = [None if x < -1e10 else round(x, 3) for x in ws]
    alb_n = nums(os.path.join(PALEO, 'worjh2.albd.dat'))           # read DO j=jmax,1,-1
    alb = list(reversed(alb_n))
    sed = rows_north_first(os.path.join(PALEO, 'worjh2_topo.36x36'))
    reef = rows_north_first(os.path.join(PALEO, 'worjh2_reef_mask.36x36'))
    psiles, paths = islands()

    state = {
        'meta': {
            'source': 'cgenie.cookie ' + git_rev() + ' · genie-paleo/p_worjh2 · CBSR worjh2 base config',
            'note': 'boundary conditions only; cGENIE has not been run, so no model-state fields',
        },
        'grid': g,
        'k1': K1, 'nlev': lev, 'runoffTo': route,
        'tau': {'xu': vec('taux_u.interp'), 'yu': vec('tauy_u.interp'), 'xv': vec('taux_v.interp'), 'yv': vec('tauy_v.interp')},
        'uatm': vec('uncep.silo'), 'vatm': vec('vncep.silo'),
        'windspeed': ws, 'albedo': [round(x, 4) for x in alb],
        'sedDepth': [round(x, 1) for x in sed], 'reef': [int(x) for x in reef],
        'psiles': psiles, 'paths': paths,
    }
    js = '/* generated by 3d/build_data.py — do not edit */\nwindow.CGENIE_INPUTS = ' + json.dumps(state, separators=(',', ':')) + ';\n'
    with open(OUT, 'w') as f:
        f.write(js)
    wet = sum(1 for x in lev if x)
    print('wrote %s (%.0f kB): %d wet columns, %d islands, depth edges %s' % (
        OUT, len(js) / 1024, wet, len(paths), g['depthEdges']))


if __name__ == '__main__':
    main()
