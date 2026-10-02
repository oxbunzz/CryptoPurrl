# Batch 10: materials + a soul object living in the logo notch. Base from batch 9. Ink outline, 2-tone cel shading, rim light,
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

def h(x,y,k=0): return ((x*73856093)^(y*19349663)^(k*83492791))%1000/1000
SKIN=set('FfhbBs')
def skin(g): return {(x,y) for y in range(W) for x in range(W) if g.g[y][x] in SKIN}
out={}
def char(name,bg,fur,draw,extra=None,face=None,eyes='k'):
    g=G(); figure(g,False,None)
    if eyes!='k':
        for y in range(W):
            for x in range(W):
                if g.g[y][x]=='k': g.g[y][x]=eyes
    draw(g)
    pal={'.':bg,'O':'#241a2a','F':fur,'f':shade(fur,.2),'h':tint(fur,.4),'b':face or tint(fur,.62),'B':shade(face,.08) if face else tint(fur,.38),
         'k':'#1c1424','w':'#ffffff','p':mix(tint(fur,.5),'#ff6f91',.55),'s':shade(fur,.42)}
    pal.update(extra or {})
    used={ch for row in g.g for ch in row}
    miss=used-set(pal)
    assert not miss,(name,miss)
    out[name]=(g,{k:v for k,v in pal.items() if k in used})
def tex(g,ch,pred,only='Ffhs'):
    for x,y in skin(g):
        if g.g[y][x] in only and pred(x,y): g.g[y][x]=ch

# 01 Galaxy: night-sky skin, starry, glowing eyes, a star lives in the notch
char('01-galaxy','#ece8ff','#2b2f6e',lambda g:(
    tex(g,'x',lambda x,y:h(x,y)<.09,'Ffhbs'),tex(g,'X',lambda x,y:h(x,y,1)<.05,'Ffhs'),
    g.shape(14,8,['  y  ',' yyy ','yyyyy',' yyy ',' y y '])),
    face='#3d4396',eyes='e',extra={'x':'#ffffff','X':'#ff9ee6','y':'#ffe066','e':'#7ff6ff','p':'#7a5ac8'})
# 02 Jelly: glassy, bubbles inside, a bubble floats in the notch
char('02-jelly','#e4fbf6','#5fd6e8',lambda g:(
    tex(g,'u',lambda x,y:(x,y) in {(10,18),(9,24),(11,27),(18,26),(12,16),(20,29)},'Ffhbs'),
    tex(g,'h',lambda x,y:x+y in (24,25) and y<22,'Ff'),
    g.shape(14,8,[' uu ','uwuu','uuuu',' uu '])),
    face='#a8f0fa',extra={'u':'#e8ffff','h':'#c8fbff'})
# 03 Gold: polished metal with a shine streak, a coin in the notch
char('03-gold','#fbf3e2','#f0b93a',lambda g:(
    tex(g,'x',lambda x,y:x-y in (-6,-7),'Ffhb'),tex(g,'h',lambda x,y:x-y in (-4,-9),'Ff'),
    g.shape(14,8,[' cccc ','cCyyCc','cCyyCc',' cccc '][:4])),
    face='#ffe08a',extra={'x':'#fffbe6','c':'#ffd35a','C':'#c98a1c','y':'#fff2b0'})
# 04 Marble: white stone with grey veins, a small classical gem in the notch
char('04-marble','#eef0f2','#eceae4',lambda g:(
    tex(g,'v',lambda x,y:abs((x*2+y)%13-((y*3)%5))<1 or (x+2*y)%17==0,'Ffhbs'),
    g.shape(14,9,[' qq ','qQQq',' qq '])),
    face='#f8f6f0',extra={'v':'#a8a4b0','q':'#3fc2a0','Q':'#a8f5dc'})
