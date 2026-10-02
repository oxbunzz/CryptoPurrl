# Batch 12: Punk-style busts at 48x48 (head + shoulders, cut at the bottom edge). Flat colour, 1px black outline,
# the logo as a solid box seen at 3/4 (dark side plane left, front face right),
# signature "Purrl specs" with logo-notched lenses looking right.
import json
W=48
def rgb(h): return [int(h[i:i+2],16) for i in (1,3,5)]
def shade(h,t): return '#%02x%02x%02x'%tuple(round(v*(1-t)) for v in rgb(h))
def tint(h,t): return '#%02x%02x%02x'%tuple(round(v+(255-v)*t) for v in rgb(h))
def R(x0,y0,x1,y1): return {(x,y) for x in range(x0,x1+1) for y in range(y0,y1+1)}
N4=((1,0),(-1,0),(0,1),(0,-1))
def ring(c): return {(x+dx,y+dy) for x,y in c for dx,dy in N4 if (x+dx,y+dy) not in c and 0<=x+dx<W and 0<=y+dy<W}
# head box: side plane x17-19, front face x20-31; logo ears on top, chin corners cut
HF=R(20,19,31,30)-{(20,30),(31,30)}|R(20,15,23,18)|R(28,16,31,18)
HS=R(17,20,19,29)|R(17,16,19,19)
HEAD=HF|HS
NECKF=R(23,31,28,33); NECKS=R(21,31,22,33)
SH=R(19,34,32,40)|R(17,35,18,40)|R(33,36,34,40)
SHS=R(17,35,20,40)
FIG=HEAD|NECKF|NECKS|SH
class G:
    def __init__(s): s.g=[['.']*W for _ in range(W)]; s.fig=set(FIG)
    def put(s,cells,c):
        for x,y in cells:
            if 0<=x<W and 0<=y<W: s.g[y][x]=c
    def spr(s,x0,y0,rs):
        for y,r in enumerate(rs):
            for x,c in enumerate(r):
                if c!=' ': s.put([(x0+x,y0+y)],c)
    def shape(s,x0,y0,rs,o=True):
        cells={(x0+x,y0+y) for y,r in enumerate(rs) for x,c in enumerate(r) if c!=' '}
        if o: s.put({p for p in ring(cells) if p not in s.fig},'O')
        s.spr(x0,y0,rs); s.fig|=cells
    def text(s):
        rows=[['.']*W for _ in range(7)]+s.g[:W-7]
        return '\n'.join(''.join(r) for r in rows)+'\n'
def base(g,pattern):
    g.put(ring(FIG),'O')
    g.put(HF,'F'); g.put(HS,'f')
    g.put(NECKF,'F'); g.put(NECKS,'f'); g.put(R(23,31,28,31),'f')
    g.put(SH,'C'); g.put(SHS,'c')
    g.put({(24,34),(25,34),(26,34),(27,34),(25,35),(26,35)},'F')        # crew-neck opening
    g.put({(23,34),(28,34),(24,35),(27,35)},'c')
    pattern(g)
    # signature specs: logo-notched lenses, pupils looking right
    g.spr(17,22,['xxxxxxxxxx xxxx'])
    g.spr(21,21,['x      x'])
    g.spr(21,22,['xxxxxx xxxx','xwwkkxxxwkx','xwwkkx xwkx','xxxxxx xxxx'])
    g.put({(17,23),(18,23),(19,23),(20,23)},'x')
    g.put({(27,22),(27,24)},'F'); g.put({(32,22),(32,23),(32,24),(32,25)},'.') 
    g.spr(25,28,['kkk'])
