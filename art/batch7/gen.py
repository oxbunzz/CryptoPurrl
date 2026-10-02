import json
W=32
def tint(h,t):
    r,g,b=(int(h[i:i+2],16) for i in (1,3,5)); return '#%02x%02x%02x'%tuple(round(v+(255-v)*t) for v in (r,g,b))
def shade(h,t=0.22):
    r,g,b=(int(h[i:i+2],16) for i in (1,3,5)); return '#%02x%02x%02x'%tuple(round(v*(1-t)) for v in (r,g,b))
HEAD=['###.........','###......###','###......###',*['############']*8,'.##########.']
HEAD_C={(10+x,11+y) for y,r in enumerate(HEAD) for x,c in enumerate(r) if c=='#'}
ROWS={23:(11,20),24:(10,21),25:(9,22),26:(9,22),27:(9,22),28:(9,22),29:(9,22),30:(10,21)}
BODY_C={(x,y) for y,(a,b) in ROWS.items() for x in range(a,b+1)}|{(x,31) for x in (11,12,13,14,17,18,19,20,21)}
ARM_BACK={(7,25),(8,25),(7,26),(8,26),(8,27)}
ARM_FRONT={(23,26),(23,27),(24,27),(23,28),(24,28)}
FIG0=HEAD_C|BODY_C|ARM_BACK|ARM_FRONT
FULL={(x,y) for x in range(10,22) for y in (11,12,13)}
FIG=FIG0
FACE={(x,y) for y in range(15,22) for x in range(14,22)}-{(14,15),(21,15),(14,21),(21,21)}
BELLY={(x,y) for y in range(24,31) for x in range(15,22)}-{(15,24),(21,24),(15,30),(21,30)}
def ring(c):
    o=set()
    for x,y in c:
        for dx,dy in((1,0),(-1,0),(0,1),(0,-1)):
            n=(x+dx,y+dy)
            if n not in c and 0<=n[0]<W and 0<=n[1]<W: o.add(n)
    return o
class G:
    def __init__(s): s.g=[['.']*W for _ in range(W)]
    def put(s,cells,c):
        for x,y in cells:
            if 0<=x<W and 0<=y<W: s.g[y][x]=c
    def spr(s,x0,y0,rows):
        for y,r in enumerate(rows):
            for x,c in enumerate(r):
                if c!=' ': s.put([(x0+x,y0+y)],c)
    def shape(s,x0,y0,rows):
        cells={(x0+x,y0+y) for y,r in enumerate(rows) for x,c in enumerate(r) if c!=' '}
        s.put({p for p in ring(cells) if p not in FIG},'k'); s.spr(x0,y0,rows)
    def text(s): return '\n'.join(''.join(r) for r in s.g)+'\n'
def figure(g, cloth=None, hat=False):
    global FIG
    FIG=FIG0|FULL if hat else FIG0
    g.put(FIG,'F'); g.put({(x,y) for x,y in FIG if (x-1,y) not in FIG},'f'); g.put(ARM_BACK,'f')
    g.put(FACE,'W'); g.put(BELLY,'W')
    if cloth:
        torso={(x,y) for x,y in BODY_C|ARM_BACK|ARM_FRONT if 24<=y<=30}
        g.put(torso,'C'); g.put({(x,y) for x,y in torso if (x-1,y) not in torso}|ARM_BACK,'c'); g.put(BELLY&torso,'L')
        g.put({(x,y) for x,y in ARM_FRONT if y==28},'F')
    g.put({(x,31) for x in (11,12,13,14,17,18,19,20,21)},'s')
    g.put(ring(FIG),'k')
    g.spr(16,17,['k  k','k  k']); g.put([(15,19),(21,19)],'p'); g.spr(18,20,['kk'])
out={}
def char(name,bg,fur,draw,cloth=None,extra=None,hat=True):
    g=G(); figure(g,cloth,hat); draw(g)
    pal={'.':bg,'k':'#16121c','F':fur,'f':shade(fur),'W':'#fff8ee','p':'#ff9eb8','s':shade(fur,0.35)}
    if cloth: pal.update({'C':cloth,'c':shade(cloth),'L':tint(cloth,0.3)})
    pal.update(extra or {})
    out[name]=(g,pal)



L=lambda pts,c:None
def line(g,pts,c): g.put(pts,c)
char('81-skater','#ffd6d6','#b6e35a',lambda g:(g.shape(9,6,[' bbbbbbbbb   ','bbbbbbbbbbb  ','bbbbbbwbbbb  ','BBBBBBBBBBBBBBB']),g.spr(16,24,['w  w','w  w','   w']),g.put([(x,30) for x in range(10,22)],'c')),
     cloth='#3d6fff',extra={'b':'#ff7ab8','B':'#d6337a','w':'#ffffff'})
char('82-fisher','#c9e6ff','#f2c9a0',lambda g:(g.shape(8,5,['   yyyyyyy   ','  yyyyyyyyy  ','  YYYYYYYYY  ','yyyyyyyyyyyyyyy']),line(g,[(25,26),(25,25),(26,24),(26,23),(27,22),(27,21),(28,20),(28,19),(29,18),(29,17)],'b'),line(g,[(30,17),(30,18),(30,19),(30,20),(30,21),(30,22)],'l'),g.spr(17,25,['k','k']),g.put([(30,23)],'r')),
     cloth='#ffd23f',extra={'y':'#ffd23f','Y':'#e0b000','b':'#7a4a2c','l':'#8a96a8','r':'#e8344f'})
