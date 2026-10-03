# Purrl Tickers v2: front-facing 28x28 PFPs in the style of the user's reference:
# square face framed by a fur fringe, 2x2 eyes under a darker lid, a small off-centre
# smirk, soft dark outline with a faint halo, pastel background with sparkles.
import json, sys
W = 28
OUT = sys.argv[1] if len(sys.argv) > 1 else 'tickers/v2'
def rgb(h): return [int(h[i:i + 2], 16) for i in (1, 3, 5)]
def shade(h, t): return '#%02x%02x%02x' % tuple(round(v * t) for v in rgb(h))
def tint(h, t): return '#%02x%02x%02x' % tuple(round(v + (255 - v) * t) for v in rgb(h))
def R(x0, y0, x1, y1): return {(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)}
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1))
def ring(c): return {(x + a, y + b) for x, y in c for a, b in N4 if (x + a, y + b) not in c and 0 <= x + a < W and 0 <= y + b < W}

# the logo as a head: tall left ear, shorter right ear, notched chin
EAR_L, EAR_R = R(7, 4, 10, 7), R(17, 5, 20, 7)
HEAD = EAR_L | EAR_R | R(7, 8, 20, 19) | R(8, 20, 19, 20)
NECK = R(11, 21, 16, 22)
BODY = R(7, 23, 20, 23) | R(5, 24, 22, 24) | R(4, 25, 23, 27)
FIG = HEAD | NECK | BODY
FACE = R(9, 12, 18, 20) - {(9, 20), (18, 20)}
FRINGE = {(x, 12) for x in (9, 11, 13, 15, 17)} | {(9, 13), (18, 12)}

class G:
    def __init__(s): s.g = [['.'] * W for _ in range(W)]; s.fig = set(FIG)
    def put(s, cells, c):
        for x, y in cells:
            if 0 <= x < W and 0 <= y < W: s.g[y][x] = c
    def spr(s, x0, y0, rows):
        for y, r in enumerate(rows):
            for x, c in enumerate(r):
                if c != ' ': s.put([(x0 + x, y0 + y)], c)
    def shape(s, x0, y0, rows):     # accessory with its own outline and halo
        cells = {(x0 + x, y0 + y) for y, r in enumerate(rows) for x, c in enumerate(r) if c != ' '}
        o = {p for p in ring(cells) if p not in s.fig}
        s.put({p for p in ring(cells | o) if p not in s.fig and s.g[p[1]][p[0]] in '.x'}, 'h')
        s.put(o, 'o'); s.spr(x0, y0, rows); s.fig |= cells | o
    def text(s): return '\n'.join(''.join(r) for r in s.g) + '\n'

MOODS = {'up': '#d6ecd9', 'down': '#f2d6d6', 'ath': '#f5e6b8', 'dump': '#cfd6e6', 'earnings': '#e3d6f2'}

def base(g):
    out = ring(FIG)
    g.put(ring(FIG | out), 'h'); g.put(out, 'o')
    g.put(HEAD, 'F'); g.put({(x, y) for x, y in HEAD if x in (7, 20)} | R(8, 19, 8, 20) | R(19, 19, 19, 20), 'f')
    g.put(R(8, 5, 9, 7) | R(18, 6, 19, 7), 'i')                      # inner ears
    g.put(FACE - FRINGE, 'S')
    g.put(R(9, 20, 18, 20) - {(9, 20), (18, 20)}, 's')              # chin shadow
    g.put(NECK, 'S'); g.put(R(11, 21, 16, 21), 's')
    g.put(BODY, 'J'); g.put({(x, y) for x, y in BODY if x <= 5 or x >= 22}, 'j')
    g.put(R(11, 23, 16, 27), 'T')                                     # shirt in the open jacket
    g.put({(10, 24), (10, 25), (17, 24), (17, 25), (11, 23), (16, 23)}, 'o')   # lapels
    g.put(R(12, 24, 12, 27) | R(15, 24, 15, 27), 'p')                 # straps in the ticker colour
    for x, y in [(3, 13), (23, 5)]: g.put({(x, y - 1), (x - 1, y), (x, y), (x + 1, y), (x, y + 1)}, 'x')

def face(g, mood):
    g.put(R(10, 14, 12, 14) | R(15, 14, 17, 14), 's')                # lids
    g.put(R(11, 15, 12, 16) | R(15, 15, 16, 16), 'k')                # eyes
    if mood in ('up', 'ath'): g.put({(14, 18), (15, 18), (13, 19)}, 'm') if mood == 'up' else (g.put(R(13, 18, 15, 18), 'm'), g.put({(14, 19)}, 'q'))
    if mood in ('down', 'dump'): g.put({(12, 18), (13, 18), (14, 19)}, 'm'); g.put({(12, 13), (15, 13)}, 's')
    if mood == 'dump': g.put({(11, 17), (11, 18), (16, 17)}, 't')
    if mood == 'earnings': g.put(R(14, 18, 14, 19), 'm'); g.put(R(11, 14, 12, 14) | R(15, 14, 16, 14), 'S')
def mood_extras(g, mood):
    if mood == 'ath':
        g.shape(11, 3, ['y  y  y'[:0] or 'y y  y'[:0] or 'y yy y', 'yyyyyy', 'yryyby', 'yyyyyy'])
        g.put({(22, 9), (21, 10), (22, 10), (23, 10), (22, 11)}, 'w')
    if mood == 'earnings': g.shape(23, 8, ['w', 'w', 'w', ' ', 'w'])
    if mood == 'dump': g.shape(1, 3, [' cc ', 'cccc']); g.put({(2, 6), (4, 7), (1, 8)}, 't')