def stripes(g): g.put({(x,y) for x,y in HEAD if y%3==0},'Z' if False else 'z')
def plain(g): pass
def spots(g): g.put({(x,y) for x,y in HEAD if ((x*7+y*13)%11==0)},'z')
def twotone(g): g.put({(x,y) for x,y in HEAD if y<=21},'z')
def checker(g): g.put({(x,y) for x,y in HEAD if (x//2+y//2)%2==0},'z')
out={}
def char(name,bg,fur,body,pants,shoe,frame,pattern,draw,extra=None):
    g=G(); base(g,pattern); draw(g)
    pal={'.':bg,'O':'#000000','F':fur,'f':shade(fur,.28),'z':shade(fur,.14),'C':body,'c':shade(body,.25),'P':pants,'q':shade(pants,.25),
         'S':shoe,'s':shade(shoe,.3),'x':frame,'w':'#ffffff','k':'#000000'}
    pal.update(extra or {})
    used={c for r in g.g for c in r}; miss=used-set(pal); assert not miss,(name,miss)
    out[name]=(g,{k:v for k,v in pal.items() if k in used})

char('01-bare','#d5d7e1','#f2e4c4','#e8344f','#2a3a6a','#ffffff','#ff2a2a',plain,lambda g:(
    g.spr(23,37,[' y ','yyy',' y '])),extra={'y':'#ffffff'})
char('02-cap','#e1d7d5','#7fd6ff','#ffd23f','#5a4a3a','#141418','#2a7fff',stripes,lambda g:(
    g.shape(16,14,['  BBBBBBBBBBBBB','  BBBBBBBBBBBBBB',' BBBBBBBBBBBBBBB',' BBBBBBBBBBBBBBB',' bbbbbbbbbbbbbbbbbbbb']),
    g.spr(24,37,['k k','   ','kkk'])),extra={'B':'#2a2a3a','b':'#141420'})
char('03-crown','#e6f0d8','#ff9a3d','#3fa45a','#e8e2d4','#c94a3a','#ffd23f',spots,lambda g:(
    g.shape(19,13,['y   y   y   y','yy yyy yyy yy','yyyyyyyyyyyyy','yjyyypyyyjyyy','yyyyyyyyyyyyy']),
    g.spr(24,37,['  h ',' hh ','hhhh'])),extra={'y':'#ffd23f','p':'#e8344f','j':'#3d8bff','h':'#ffd23f'})
char('04-beret','#f4e6f0','#c9b8ff','#ffffff','#3a3a4a','#ff7ab8','#141418',twotone,lambda g:(
    g.shape(17,13,['         m    ','   mmmmmmmmm  ','  mmmmmmmmmmmm',' mmmmmmmmmmmmmm','mmmmmmmmmmmmmmm','MMMMMMMMMMMMMMM']),g.spr(23,37,['h h','hhh',' h '])),
    extra={'m':'#ff4f8a','M':'#c22a62','h':'#ff4f8a','z':'#ffe066'})
char('05-redcap','#dfeef6','#b6e35a','#3d6fff','#25324a','#ffffff','#ff4fd8',checker,lambda g:(
    g.shape(17,14,['  cccccccccccc',' ccccccccccccccc','cccccccccccccccc','cccccccccccccccc','CCCCCCCCCCCCCCCCCCCC']),
    g.spr(24,37,['sss','s  ','sss','  s','sss'][:4])),extra={'c':'#ff4f4f','C':'#c93a3a','s':'#ffffff'})
char('06-bucket','#fbeedd','#8a5a3c','#25232c','#5a7d6a','#e8e2d4','#ff7a1f',plain,lambda g:(
    g.shape(15,13,['    tttttttttt','   tttttttttttt','   tttttttttttt','   TTTTTTTTTTTT',' tttttttttttttttt','tttttttttttttttttt']),
    g.spr(24,37,[' v ','vvv','vvv'])),extra={'t':'#c99a5e','T':'#5a3a22','v':'#ff7a1f'})
char('07-sprout','#e8e4f8','#ffffff','#ff7ab8','#3d6fff','#ffd23f','#3fc2a0',spots,lambda g:(
    g.shape(23,8,['  r  ',' rgr ','rrrrr',' rrr ','  g  ','  g  ','  g  ']),
    g.spr(24,37,['yyy','y y','yyy'])),extra={'r':'#ff4f6a','g':'#3fa45a','y':'#ffffff','z':'#eef0f6'})
char('08-bandana','#eef3e6','#ff6f6f','#f4efe2','#3a3a4a','#141418','#3a3a4a',stripes,lambda g:(
    g.put(R(17,19,31,20),'b'),g.shape(13,19,['bb  ','bbb ',' b  ']),g.spr(24,37,['k k',' k ','k k'])),
    extra={'b':'#2a2a3a','k':'#000000'})
char('09-spikes','#fff4d6','#3a3a4a','#ffd23f','#2a2d3d','#ff4f6a','#ff4f6a',plain,lambda g:(
    g.shape(24,12,[' s  ','ss s','ssss']),g.spr(23,37,['m m','mmm','m m'])),
    extra={'s':'#ffd23f','m':'#2a2d3d'})
char('10-halo','#e6f4f8','#ffe066','#7a4ad6','#2a2a3a','#ffffff','#7a4ad6',checker,lambda g:(
    g.shape(19,10,[' gggggggggggg ','g            g',' gggggggggggg ']),g.spr(23,37,['ggg',' g ','ggg'])),
    extra={'g':'#ffd35a','z':'#f2d24a'})
for name,(g,pal) in out.items():
    open(f'/home/user/CryptoPurrl/art/batch12/{name}.txt','w').write(g.text())
json.dump({k:v[1] for k,v in out.items()},open('/home/user/CryptoPurrl/art/batch12/palettes.json','w'),indent=1)
print(len(out))
