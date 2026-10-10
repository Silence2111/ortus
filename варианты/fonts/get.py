"""Шрифты стенда — локально. fonts.googleapis.com из РФ отвечает через раз,
поэтому берём те же шрифты из пакетов Fontsource через jsDelivr один раз
и дальше раздаём сами (как «Студия» с Wix Madefor).
Запуск: python3 get.py golos-text:400,500,600 manrope:400,500,600 literata:400i …
Кладёт woff2 в эту папку и пересобирает fonts.css."""
import sys, urllib.request, pathlib, json

HERE = pathlib.Path(__file__).parent
# Диапазоны — как у Google Fonts. ₽ (U+20BD) живёт в latin-ext.
RANGES = {
    'cyrillic': 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116',
    'latin': 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    'latin-ext': 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
}
MANIFEST = HERE / 'manifest.json'
fonts = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}

for spec in sys.argv[1:]:
    fid, weights = spec.split(':')
    for w in weights.split(','):
        style = 'italic' if w.endswith('i') else 'normal'
        w = w.rstrip('i')
        for subset in RANGES:
            name = '%s-%s-%s-%s.woff2' % (fid, subset, w, style)
            p = HERE / name
            if not p.exists():
                url = 'https://cdn.jsdelivr.net/npm/@fontsource/%s@5/files/%s' % (fid, name)
                p.write_bytes(urllib.request.urlopen(url, timeout=60).read())
            fonts[name] = [fid, w, style, subset]
    print(fid, 'ok')

MANIFEST.write_text(json.dumps(fonts, ensure_ascii=False, indent=1))
FAMILY = lambda fid: ' '.join(x.capitalize() for x in fid.split('-'))
css = ['/* Сгенерировано get.py — руками не править. */']
for name, (fid, w, style, subset) in sorted(fonts.items()):
    css.append('@font-face{font-family:"%s";font-style:%s;font-weight:%s;font-display:swap;src:url(%s) format("woff2");unicode-range:%s}'
               % (FAMILY(fid), style, w, name, RANGES[subset]))
(HERE / 'fonts.css').write_text('\n'.join(css) + '\n')