def ACC(name):
    s = lambda *a: (lambda g: g.shape(*a))
    return {
        'cap': lambda g: (g.shape(7, 4, ['  cccccccccc  '[:0] or ' cccccccccccc ', 'cccccccccccccc', 'cccccccccccccc', 'cccccccccccccc', 'CCCCCCCCCCCCCCCC'[:14]]), g.shape(14, 9, ['CCCCCCCCC'])),
        'glasses': lambda g: g.spr(9, 14, ['gggg  gggg'[:0] or ' gggggggg ', 'gg  gg  gg'[:0] or 'g g    g g'[:0] or 'g        g', 'g        g', ' gggggggg ']),
        'shades': lambda g: (g.put(R(10, 14, 17, 16), 'k'), g.put({(11, 15), (15, 15)}, 'w'), g.put({(13, 15), (14, 15)}, 'k')),
        'visor': lambda g: (g.shape(8, 14, ['vvvvvvvvvvvv', 'vVVVVVVVVVVv', 'vvvvvvvvvvvv'])),
        'phones': lambda g: (g.shape(5, 2, ['   bbbbbbbbbbbb   '[:0] or '  bbbbbbbbbbbbbb  '[:18], ' b              b ', 'b                b', 'b                b', 'b                b', 'b                b', 'b                b', 'b                b', 'b                b', 'b                b']), g.shape(4, 12, ['bb', 'BB', 'bb', 'bb', 'bb']), g.shape(22, 12, ['bb', 'BB', 'bb', 'bb', 'bb'])),
        'beanie': lambda g: (g.shape(7, 4, ['rrrrrrbbbbbbbb'[:0] or ' rrrrrrbbbbbb ', 'rrrrrrrbbbbbbb', 'yyyyyyyggggggg', 'yyyyyyyggggggg']), g.shape(13, 1, ['kk', ' k'][:0] or ['k']), g.shape(11, 0, ['rr kk bb'[:0] or 'rr  bb'])),
        'chain': lambda g: g.spr(10, 23, ['y      y', ' y    y ', '  yYYy  '[:0] or '  yyyy  ', '   YY   ']),
        'band': lambda g: (g.put(R(7, 10, 20, 11), 'w'), g.put({(9, 10), (12, 10), (15, 10), (18, 10)}, 'r')),
        'none': lambda g: None,
    }[name]

TICKERS = {  # ticker: fur, jacket, accent (straps), accessory, extra palette
    'NVDA':  ('#5c5c66', '#26262c', '#76b900', 'none', {}),
    'TSLA':  ('#e6e2da', '#cc2b2b', '#ffffff', 'cap', {'c': '#202024', 'C': '#101014'}),
    'AAPL':  ('#b8bcc4', '#1a1a1e', '#3a3a40', 'glasses', {'g': '#4a4a52'}),
    'AMZN':  ('#c98a4a', '#232f3e', '#ff9900', 'shades', {}),
    'MSFT':  ('#6fa6dc', '#e9e9ec', '#00a4ef', 'phones', {'b': '#3a3d48', 'B': '#6a6e7c'}),
    'GOOGL': ('#e8d6b4', '#ffffff', '#ea4335', 'beanie', {'r': '#ea4335', 'b': '#4285f4', 'y': '#fbbc05', 'g': '#34a853'}),
    'META':  ('#4a7fe0', '#1d2a44', '#7fd6ff', 'visor', {'v': '#3a3d48', 'V': '#7fd6ff'}),
    'NFLX':  ('#34343a', '#b20710', '#ffffff', 'phones', {'b': '#e50914', 'B': '#ff6a70'}),
    'COIN':  ('#9cc0ff', '#0052ff', '#ffffff', 'chain', {'y': '#f2c14e', 'Y': '#fff1b0'}),
    'AMD':   ('#d9574f', '#141414', '#ed1c24', 'band', {'r': '#ed1c24'}),
}
def draw(ticker, mood):
    fur, jacket, accent, acc, extra = TICKERS[ticker]
    g = G(); base(g); face(g, mood); ACC(acc)(g); mood_extras(g, mood)
    bg = MOODS[mood]
    face_c = tint(fur, .4) if sum(rgb(fur)) < 600 else '#fbf8f2'
    pal = {'.': bg, 'h': shade(bg, .86), 'x': shade(bg, .92), 'o': '#1a1626', 'F': fur, 'f': shade(fur, .82), 'i': '#f0b4c4',
           'S': face_c, 's': shade(face_c, .86), 'k': '#14101c', 'm': shade(fur, .5) if sum(rgb(fur)) > 300 else '#1a1626',
           'J': jacket, 'j': shade(jacket, .8) if sum(rgb(jacket)) > 120 else tint(jacket, .12), 'T': '#24243a', 'p': accent,
           'q': '#ff7a9a', 't': '#5ab4ff', 'w': '#ffffff', 'y': '#f2c14e', 'r': '#e8344f', 'b': '#3d8bff', 'c': '#8a94a8'}
    pal.update(extra)
    used = {c for r in g.g for c in r}
    missing = used - set(pal); assert not missing, (ticker, mood, missing)
    return g.text(), {k: v for k, v in pal.items() if k in used}

if __name__ == '__main__':
    pals = {}
    for n, t in enumerate(TICKERS):
        txt, pal = draw(t, 'up'); name = f'{n:02d}-{t}'
        open(f'{OUT}/{name}.txt', 'w').write(txt); pals[name] = pal
    for m in MOODS:
        txt, pal = draw('NVDA', m); name = f'NVDA-{m}'
        open(f'{OUT}/{name}.txt', 'w').write(txt); pals[name] = pal
    json.dump(pals, open(f'{OUT}/palettes.json', 'w'), indent=1)
    print(len(pals))
