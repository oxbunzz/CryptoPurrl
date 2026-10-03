# Purrl Tickers: CryptoPunks-style 24x24 busts. One Purrl per stock ticker; the face and
# background follow the stock's mood (up, down, all-time high, dump, earnings day).
import json, sys
W = 24
OUT = sys.argv[1] if len(sys.argv) > 1 else 'art'

HEAD = ['###.........', '###......###', '###......###', *['############'] * 9, '.##########.']
X0, Y0 = 6, 4                                           # head top-left
HEAD_C = {(X0 + x, Y0 + y) for y, r in enumerate(HEAD) for x, c in enumerate(r) if c == '#'}
NECK = {(x, y) for x in range(10, 15) for y in range(17, 20)}
BODY = {(x, y) for y in range(20, 24) for x in range(4 if y > 20 else 5, 20 if y > 20 else 19)}
FIG = HEAD_C | NECK | BODY
N4 = ((1, 0), (-1, 0), (0, 1), (0, -1))
def ring(c): return {(x + a, y + b) for x, y in c for a, b in N4 if (x + a, y + b) not in c and 0 <= x + a < W and 0 <= y + b < W}

MOODS = {
    'up':       {'bg': '#8fc4a0'},
    'down':     {'bg': '#d99a9a'},
    'ath':      {'bg': '#e8c96a'},
    'dump':     {'bg': '#7d8aa8'},
    'earnings': {'bg': '#b49ad6'},
}
class G:
    def __init__(s): s.g = [['.'] * W for _ in range(W)]
    def put(s, cells, c):
        for x, y in cells:
            if 0 <= x < W and 0 <= y < W: s.g[y][x] = c
    def spr(s, x0, y0, rows):
        for y, r in enumerate(rows):
            for x, c in enumerate(r):
                if c != ' ': s.put([(x0 + x, y0 + y)], c)
    def text(s): return '\n'.join(''.join(r) for r in s.g) + '\n'

def face(g, mood):
    # eyes look right: white then pupil
    g.spr(11, 10, ['wk  wk'])
    if mood == 'up':       g.spr(12, 13, ['k   k', ' kkk '])
    if mood == 'down':     g.spr(12, 13, [' kkk ', 'k   k'])
    if mood == 'ath':      g.spr(12, 13, ['k   k', ' kkk ']); g.spr(10, 9, ['k    k'][:0] or [' '])
    if mood == 'dump':     g.spr(12, 14, [' kkk ', 'k   k']); g.spr(12, 11, ['t   t', 't   t'])
    if mood == 'earnings': g.spr(13, 13, ['kkk', 'kok', 'kkk'])
    if mood in ('down', 'dump'): g.spr(11, 9, ['kk  kk'])          # worried brows

def mood_extras(g, mood):
    if mood == 'ath':                                          # crown sits on the head
        g.spr(8, 0, ['y  y  y', 'yy yy y', 'yyyyyyy', 'yryybyy'][:0] or [' '])
        g.spr(9, 0, ['y  y  y', 'yyyyyyy', 'yrybyry'])
        g.put({(x, 3) for x in range(9, 16)}, 'K')
        g.spr(20, 2, [' s ', 'sss', ' s '])
    if mood == 'earnings': g.spr(19, 3, ['e', 'e', 'e', ' ', 'e'])
    if mood == 'dump': g.spr(1, 1, [' rrr ', 'rrrrr', ' t t ', 't t  '])

