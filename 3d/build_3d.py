#!/usr/bin/env python3
"""Assemble the cGENIE 3D pages.

Inputs
  3d/src/page.html        page skeleton with @@CSS@@, @@CONTENT@@, @@APP@@ and @@LANGBOOT@@ placeholders
  3d/src/app.css          styles (shared look with the HadCM3 3D page)
  3d/src/app.js           the 3D application (ES module, three.js from jsDelivr)
  cGENIE_timestep_walkthrough_en.html   English step cards (STEPS) and module tables (MODS) of the 2D page
  3d/src/v1_cards_zh.js                 the same in Chinese

The input fields are not inlined: the page loads data/cgenie_inputs.js (made by build_data.py)
with a plain script tag, so it works from disk and when published with that file beside it.

Run: python3 3d/build_3d.py               -> 3d/cGENIE_3D.html (language follows the browser, toggle in the header)
                                             and 3d/cGENIE_3D_zh.html (opens in Chinese)
     python3 3d/build_3d.py --bare F      -> also F, the first page without the doctype/charset/viewport lines,
                                             for publishing as an Artifact (the host adds its own skeleton)
     python3 3d/build_3d.py --bare-zh F   -> the same for the Chinese page
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def read(*p):
    with open(os.path.join(*p), encoding='utf-8') as f:
        return f.read()


def cards_en():
    s = read(ROOT, 'cGENIE_timestep_walkthrough_en.html')
    a = s.index('  const DAY')
    m = s.index('  const MODS = [')
    return s[a:s.index('\n  ];', m) + len('\n  ];')]


def cards_zh():
    s = read(HERE, 'src', 'v1_cards_zh.js')
    return s[s.index('  const DAY'):]


def wrap(block):
    return '(function () {\n' + block.rstrip() + '\n  return { STEPS, MODS };\n})()'


def main():
    page = read(HERE, 'src', 'page.html')
    css = read(HERE, 'src', 'app.css')
    app = read(HERE, 'src', 'app.js')
    content = ('/* step cards and module tables of the 2D walkthrough (inlined by build_3d.py) */\n'
               'window.CG_V1 = { en: %s, zh: %s };\n' % (wrap(cards_en()), wrap(cards_zh())))
    out = page.replace('@@CSS@@', css).replace('@@CONTENT@@', content).replace('@@APP@@', app)
    zh = (out.replace('@@LANGBOOT@@', "<script>window.CG3D_LANG = 'zh';</script>\n")
             .replace('<title>cGENIE in 3D</title>', '<title>cGENIE 三维</title>')
             .replace(re.search(r'<meta name="description" content="[^"]*">', out).group(0),
                      '<meta name="description" content="cGENIE.cookie（worjh2，36 × 36 × 16）在三维地球上走完一轮主时间步：'
                      '各模块、各子程序按调用顺序作用在模式自己的网格上，边界条件取自真实的 worjh2 输入文件。">')
             .replace('Loading cGENIE inputs…', '正在载入 cGENIE 输入场…'))
    out = out.replace('@@LANGBOOT@@', '')
    head = ('<!doctype html>\n<html lang="%s">\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n')
    targets = [(os.path.join(HERE, 'cGENIE_3D.html'), head % 'en' + out),
               (os.path.join(HERE, 'cGENIE_3D_zh.html'), head % 'zh-CN' + zh)]
    for flag, text in (('--bare', out), ('--bare-zh', zh)):
        if flag in sys.argv:
            targets.append((sys.argv[sys.argv.index(flag) + 1], text))
    for dst, text in targets:
        with open(dst, 'w', encoding='utf-8') as f:
            f.write(text)
        print('wrote %s (%.0f kB)' % (dst, len(text.encode()) / 1024))


if __name__ == '__main__':
    main()
