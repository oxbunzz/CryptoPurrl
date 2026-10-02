# Batch 14: wide-shouldered, balanced Punk-style busts at 48x48. Head, neck and shoulders share one
# centre line; shoulders are symmetric. The 3/4 turn is carried by the face only.
import json
W=48
def rgb(h): return [int(h[i:i+2],16) for i in (1,3,5)]
def shade(h,t): return '#%02x%02x%02x'%tuple(round(v*(1-t)) for v in rgb(h))
def R(x0,y0,x1,y1): return {(x,y) for x in range(x0,x1+1) for y in range(y0,y1+1)}
N4=((1,0),(-1,0),(0,1),(0,-1))
def ring(c): return {(x+dx,y+dy) for x,y in c for dx,dy in N4 if (x+dx,y+dy) not in c and 0<=x+dx<W and 0<=y+dy<W}
# head 16 wide (x16-31), logo ears: tall left, short right; chin corners cut
HEAD=(R(16,21,31,34)-{(16,34),(31,34)})|R(16,17,19,20)|R(28,18,31,20)
NECK=R(21,35,26,37)
SH=R(14,38,33,38)|R(10,39,37,39)|R(8,40,39,40)|R(7,41,40,41)|R(6,42,41,47)   # wide, sloped, symmetric about x=23.5
FIG=HEAD|NECK|SH
NOTCH=R(20,17,27,20)|R(28,17,31,17)
class G:
    def __init__(s,hat=False):
        s.g=[['.']*W for _ in range(W)]; s.hat=hat; s.head=HEAD|NOTCH if hat else HEAD; s.fig=s.head|NECK|SH
    def put(s,cells,c):
        for x,y in cells:
            if 0<=x<W and 0<=y<W: s.g[y][x]=c
    def spr(s,x0,y0,rs):
        for y,r in enumerate(rs):
            for x,c in enumerate(r):
                if c!=' ': s.put([(x0+x,y0+y)],c)
    def shape(s,x0,y0,rs):
        cells={(x0+x,y0+y) for y,r in enumerate(rs) for x,c in enumerate(r) if c!=' '}
        s.put({p for p in ring(cells) if p not in s.fig},'O'); s.spr(x0,y0,rs); s.fig|=cells
    def text(s): return '\n'.join(''.join(r) for r in s.g)+'\n'
def base(g,pattern):
    g.put(ring(g.fig),'O')
    g.put(g.head,'F'); g.put({(x,y) for x,y in g.head if x<=17},'f')      # light from the right: shaded left edge
    pattern(g)
    g.put(NECK,'F'); g.put({(21,y) for y in range(35,38)}|R(21,35,26,35),'f')
    g.put(SH,'C'); g.put({(x,y) for x,y in SH if x<=8 or x>=39},'c')
    g.put({(11,y) for y in range(42,48)}|{(36,y) for y in range(42,48)}|{(10,41),(37,41)},'c')   # sleeve seams
    g.put(R(20,38,27,38)|R(21,39,26,39),'F'); g.put({(19,38),(28,38),(20,39),(27,39)},'c')   # crew neck
    # signature specs, lenses notched like the logo, pupils looking right
    g.spr(16,24,['xxxxxxxxx xxxxxx'])
    g.spr(19,23,['x      x'])
    g.spr(19,24,['xxxxxx xxxxx','xwwkkxxxwwkx','xwwkkx xwwkx','xxxxxx xxxxx'])
    g.spr(23,31,['kkk'])