TICKERS = {
    # ticker: fur, shirt, accessory drawer, extra palette
    'NVDA':  ('#5a5a64', '#1c1c22', lambda g: (g.put({(x, 10) for x in range(10, 18)}, 'v'), g.spr(11, 10, ['VV  VV'])), {'v': '#76b900', 'V': '#b6f05a'}),
    'TSLA':  ('#f2f0ea', '#cc2b2b', lambda g: (g.spr(5, 3, ['ccccccccccccccc'][:0] or [' ']), g.spr(6, 3, ['cccccccccccc', 'cccccccccccccccc'])), {'c': '#202024'}),
    'AAPL':  ('#c8ccd2', '#16161a', lambda g: g.put({(x, y) for x in range(9, 16) for y in range(17, 21)}, 'C'), {}),
    'AMZN':  ('#c98a4a', '#232f3e', lambda g: g.spr(10, 21, ['o   o', ' ooo ']), {'o': '#ff9900'}),
    'MSFT':  ('#7fb2e6', '#e8e8ea', lambda g: g.spr(10, 21, ['rg', 'by']), {'r': '#f25022', 'g': '#7fba00', 'b': '#00a4ef', 'y': '#ffb900'}),
    'GOOGL': ('#f2e6cc', '#ffffff', lambda g: (g.spr(8, 2, ['  bbrr  ', ' bbbrrr ', 'yyyyggggg'[:8]]), g.spr(11, 0, ['k', 'k']), g.spr(9, 0, ['bb kk rr'][:0] or ['bb', ]), g.spr(12, 0, ['rr'])), {'b': '#4285f4', 'r': '#ea4335', 'y': '#fbbc05', 'g': '#34a853'}),
    'META':  ('#4a7fe0', '#1d2a44', lambda g: (g.put({(x, y) for x in range(9, 19) for y in range(9, 12)}, 'h'), g.put({(x, 10) for x in range(10, 18)}, 'H'), g.put({(18, y) for y in range(9, 12)}, 'k')), {'h': '#3a3d48', 'H': '#7fd6ff'}),
    'NFLX':  ('#2a2a2e', '#b20710', lambda g: (g.spr(5, 7, ['hh', 'hh', 'hh', 'hh']), g.spr(17, 7, ['hh', 'hh', 'hh', 'hh']), g.put({(x, 3) for x in range(6, 19)}, 'h')), {'h': '#e50914'}),
    'COIN':  ('#9cc0ff', '#0052ff', lambda g: (g.spr(8, 20, ['  y  y  y  '[:0] or 'y y y y y y'[:0] or '']), g.put({(x, 20) for x in range(9, 16)}, 'y'), g.spr(11, 21, ['yyy', 'yYy', 'yyy'])), {'y': '#f2c14e', 'Y': '#fff1b0'}),
    'AMD':   ('#e0574f', '#141414', lambda g: (g.put({(x, 8) for x in range(6, 18)}, 'w'), g.put({(x, 8) for x in range(8, 18, 3)}, 'x')), {'x': '#ed1c24'}),
}
BASE = {'k': '#000000', 'K': '#000000', 'w': '#ffffff', 'o': '#000000', 't': '#5ab4ff', 'y': '#f2c14e', 'r': '#e8344f', 'b': '#3d8bff', 's': '#ffffff', 'e': '#ffffff', 'x': '#000000'}
def draw(ticker, mood):
    fur, shirt, acc, extra = TICKERS[ticker]
    g = G()
    g.put(ring(FIG), 'K'); g.put(HEAD_C | NECK, 'F'); g.put(BODY, 'C')
    g.put({(x, 20) for x in range(10, 15)}, 'F')                       # collar opening
    face(g, mood); acc(g); mood_extras(g, mood)
    pal = dict(BASE); pal.update({'.': MOODS[mood]['bg'], 'F': fur, 'C': shirt}); pal.update(extra)
    if mood == 'earnings': pal['o'] = '#7a1424'
    if mood == 'dump': pal['r'] = '#4a5470'; pal['t'] = '#5ab4ff'
    if mood == 'ath': pal['r'] = '#e8344f'; pal['b'] = '#3d8bff'
    used = {c for r in g.g for c in r}
    return g.text(), {k: v for k, v in pal.items() if k in used}

if __name__ == '__main__':
    pals = {}
    moods = list(MOODS)
    for n, t in enumerate(TICKERS):
        m = moods[n % len(moods)] if len(sys.argv) > 2 and sys.argv[2] == 'mixed' else 'up'
        txt, pal = draw(t, m); name = f'{n:02d}-{t}-{m}'
        open(f'{OUT}/{name}.txt', 'w').write(txt); pals[name] = pal
    for m in moods:
        txt, pal = draw('NVDA', m); name = f'NVDA-{m}'
        open(f'{OUT}/{name}.txt', 'w').write(txt); pals[name] = pal
    json.dump(pals, open(f'{OUT}/palettes.json', 'w'), indent=1)
    print(len(pals))