char('83-boxer','#ffe9a8','#c94a3a',lambda g:(g.put([(x,y) for x in range(10,22) for y in (12,13)],'r'),g.put([(x,13) for x in range(10,22)],'R'),g.shape(23,24,['rrr','rrrr','rrRr','rrr ']),g.shape(5,24,[' rr','rrr','rrr']),g.put([(x,29) for x in range(9,23) if (x,29) in BODY_C],'b'),g.put([(x,30) for x in range(10,22)],'b')),
     cloth='#ffffff',extra={'r':'#e8344f','R':'#a8202f','b':'#3d6fff'},hat=False)
char('84-hiker','#e2ecd8','#ffc49b',lambda g:(g.shape(10,6,['   gggggg  ',' gggggggggg ','gggggggggggg','GGGGGGGGGGGG'][:4]),g.shape(4,21,['bbbb','bBBb','bbbb','bbbb','bBBb','bbbb','bbbb']),g.put([(14,y) for y in range(24,30)],'b'),g.put([(x,30) for x in range(10,22)],'B')),
     cloth='#3fa45a',extra={'g':'#ff8a3d','G':'#d0602a','b':'#8a5a32','B':'#5a3a22'})
char('85-guitarist','#e6c4ff','#3fb8a8',lambda g:(g.put([(x,y) for x in range(10,22) for y in (11,12)] ,'F') if False else None,g.shape(13,26,['rrrr   ','rrrrrnnnn','rrorrnnnnhh','rrrr     hh','rrr']),g.put([(x,25) for x in range(10,22) if (x,25) in BODY_C and x<14],'C')),
     cloth='#25232c',extra={'r':'#e8344f','o':'#141018','n':'#c9a26b','h':'#7a4a2c','L':'#34313e'},hat=False)
char('86-ninja','#f6eefb','#2b2b36',lambda g:(g.put([(x,y) for x,y in FACE if y not in (17,18)],'F'),g.put([(x,y) for x,y in FACE if y in (17,18)],'S'),g.spr(16,17,['k  k','k  k']),g.put([(x,13) for x in range(10,22)],'r'),g.shape(5,12,['rr  ',' rrr','  r ']),g.put([(x,28) for x in range(9,23) if (x,28) in BODY_C],'r'),g.put([(15,19),(21,19)],'F')),
     cloth='#1c1c24',extra={'S':'#f2c9a0','r':'#e8344f','C':'#2b2b36','L':'#2b2b36'},hat=False)
char('87-barista','#f3e9d6','#9a6b4f',lambda g:(g.shape(10,7,[' aaaaaaaaaa ','aaaaaaaaaaaa','AAAAAAAAAAAA']),g.put([(x,y) for x in range(14,21) for y in range(25,31)],'a'),g.put([(13,24),(20,24)],'a'),g.shape(24,23,['ww','ww','ww']),g.put([(24,24)],'b'),g.spr(24,20,[' l','l ',' l'])),
     cloth='#ffffff',extra={'a':'#3a7a4a','A':'#2a5a36','w':'#ffffff','b':'#7a4a2c','l':'#c8bfb0'})
char('88-gamer','#d8d4f5','#8a6ad6',lambda g:(g.spr(8,10,[' hhhhhhhhhhhhhh ','h              h','h              h']),g.shape(7,13,['hh','hh','hh','hh']),g.shape(23,13,['hh','hh','hh','hh']),g.put([(23,17),(23,18),(22,19),(21,20)] ,'m'),g.shape(19,26,['GGGGGG','GgGGpG','GG  GG'])),
     cloth='#25232c',extra={'h':'#25232c','m':'#ff4fd8','G':'#5a5a6e','g':'#3ff2ff','p':'#ff4fd8','L':'#34313e'},hat=False)
char('89-painter','#f0f0f6','#ffb3c8',lambda g:(g.shape(10,6,['     k     ','  rrrrrrr  ',' rrrrrrrrrr','rrrrrrrrrrrr']),[g.put([p],c) for p,c in [((11,26),'r'),((17,25),'y'),((19,28),'b'),((14,29),'y'),((20,26),'r')]],line(g,[(25,26),(25,25),(26,24),(26,23),(27,22)],'t'),g.shape(27,20,['r','r'])),
     cloth='#8ea6c8',extra={'r':'#e8344f','y':'#ffd23f','b':'#3d6fff','t':'#c9a26b'})
char('90-scholar','#dbe5ec','#f2d24a',lambda g:(g.shape(7,6,['     RRRRRR     ','RRRRRRRRRRRRRRRRR','     RRRRRR    y','               y',][:4]),g.put([(17,6)],'y'),g.shape(22,24,['BBB','BwB','BwB','BBB']),g.put([(x,24) for x in range(14,21)],'W')),
     cloth='#2a2d3d',extra={'R':'#2a2d3d','y':'#f5c242','B':'#d6334a','w':'#ffffff','L':'#3a3d50'})

for name,(g,pal) in out.items():
    open(f'/home/user/CryptoPurrl/art/batch7/{name}.txt','w').write(g.text())
json.dump({k:v[1] for k,v in out.items()},open('/home/user/CryptoPurrl/art/batch7/palettes.json','w'),indent=1)
print(len(out))
