# Batch 8: rounder chibi Purrls, colour outlines (no black ink), big glossy eyes, 3/4 view facing right.
import json
W=32
def rgb(h): return [int(h[i:i+2],16) for i in (1,3,5)]
def tint(h,t): return '#%02x%02x%02x'%tuple(round(v+(255-v)*t) for v in rgb(h))
def shade(h,t): return '#%02x%02x%02x'%tuple(round(v*(1-t)) for v in rgb(h))
def rows(spec): return {(x,y) for y,(a,b) in spec.items() for x in range(a,b+1)}
EARS=rows({13:(10,12),14:(10,12),15:(10,12)})|rows({14:(19,21),15:(19,21)})
NOTCH=rows({13:(13,21),14:(13,18),15:(13,18)})
HEAD=rows({**{y:(10,21) for y in range(16,23)},23:(11,20),24:(12,19)})
BODY=rows({25:(12,19),26:(11,20),27:(11,21),28:(11,21),29:(11,21),30:(12,20)})
FEET=rows({31:(12,14)})|rows({31:(17,20)})
ARM_B=rows({27:(9,10),28:(10,10)}); ARM_F=rows({27:(22,22),28:(22,23)})
BELLY=rows({26:(16,19),27:(15,20),28:(15,20),29:(15,20),30:(16,19)})
def ring(c):
    o=set()
    for x,y in c:
        for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
            n=(x+dx,y+dy)
            if n not in c and 0<=n[0]<W and 0<=n[1]<W: o.add(n)
    return o
class G:
    def __init__(s): s.g=[['.']*W for _ in range(W)]; s.fig=set()
    def put(s,cells,c):
        for x,y in cells:
            if 0<=x<W and 0<=y<W: s.g[y][x]=c
    def spr(s,x0,y0,rs):
        for y,r in enumerate(rs):
            for x,c in enumerate(r):
                if c!=' ': s.put([(x0+x,y0+y)],c)
    def shape(s,x0,y0,rs,o='o'):
        cells={(x0+x,y0+y) for y,r in enumerate(rs) for x,c in enumerate(r) if c!=' '}
        s.put({p for p in ring(cells) if p not in s.fig},o); s.spr(x0,y0,rs); s.fig|=cells
    def text(s): return '\n'.join(''.join(r) for r in s.g)+'\n'
def figure(g,hat,cloth):
    fig=HEAD|BODY|FEET|ARM_B|ARM_F|(EARS|NOTCH if hat else EARS)
    g.fig=set(fig)
    g.put(ring(fig),'O')
    g.put(fig,'F')
    g.put({(x,y) for x,y in fig if (x-1,y) not in fig}|{(x,y) for x,y in fig if (x-2,y) not in fig and y>=16}|ARM_B,'f')
    g.put({(x,y) for x,y in fig if (x,y-1) not in fig and (x-1,y) in fig},'h')
    g.put(BELLY,'b')
    if cloth:
        t={(x,y) for x,y in BODY|ARM_B|ARM_F if y>=26}
        g.put(t,'C'); g.put({(x,y) for x,y in t if (x-1,y) not in t or (x-2,y) not in t}|ARM_B,'c'); g.put(BELLY,'L')
        g.put({(23,28),(22,28)},'F')
    g.put(FEET,'s')
    # big glossy eyes, far eye slightly narrower; tiny smile; no nose
    g.spr(14,19,['wk','kk','kk']); g.spr(19,19,['w','k','k'])
    g.put([(13,22),(20,22)],'p'); g.spr(15,22,['k  k',' kk '])
    g.put({(17,23)},'F') if False else None
out={}
def char(name,bg,fur,draw,cloth=None,hat=False,extra=None):
    g=G(); figure(g,hat,cloth); draw(g)
    pal={'.':bg,'F':fur,'f':shade(fur,.18),'h':tint(fur,.35),'O':shade(fur,.62),'b':tint(fur,.5),
         'k':'#1e1626','w':'#ffffff','p':'#ff8fae','s':shade(fur,.35),'o':'#2c2438'}
    if cloth: pal.update({'C':cloth,'c':shade(cloth,.2),'L':tint(cloth,.3)})
    pal.update(extra or {})
    out[name]=(g,pal)

char('01-nightcap','#e3ecff','#9fd8ff',lambda g:(
    g.shape(3,8,[' wwBBBB',' ww   bbbbbbBBBB','       BBBBbbbbbbbb','       bbbbBBBBbbbb','      WWWWWWWWWWWWWW']),
    g.put([(17,27),(17,29)],'y')),
    cloth='#6a8cff',hat=True,extra={'B':'#4a6ad6','b':'#8fb0ff','W':'#ffffff','y':'#ffe066'})
char('02-wizard','#efe6ff','#ffd27a',lambda g:(
    g.shape(7,4,['           pp   ',
                 '         ppp    ',
                 '        pppp    ',
                 '       ppypp    ',
                 '      pppppp    ',
                 '     ppppppppp  ',
                 '    pyppppppppp ',
                 '   PPPPPPPPPPPP ',
                 'PPPPPPPPPPPPPPPPPP'][:9]),
    g.put([(17,27),(18,29)],'y')),
    cloth='#7a4ad6',hat=True,extra={'p':'#8a5ae6','P':'#5e36a8','y':'#ffe066'})
