# Batch 9: polished base sprite. Ink outline, 2-tone cel shading, rim light,
# front arm overlapping the body, 3/4 view facing right, curated palettes.
import json
W=32
def rgb(h): return [int(h[i:i+2],16) for i in (1,3,5)]
def tint(h,t): return '#%02x%02x%02x'%tuple(round(v+(255-v)*t) for v in rgb(h))
def shade(h,t): return '#%02x%02x%02x'%tuple(round(v*(1-t)) for v in rgb(h))
def mix(a,b,t): return '#%02x%02x%02x'%tuple(round(x+(y-x)*t) for x,y in zip(rgb(a),rgb(b)))
def spans(d): return {(x,y) for y,ss in d.items() for a,b in ss for x in range(a,b+1)}
EARS=spans({10:[(9,10)],11:[(8,11)],12:[(8,11),(20,21)],13:[(8,11),(19,22)]})
NOTCH=spans({10:[(9,20)],11:[(8,22)],12:[(8,22)],13:[(8,22)]})-spans({10:[(21,22)],11:[(22,22)]})
HEAD=spans({14:[(7,23)],**{y:[(7,23)] for y in range(15,22)},22:[(8,22)],23:[(9,21)]})
BODY=spans({24:[(10,20)],25:[(9,21)],26:[(9,21)],27:[(9,21)],28:[(9,21)],29:[(10,20)]})
LEGS=spans({30:[(11,14),(17,20)],31:[(11,15),(17,21)]})
ARM_B=spans({25:[(7,8)],26:[(7,8)],27:[(8,8)]})
ARM_F=spans({25:[(21,22)],26:[(20,23)],27:[(20,23)],28:[(21,22)]})
FACE=spans({16:[(14,21)],17:[(13,22)],18:[(13,22)],19:[(13,22)],20:[(13,22)],21:[(14,22)],22:[(15,21)]})
BELLY=spans({25:[(13,18)],26:[(12,19)],27:[(12,19)],28:[(12,19)],29:[(13,18)]})
N4=((1,0),(-1,0),(0,1),(0,-1))
def ring(c):
    return {(x+dx,y+dy) for x,y in c for dx,dy in N4 if (x+dx,y+dy) not in c and 0<=x+dx<W and 0<=y+dy<W}
class G:
    def __init__(s): s.g=[['.']*W for _ in range(W)]; s.fig=set()
    def put(s,cells,c):
        for x,y in cells:
            if 0<=x<W and 0<=y<W: s.g[y][x]=c
    def at(s,x,y): return s.g[y][x]
    def spr(s,x0,y0,rs):
        for y,r in enumerate(rs):
            for x,c in enumerate(r):
                if c!=' ': s.put([(x0+x,y0+y)],c)
    def shape(s,x0,y0,rs,over=False):
        cells={(x0+x,y0+y) for y,r in enumerate(rs) for x,c in enumerate(r) if c!=' '}
        s.put({p for p in ring(cells) if over or p not in s.fig},'O'); s.spr(x0,y0,rs); s.fig|=cells
    def text(s): return '\n'.join(''.join(r) for r in s.g)+'\n'
def shade_mass(g,cells,base,dark,light):
    g.put(cells,base)
    g.put({(x,y) for x,y in cells if (x-1,y) not in cells or (x-2,y) not in cells and (x,y+1) not in cells},dark)
    g.put({(x,y) for x,y in cells if (x,y-1) not in cells and (x-1,y) in cells and (x+1,y) in cells},light)
def figure(g,hat,cloth):
    head=HEAD|(NOTCH|EARS if hat else EARS)
    fig=head|BODY|LEGS|ARM_B|ARM_F
    g.fig=set(fig)
    g.put(ring(fig),'O')
    shade_mass(g,head,'F','f','h')
    g.put({(x,y) for x,y in head if (x+1,y) not in head and y>=15},'f')     # far cheek turns away
    g.put(FACE,'b'); g.put({(x,y) for x,y in FACE if (x,y+1) not in FACE},'B')
    if cloth:
        shade_mass(g,BODY|ARM_B,'C','c','l'); g.put(BELLY-{(13,25),(18,25)},'L') if cloth=='belly' else None
    else:
        shade_mass(g,BODY|ARM_B,'F','f','F'); g.put(BELLY,'b'); g.put({(x,y) for x,y in BELLY if (x,y+1) not in BELLY},'B')
    g.put(ARM_B,'c' if cloth else 'f')
    # front arm sits over the body: ink line where it overlaps
    g.put({p for p in ring(ARM_F) if p in BODY},'O')
    g.put(ARM_F,'C' if cloth else 'F'); g.put({(21,28),(22,28)},'F')   # paw peeks out of the sleeve
    g.put({(20,26),(20,27)},'c' if cloth else 'f')
    g.put(LEGS,'F'); g.put({(x,31) for x in range(11,16)}|{(x,31) for x in range(17,22)},'s')
    g.put({(11,30),(17,30)},'f')
    # face: no nose. near eye 2x3, far eye 2x3 nearer the cheek edge, glossy highlight
    g.spr(14,17,['kk','kk','kk']); g.spr(19,17,['kk','kk','kk'])
    g.spr(13,20,['p']); g.spr(21,20,['p'])
    g.spr(16,21,['kkk'])
