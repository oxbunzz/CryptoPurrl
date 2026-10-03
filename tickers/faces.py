# Eye and mouth options on one Purrl, each shown in an up and a down mood.
import json, sys
sys.path.insert(0, 'tickers')
from draw import G, ring, FIG, HEAD_C, NECK, BODY
FACES = {
    # name: (eye rows at x=11,y=9), {mood: (mouth x, y, rows)}
    'A-punk': (['f   f ', 'wk  wk'], {'up': (13, 14, ['kkk', '   k'][:1] + []), 'down': (13, 14, ['kkk'])}),
    'B-dot':  ([' ', 'kk  kk', 'kk  kk'], {'up': (14, 14, ['kk']), 'down': (14, 14, ['kk'])}),
    'C-shine': ([' ', 'wk  wk', 'kk  kk'], {'up': (13, 14, ['k  k'[:0] or 'kkk']), 'down': (13, 14, ['kkk'])}),
    'D-sleepy': ([' ', 'ff  ff', 'kk  kk'], {'up': (13, 14, ['kkk']), 'down': (13, 14, ['kkk'])}),
    'E-big':  (['kkk kkk'[:0] or 'fff fff', 'wwk wwk', 'wkk wkk'], {'up': (14, 14, ['kk']), 'down': (14, 14, ['kk'])}),
    'F-side': ([' ', ' k   k', 'wk  wk'], {'up': (14, 14, ['kkk']), 'down': (14, 14, ['kkk'])}),
}
def corners(g, x, y, w, mood):
    # mood lives in one pixel at the mouth's front corner, the way Punks do it
    if mood == 'up': g.put([(x + w, y - 1)], 'k')
    else: g.put([(x + w, y + 1)], 'k')
pals = {}
for name, (eyes, mouths) in FACES.items():
    for mood in ('up', 'down'):
        g = G(); g.put(ring(FIG), 'K'); g.put(HEAD_C | NECK, 'F'); g.put(BODY, 'C'); g.put({(x, 20) for x in range(10, 15)}, 'F')
        g.spr(11, 9, eyes)
        mx, my, rows = mouths[mood]; g.spr(mx, my, rows); corners(g, mx, my, len(rows[0]), mood)
        if name == 'A-punk': g.put([(mx + 1, my + 1)], 'l')                 # lower lip shade
        key = f'{name}-{mood}'
        open(f'tickers/faces/{key}.txt', 'w').write(g.text())
        pals[key] = {'.': '#8fc4a0' if mood == 'up' else '#d99a9a', 'K': '#000000', 'k': '#000000', 'F': '#c8a07a', 'f': '#a07a58', 'l': '#a07a58', 'C': '#2b3a5a', 'w': '#ffffff'}
json.dump(pals, open('tickers/faces/palettes.json', 'w'), indent=1)
print(len(pals))