char('03-viking','#fff0e0','#e8a07a',lambda g:(
    g.shape(10,9,['   gggggg   ',' gggggggggg ','gggggggggggg','dddddddddddd']),
    g.shape(6,7,['n  ','nn ',' nnn','  nn']),g.shape(22,7,['  n',' nn','nnn ','nn  ']),
    g.spr(4,5,[' ']) ),
    cloth='#c94a4a',hat=True,extra={'g':'#b8c2d6','d':'#7a849a','n':'#f0d49a'})
char('04-flowers','#eaf7e6','#ff9ec2',lambda g:(
    g.put([(x,16) for x in range(10,22)],'g'),
    g.shape(10,14,['wyw   pYp   wyw'][:0] or [' ']),
    g.shape(12,14,['y']),g.shape(12,15,['w']),g.shape(11,15,['w']),g.shape(13,15,['w']),
    g.shape(15,15,['pYp']),g.shape(16,14,['p']),
    g.shape(18,15,['wyw']),g.shape(19,14,['w'])),
    extra={'g':'#5ab86a','y':'#ffd23f','Y':'#ffd23f','p':'#ff6fa0'})
char('05-propeller','#fff6d6','#7be0b0',lambda g:(
    g.shape(10,9,['   rrryyb   ',' rrrryyybbb ','rrrrryyybbbb','rrrrryyybbbb']),
    g.shape(16,7,['o','o']),g.shape(12,6,['RRRRoBBBB']) ),
    hat=True,extra={'r':'#ff5a5a','y':'#ffd23f','b':'#3d8bff','R':'#ff5a5a','B':'#3d8bff'})
char('06-summer','#d6f4ff','#ffb35a',lambda g:(
    g.spr(13,18,['ooooooooo','owkoowkoo','oookooooo'][:2]),
    g.shape(8,27,[' yyyyyyyyyyyyy ','yrryyyrryyyrryy','yrryyyrryyyrryy',' yyyyyyyyyyyyy '][:3])),
    extra={'y':'#ffd23f','r':'#ff6f6f'})
char('07-winter','#eef3f8','#c9b8ff',lambda g:(
    g.put([(x,12) for x in range(11,21)],'o'),
    g.shape(9,12,['mmmm','mmmm','mmmm','mmmm'][:4]),g.shape(19,13,['mmmm','mmmm','mmmm']),
    g.shape(11,25,['rrrrrrrrrrr']),g.shape(12,26,['rr','RR','rr','RR'])),
    extra={'m':'#ff8fc8','r':'#e8344f','R':'#ffffff'})
char('08-balloon','#ffeef0','#8ad8e8',lambda g:(
    g.put([(23,27),(23,26),(24,25),(24,24),(24,23),(25,22),(25,21),(25,20),(25,19),(25,18),(25,17)],'l'),
    g.shape(22,8,[' rrrr ','rrwrrr','rwrrrr','rrrrrr','rrrrrr',' rrrr ','  rr  ','  R   '][:8]),
    g.put([(14,16),(15,16),(16,16)],'F')),
    extra={'r':'#ff4f6a','R':'#c93a50','l':'#9a8ea8'})
char('09-umbrella','#e8f0f6','#b8e070',lambda g:(
    g.put([(23,y) for y in range(10,27)],'u'),
    g.shape(7,5,[''.join(' ' if not(a<=x<=b) else ('t' if (x//3)%2 else 'T') for x in range(7,27))[0:] for a,b in [(12,21),(10,23),(8,25),(7,26)]]+[''.join(('t' if (x//3)%2 else 'T') if x%3!=1 else ' ' for x in range(7,27))]),
    g.put([(17,27),(17,29)],'y'),g.put([(12,31),(13,31),(14,31),(17,31),(18,31),(19,31),(20,31)],'R')),
    cloth='#ffd23f',extra={'t':'#2fb8a0','T':'#ffffff','u':'#5a4a3a','y':'#ffffff','R':'#e8344f'})
char('10-boba','#fdf0e6','#d8b08a',lambda g:(
    g.shape(8,11,['r r','rrr','r r']),
    g.shape(22,22,['  s','  s','cccc','cmmc','cmmc','cddc','cddc'][:7])),
    extra={'r':'#ff5a7a','s':'#ff5a7a','c':'#f6efe6','m':'#c99a6e','d':'#3a2a2a'})
for name,(g,pal) in out.items():
    used={ch for row in g.g for ch in row}
    pal={k:v for k,v in pal.items() if k in used}
    open(f'/home/user/CryptoPurrl/art/batch8/{name}.txt','w').write(g.text())
    out[name]=(g,pal)
json.dump({k:v[1] for k,v in out.items()},open('/home/user/CryptoPurrl/art/batch8/palettes.json','w'),indent=1)
print(len(out))