out={}
def char(name,bg,fur,draw,cloth=None,hat=False,extra=None):
    g=G(); figure(g,hat,cloth); draw(g)
    pal={'.':bg,'O':'#241a2a','F':fur,'f':shade(fur,.2),'h':tint(fur,.4),'b':tint(fur,.62),'B':tint(fur,.38),
         'k':'#1c1424','w':'#ffffff','p':mix(tint(fur,.5),'#ff6f91',.55),'s':shade(fur,.42)}
    if cloth: pal.update({'C':cloth,'c':shade(cloth,.2),'l':tint(cloth,.3),'L':tint(cloth,.25)})
    pal.update(extra or {})
    used={ch for row in g.g for ch in row}
    out[name]=(g,{k:v for k,v in pal.items() if k in used})

# 01 knit beanie
char('01-beanie','#dfe9d8','#fff1d6',lambda g:(
    g.shape(13,6,['  y  ',' yYy ','  y  ']),
    g.shape(7,8,['   mmmmmmmmmmm   ','  mmmmmmmmmmmmm  ',' MmMmMmMmMmMmMmMm',''.join('Mm'[i%2] for i in range(17)),'rrrrrrrrrrrrrrrrr','RrRrRrRrRrRrRrRrR'][:6])),
    cloth='#5a7d6a',hat=True,extra={'m':'#f2a93b','M':'#d68a24','r':'#ffd27a','R':'#e8b25a','y':'#fff6e0','Y':'#f2e2c0'})
# 02 headphones
char('02-headphones','#ece4ff','#b9a2ff',lambda g:(
    g.spr(8,8,[' OOOOOOOOOOOOO ','O             O']),g.put({(8,10),(22,10),(8,11),(22,11)},'O'),
    g.shape(4,14,[' hh','hhh','hHh','hHh','hhh',' hh']),g.shape(23,14,['hh','hh','hh','hh','hh']),
    g.put({(9,9),(10,9),(11,9),(12,9),(13,9),(14,9),(15,9),(16,9),(17,9),(18,9),(19,9),(20,9),(21,9)},'d')),
    cloth='#2b2d42',extra={'h':'#ff6f91','H':'#ffd1dc','d':'#ff6f91'})
# 03 crown
char('03-crown','#fbeedd','#ffb37a',lambda g:(
    g.shape(11,8,['y  y  y  y','yy yyyy yy','yyyyyyyyyy','yrYyyyYqyy','YYYYYYYYYY'])),
    cloth='#7a2a4a',extra={'y':'#ffd35a','Y':'#e0a628','r':'#ff4f6a','q':'#4fa8ff'})
# 04 shades
char('04-shades','#d9f1ff','#5fd0c0',lambda g:(
    g.spr(12,17,['OOOOOOOOOOO','OgwgOOOgwgO','OOggO OOggO'][:3]),g.put({(17,18),(17,19)},'b')),
    cloth='#ff7a59',extra={'g':'#2a3a5a','w':'#9ed8ff'})
# 05 backwards cap
char('05-cap','#ffe9ec','#9fd36a',lambda g:(
    g.shape(3,9,['      cccccccccc    ','    cccccccccccccc  ','   ccccccccccccccccc','vvvvCCCCCCCCCCCCCCCC'][:4]),g.put({(15,9)},'w')),
    cloth='#ffffff',hat=True,extra={'c':'#3d6fff','C':'#2a4fc9','v':'#2a4fc9','l':'#ffffff','L':'#eef2ff'})
# 06 flower
char('06-flower','#fff7e0','#ff9ec2',lambda g:(
    g.shape(5,6,[' ee ee','eeeeee','eeyyee','eeyyee','eeeeee',' ee ee']),g.shape(11,10,[' gg','gg '])),
    extra={'e':'#ffffff','y':'#ffd23f','g':'#5ab86a'})
# 07 headband
char('07-headband','#e8f2ff','#ffd06b',lambda g:(
    g.put({(x,y) for x in range(7,24) for y in (14,15)},'r'),g.put({(x,15) for x in range(7,24)},'R'),
    g.shape(2,13,['rr   ',' rrrr','rr  ','r   '][:4])),
    cloth='#25324a',extra={'r':'#e8344f','R':'#b82a3e'})
# 08 halo
char('08-halo','#f4f0ff','#f4f4f8',lambda g:(
    g.shape(10,5,['  yyyyyyy  ','yy       yy','  yyyyyyy  '])),
    extra={'y':'#ffd35a'})
# 09 bow
char('09-bow','#e9fbf3','#c9b8ff',lambda g:(
    g.shape(11,9,['rr     rr','rrrr rrrr','rrrrRrrrr','rrr   rrr'],over=True)),
    cloth='#ff8fb8',extra={'r':'#ff4f8a','R':'#c22a62'})
# 10 laurel
char('10-laurel','#eef0e6','#a8e0ff',lambda g:(
    [g.shape(x,y,[c]) for x,y,c in [(7,13,'g'),(8,12,'G'),(9,11,'g'),(12,13,'G'),(14,13,'g'),(16,13,'G'),(18,13,'g'),(20,12,'G'),(21,11,'g'),(23,13,'G')]],
    g.put({(x,14) for x in range(7,24)},'G')),
    cloth='#f4efe2',extra={'g':'#ffd35a','G':'#d6a628'})
for name,(g,pal) in out.items():
    open(f'/home/user/CryptoPurrl/art/batch9/{name}.txt','w').write(g.text())
json.dump({k:v[1] for k,v in out.items()},open('/home/user/CryptoPurrl/art/batch9/palettes.json','w'),indent=1)
print(len(out))
