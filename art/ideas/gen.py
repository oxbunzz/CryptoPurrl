import json
SRC='/home/user/CryptoPurrl/art/batch9/'
P=json.load(open(SRC+'palettes.json'))
def load(n): return [list(r) for r in open(SRC+n+'.txt').read().split('\n') if r], dict(P[n])
def lum(h): r,g,b=(int(h[i:i+2],16) for i in (1,3,5)); return .3*r+.59*g+.11*b
def ring(cells,W=32):
    return {(x+dx,y+dy) for x,y in cells for dx,dy in ((1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,-1),(1,-1),(-1,1)) if (x+dx,y+dy) not in cells and 0<=x+dx<W and 0<=y+dy<W}
out={}
def save(name,g,pal):
    used={c for r in g for c in r}; out[name]=pal and {k:v for k,v in pal.items() if k in used}
    open(f'/home/user/CryptoPurrl/art/ideas/{name}.txt','w').write('\n'.join(''.join(r) for r in g)+'\n')

# 1 Flat: no outline, two flat tones, very graphic
g,p=load('06-flower')
fig={(x,y) for y,r in enumerate(g) for x,c in enumerate(r) if c!='.'}
for x,y in fig:
    c=g[y][x]
    g[y][x]={'O':'.','h':'F','B':'b','s':'f','g':'g','e':'e','y':'y','k':'k','p':'p','b':'b','f':'f','F':'F'}.get(c,c)
p.update({'.':'#fff4e8','F':'#ff7aa8','f':'#e85a8c','b':'#ffd6e4','k':'#3a1430','p':'#ff3f7a'})
save('1-flat',g,p)

# 2 Sticker: thick white die-cut border + soft drop shadow
g,p=load('01-beanie')
fig={(x,y) for y,r in enumerate(g) for x,c in enumerate(r) if c!='.'}
border=ring(fig); shadow={(x+1,y+1) for x,y in fig|border}
for x,y in shadow:
    if 0<=x<32 and 0<=y<32 and (x,y) not in fig|border: g[y][x]='Z'
for x,y in border: g[y][x]='W'
p.update({'W':'#ffffff','Z':'#b9c8b0'}); save('2-sticker',g,p)

# 3 Game Boy: four greens only
g,p=load('05-cap')
GB=['#0f380f','#306230','#8bac0f','#9bbc0f']
q={}
for k,v in p.items():
    L=lum(v); q[k]=GB[0 if L<60 else 1 if L<130 else 2 if L<200 else 3]
q['.']='#c4d4a0'; save('3-gameboy',g,q)

# 4 Shadow: solid silhouette, only the eyes glow
g,p=load('07-headband')
q={k:'#1c1a2e' for k in p}; q.update({'.':'#f1ece4','k':'#ffe14f','r':'#ff3f5a','R':'#c42a40'})
for y,r in enumerate(g):
    for x,c in enumerate(r):
        if c=='p': g[y][x]='F'
save('4-shadow',g,q)

# 5 Line art: white fill, one ink colour, one accent
g,p=load('02-headphones')
q={k:'#ffffff' for k in p}; q.update({'.':'#eef3ff','O':'#2346d8','k':'#2346d8','h':'#ff4f7a','H':'#ffd1dc','d':'#ff4f7a','p':'#ffc2d2','f':'#e3e9ff','c':'#e3e9ff','s':'#2346d8','B':'#f4f6ff'})
save('5-lineart',g,q)

# 6 Signature visor: one shared iconic accessory (logo-shaped visor), like a brand mark
g,p=load('09-bow')
for y in range(16,21):
    for x in range(11,25): g[y][x]='O'
for y in (17,18,19):
    for x in range(12,24): g[y][x]='V'
for x in (13,14,15,19,20,21): g[18][x]='v'
for x in (12,13,14,15,16,17,18,19,20,21,22,23): g[19][x]='U'
p.update({'V':'#ff3f5a','U':'#c42a40','v':'#ffffff','O':'#241a2a'}); save('6-visor',g,p)

json.dump(out,open('/home/user/CryptoPurrl/art/ideas/palettes.json','w'),indent=1)
print(len(out))