def plain(g): pass
def stripes(g): g.put({(x,y) for x,y in g.head if y%3==0},'z')
def spots(g): g.put({(x,y) for x,y in g.head if (x*7+y*13)%11==0},'z')
def twotone(g): g.put({(x,y) for x,y in g.head if y<=22},'z')
def checker(g): g.put({(x,y) for x,y in g.head if (x//2+y//2)%2==0},'z')
out={}
def char(name,bg,fur,body,frame,pattern,draw,extra=None):
    g=G(name.split('-')[1] in ('cap','crown','beret','redcap','bucket')); base(g,pattern); draw(g)
    pal={'.':bg,'O':'#000000','F':fur,'f':shade(fur,.22),'z':shade(fur,.12),'C':body,'c':shade(body,.2),
         'x':frame,'w':'#ffffff','k':'#000000'}
    pal.update(extra or {})
    used={c for r in g.g for c in r}; miss=used-set(pal); assert not miss,(name,miss)
    out[name]=(g,{k:v for k,v in pal.items() if k in used})
ICON=lambda rows:(lambda g:g.spr(22,42,rows))
char('01-bare','#d5d7e1','#f2e4c4','#e8344f','#ff2a2a',plain,lambda g:g.spr(22,42,[' v ','vvv',' v ']),{'v':'#ffffff'})
char('02-cap','#e1d7d5','#7fd6ff','#ffd23f','#2a7fff',stripes,lambda g:(
    g.shape(15,15,['  BBBBBBBBBBBB','  BBBBBBBBBBBBB',' BBBBBBBBBBBBBBB',' BBBBBBBBBBBBBBB',' bbbbbbbbbbbbbbbbbbbb']),
    g.spr(22,42,['v v','   ','vvv'])),{'B':'#2a2a3a','b':'#141420','v':'#000000'})
char('03-crown','#e6f0d8','#ff9a3d','#3fa45a','#ffd23f',spots,lambda g:(
    g.shape(17,15,['y   y   y   y','yy yyy yyy yy','yyyyyyyyyyyyy','yjyyypyyyjyyy','yyyyyyyyyyyyy'][:5]),
    g.spr(22,42,['  v',' vv','vvv'])),{'y':'#ffd23f','p':'#e8344f','j':'#3d8bff','v':'#ffd23f'})
char('04-beret','#f4e6f0','#c9b8ff','#ffffff','#141418',twotone,lambda g:(
    g.shape(15,14,['          m   ','   mmmmmmmmm  ','  mmmmmmmmmmmm',' mmmmmmmmmmmmmm','mmmmmmmmmmmmmmm','MMMMMMMMMMMMMMMM'][:6]),
    g.spr(22,42,['v v','vvv',' v '])),{'m':'#ff4f8a','M':'#c22a62','v':'#ff4f8a','z':'#ffe066'})
char('05-redcap','#dfeef6','#b6e35a','#3d6fff','#ff4fd8',checker,lambda g:(
    g.shape(16,15,['  cccccccccccc',' cccccccccccccc','cccccccccccccccc','cccccccccccccccc','CCCCCCCCCCCCCCCCCCCC']),
    g.spr(22,42,['vvv','v  ','vvv','  v'])),{'c':'#ff4f4f','C':'#c93a3a','v':'#ffffff'})
char('06-bucket','#fbeedd','#8a5a3c','#25232c','#ff7a1f',plain,lambda g:(
    g.shape(13,14,['    tttttttttttt','   tttttttttttttt','   TTTTTTTTTTTTTT',' tttttttttttttttttt','tttttttttttttttttttt']),
    g.spr(22,42,[' v ','vvv','vvv'])),{'t':'#c99a5e','T':'#5a3a22','v':'#ff7a1f'})
char('07-sprout','#e8e4f8','#ffffff','#ff7ab8','#3fc2a0',spots,lambda g:(
    g.shape(21,10,['  r  ',' rgr ','rrrrr',' rrr ','  g  ','  g  ','  g  ','  g  ']),
    g.spr(22,42,['vvv','v v','vvv'])),{'r':'#ff4f6a','g':'#3fa45a','v':'#ffffff','z':'#eef0f6'})
char('08-bandana','#eef3e6','#ff6f6f','#f4efe2','#3a3a4a',stripes,lambda g:(
    g.put(R(16,21,31,22),'b'),g.shape(12,21,['bb  ','bbb ',' b  ']),g.spr(22,42,['v v',' v ','v v'])),
    {'b':'#2a2a3a','v':'#000000'})
char('09-spikes','#fff4d6','#3a3a4a','#ffd23f','#ff4f6a',plain,lambda g:(
    g.shape(21,15,[' s  ','ss s','ssss']),g.spr(22,42,['v v','vvv','v v'])),
    {'s':'#ffd23f','v':'#2a2d3d'})
char('10-halo','#e6f4f8','#ffe066','#7a4ad6','#7a4ad6',checker,lambda g:(
    g.shape(17,12,[' gggggggggggg ','g            g',' gggggggggggg ']),g.spr(22,42,['vvv',' v ','vvv'])),
    {'g':'#ffd35a','z':'#f2d24a','v':'#ffd35a'})
for name,(g,pal) in out.items():
    open(f'/home/user/CryptoPurrl/art/batch14/{name}.txt','w').write(g.text())
json.dump({k:v[1] for k,v in out.items()},open('/home/user/CryptoPurrl/art/batch14/palettes.json','w'),indent=1)
print(len(out))
