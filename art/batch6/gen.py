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


char('01-cap','#ffd23f','#7cc8ff',lambda g:(g.shape(9,6,['  bbbbbbbb   ',' bbbbbbbbbb  ','bbbbbbwbbbbb ','BBBBBBBBBBBBBBB']),g.spr(15,24,['w','w']),g.spr(18,24,['w','w'])),
     cloth='#ff7ab8',extra={'b':'#3d6fff','B':'#2a4fc9','w':'#ffffff'})
char('02-bucket','#ffa07a','#ffd06b',lambda g:(g.shape(8,5,['   ttttttt   ','  ttttttttt  ','  TTTTTTTTT  ','ttttttttttttttt']),[g.put([p],'y') for p in [(11,26),(18,25),(14,28),(20,28),(16,30)]]),
     cloth='#2fb8a0',extra={'t':'#5a8ae0','T':'#3a5aa8','y':'#ffd23f'})
char('03-jersey','#b8b0e6','#f2f0f6',lambda g:(g.put([(x,y) for x in range(10,22) for y in (12,13)],'r'),g.put([(x,13) for x in range(10,22)],'R'),g.spr(17,25,['wwww','   w','  w ','  w '])),
     cloth='#ff7ab8',extra={'r':'#3d6fff','R':'#2a4fc9','w':'#ffffff'},hat=False)
char('04-headphones','#bfe8ff','#87e9cd',lambda g:(g.spr(8,10,[' hhhhhhhhhhhhhh ','h              h','h              h']),g.shape(7,13,['hh','hh','hh','hh']),g.shape(23,13,['hh','hh','hh','hh']),[g.put([(x,y) for x in range(9,23) if (x,y) in BODY_C],'d') for y in (26,28)]),
     cloth='#ff5f5f',extra={'h':'#3d6fff','d':'#c93a3a'},hat=False)
char('05-king','#e6d6f0','#ffb36b',lambda g:(g.shape(11,5,['y  y  y  y','yyyyyyyyyy','yryyybyyry','yyyyyyyyyy']),g.put([(x,24) for x in range(10,22)],'w'),g.put([(x,24) for x in range(11,22,3)],'k')),
     cloth='#a31f35',extra={'y':'#ffd35a','r':'#e8344f','b':'#3d8bff','w':'#ffffff'})
char('06-cowboy','#ffe2c7','#b9a4ff',lambda g:(g.shape(6,5,['     tttttt    ','     TTTTTT    ','tt tttttttttt tt','tttttttttttttttt']),g.put([(x,y) for x in range(15,19) for y in range(24,30)],'w'),g.put([(17,26)],'y')),
     cloth='#8a5a32',extra={'t':'#c99a5e','T':'#7a5a32','w':'#f4f0e6','y':'#ffd23f'})
char('07-chef','#d6f5ea','#ffc49b',lambda g:(g.shape(10,1,['  wwwwww  ',' wwwwwwww ','wwwwwwwwww','wwwwwwwwww',' wwwwwwww ',' wwwwwwww ',' wwwwwwww ',' wwwwwwww ',' gggggggg ']),g.put([(x,y) for x in range(13,20) for y in range(25,31)],'a'),g.put([(x,24) for x in range(13,20)],'r')),
     cloth='#ffffff',extra={'w':'#ffffff','g':'#d6dae3','a':'#3a3a4a','r':'#e8344f'})
char('08-beret','#d6eeff','#ff9a3d',lambda g:(g.shape(10,6,['     k     ','  rrrrrrr  ',' rrrrrrrrrr','rrrrrrrrrrrr']),[g.put([(x,y) for x in range(9,23) if (x,y) in BODY_C],'w') for y in (25,27,29)]),
     cloth='#22305e',extra={'r':'#d6334a','w':'#ffffff'})
char('09-party','#ffd6e8','#5fd16a',lambda g:(g.shape(13,1,['  w  ','  y  ',' yp  ',' pyp ',' yyp ','pyyyp','ppypp','ppppp','ppppp'][:9]),g.spr(16,23,['rr rr','rrrrr','rr rr'])),
     extra={'w':'#ffffff','y':'#ffd23f','p':'#ef476f','r':'#e8344f'})
char('10-gardener','#e2ecd8','#f29bb8',lambda g:(g.shape(10,6,['gg ',' gs',' ss','  s']),g.shape(12,4,['pp ','pyp',' pp']),g.put([(x,y) for x,y in BODY_C if 27<=y<=30],'C'),g.put([(13,24),(13,25),(13,26),(19,24),(19,25),(19,26)],'C'),g.put([(13,27),(19,27)],'y')),
     cloth='#4a6fb0',extra={'g':'#3fa45a','s':'#2f7a3a','p':'#ff7ab8','y':'#ffd23f'},hat=False)

# gardener keeps a white tee above the overalls
g,pal=out['10-gardener']
for y in range(24,27):
    for x in range(9,23):
        if (x,y) in BODY_C and g.g[y][x] not in 'Ck': g.g[y][x]='W'
for name,(g,pal) in out.items():
    open(f'/home/user/CryptoPurrl/art/batch6/{name}.txt','w').write(g.text())
json.dump({k:v[1] for k,v in out.items()},open('/home/user/CryptoPurrl/art/batch6/palettes.json','w'),indent=1)
print(len(out))