# 05 Lava: dark rock skin with glowing cracks, a flame in the notch
char('05-lava','#fff0e2','#4a3434',lambda g:(
    tex(g,'x',lambda x,y:(x*3+y*5)%13==0 or (x-y)%11==0 and h(x,y)<.5,'Ffhs'),
    g.shape(14,7,['  r  ',' rr  ',' rYr ','rYYrr','rYYYr'])),
    face='#6a4848',eyes='e',extra={'x':'#ff7a2a','r':'#ff5a2a','Y':'#ffd23f','e':'#ffb03a','p':'#c8503a'})
# 06 Ghost: pale, softly translucent, floating wisps instead of feet, a wisp of soul in the notch
char('06-ghost','#efe9f7','#d9d0ff',lambda g:(
    g.put({(x,31) for x in range(10,23)}|{(x,30) for x in range(10,23)},'.'),
    g.put({(x,30) for x in (11,12,13,15,16,17,19,20)}|{(x,29) for x in range(10,22)},'F'),
    g.put({(10,30),(14,30),(18,30),(21,30),(12,31),(16,31),(20,31)},'O'),
    g.put({(11,31),(13,31),(15,31),(17,31),(19,31)},'.'),
    g.shape(15,8,[' g','gg','g ',' g'])),
    face='#efeaff',eyes='e',extra={'g':'#b8a6ff','e':'#5a3fa8'})
# 07 Cloud: puffy fluffy top, rain-drop in the notch
char('07-cloud','#dff2ff','#ffffff',lambda g:(
    g.shape(5,15,['FF','FF','FF'][:3]),g.shape(24,15,['FF','FF','FF']),g.shape(6,24,['FF','FF']),g.shape(22,23,['FFF',' FF']),g.shape(12,11,['FFFFFFF ','FFFFFFFF'][:0] or [' ']),
    g.shape(15,8,[' d ','ddd','dDd',' d '])),
    face='#ffffff',extra={'d':'#5aaaff','D':'#bfe0ff','f':'#e4ecf6','h':'#ffffff'})
# 08 Gummy: sugared candy skin, a cherry in the notch
char('08-gummy','#fff0f6','#ff6fa0',lambda g:(
    tex(g,'x',lambda x,y:(x+y*2)%5==0 and (x*y)%3!=1,'Ffh'),
    g.shape(13,7,['   ss','  s  ',' rr r','rrrrr','rRrr ',' rr  '][:6])),
    face='#ffb8cf',extra={'x':'#fff0f6','s':'#3fa45a','r':'#e8243f','R':'#ff9aa8'})
# 09 Chrome: polished robot panels, LED eyes, an antenna bulb in the notch
char('09-chrome','#eaf0f4','#b8c4d0',lambda g:(
    tex(g,'v',lambda x,y:y in (24,) or x==15 and y>=24,'Ffh'),
    tex(g,'x',lambda x,y:(x,y) in {(9,15),(22,15),(9,22),(11,26),(19,26)},'Ffhs'),
    g.put({(x,y) for x in range(13,23) for y in range(17,20)},'d'),
    g.put({(14,18),(15,18),(19,18),(20,18)},'e'),
    g.shape(15,7,[' e ','eEe',' e ',' m ',' m '])),
    face='#dfe6ee',extra={'v':'#7a8696','x':'#ffffff','d':'#2a3040','e':'#ff4f6a','E':'#ffd1dc','m':'#7a8696'})
# 10 Moss: soft green with leaf texture, a flower blooming in the notch
char('10-moss','#f2f6e8','#7cc46a',lambda g:(
    tex(g,'v',lambda x,y:h(x,y,3)<.18,'Ffh'),
    g.shape(13,7,[' p p ','ppypp',' ppp ','  g  ','  g  ',][:5])),
    face='#cfeec0',extra={'v':'#5aa64a','p':'#ff8fc8','y':'#ffd23f','g':'#3f8a3a'})

for name,(g,pal) in out.items():
    open(f'/home/user/CryptoPurrl/art/batch10/{name}.txt','w').write(g.text())
json.dump({k:v[1] for k,v in out.items()},open('/home/user/CryptoPurrl/art/batch10/palettes.json','w'),indent=1)
print(len(out))
