# Six body silhouettes for the Purrl, same colour and face, so only the shape is compared.
import json
W=32
def ell(cx,cy,rx,ry): return {(x,y) for y in range(W) for x in range(W) if ((x+.5-cx)/rx)**2+((y+.5-cy)/ry)**2<=1}
def rect(x0,y0,x1,y1): return {(x,y) for x in range(x0,x1+1) for y in range(y0,y1+1)}
N4=((1,0),(-1,0),(0,1),(0,-1))
def ring(c): return {(x+dx,y+dy) for x,y in c for dx,dy in N4 if (x+dx,y+dy) not in c and 0<=x+dx<W and 0<=y+dy<W}
def ears(lx,rx,top,base):
    # logo peaks: tall left ear, shorter right ear (further away in 3/4)
    return rect(lx,top,lx+2,base)|rect(rx,top+1,rx+2,base)
def build(name,bg,body,arm_b,arm_f,feet,eyes,mouth,belly):
    fig=body|arm_b|feet
    g=[['.']*W for _ in range(W)]
    def put(cs,c):
        for x,y in cs:
            if 0<=x<W and 0<=y<W: g[y][x]=c
    put(ring(fig|arm_f),'O'); put(fig,'F')
    put({(x,y) for x,y in body if (x-1,y) not in body or (x-2,y) not in body},'f')
    put({(x,y) for x,y in body if (x,y-1) not in body and (x-1,y) in body and (x+1,y) in body},'h')
    put(belly&body,'b'); put(arm_b,'f'); put(feet,'s')
    put(ring(arm_f)&fig,'O'); put(arm_f,'F'); put({(x,y) for x,y in arm_f if (x-1,y) not in arm_f},'f')
    (ex,ey)=eyes
    put(rect(ex,ey,ex+1,ey+2),'k'); put(rect(ex+5,ey,ex+6,ey+2),'k')
    put({(ex-1,ey+3),(ex+7,ey+3)},'p')
    put(mouth,'k')
    for x,y in [(ex,ey),(ex+5,ey)]: put({(x+1,y)},'w')
    out[name]={'.':bg,'O':'#2a1f2a','F':'#f6e7c8','f':'#dcc49a','h':'#fff7e6','b':'#fffaf0','k':'#2a1f2a','w':'#ffffff','p':'#ffad9e','s':'#c9a77a'}
    open(f'/home/user/CryptoPurrl/art/shapes/{name}.txt','w').write('\n'.join(''.join(r) for r in g)+'\n')
out={}
# A Pudgy pear: head and body one soft mass, wide base, flippers
A=ell(16.5,24.5,8.5,7)|ell(16.5,17,7,6.5)|ears(10,19,8,12)
build('A-pear','#e8f1ff',A,ell(8.5,24.5,1.6,3),ell(24.6,24.5,1.6,3)-A,rect(11,31,14,31)|rect(18,31,22,31),(15,16),{(17,20),(18,20)},ell(19,26,4.5,4.5))
# B Bean: one tall egg
B=ell(16,22,7.5,9.8)|ears(10,18,9,13)
build('B-bean','#fff0e6',B,ell(8.6,23,1.4,2.5),ell(23.4,23,1.4,2.6)-B,rect(12,31,14,31)|rect(17,31,20,31),(15,16),{(17,20),(18,20)},ell(18.5,26,4.5,5))
# C Mochi: wide, low dumpling, no legs
C=ell(16,25.5,10.5,6.5)|ears(9,19,15,20)
build('C-mochi','#eaf7ec',C,set(),ell(25,27,1.6,2)-C,set(),(15,22),{(17,26),(18,26)},ell(19,28,6,3.5))
# D Chibi: round head, small round body, legs
Dh=ell(16.5,16.5,7.5,6.8)|ears(10,19,8,12); Db=ell(16,26,5,3.6)|rect(12,28,20,29)
build('D-chibi','#f6eeff',Dh|Db,ell(10.5,25.5,1.3,2.3),ell(21.8,25.5,1.3,2.3)-Dh-Db,rect(12,30,14,31)|rect(17,30,20,31),(15,15),{(17,19),(18,19)},ell(17.5,27,3,2.6))
# E Gummy bear: round head, round belly, chunky limbs out to the sides
Eh=ell(16.5,14.5,6.5,6)|ears(11,19,7,10); Eb=ell(16,25,6.5,5.2)
build('E-gummy','#fff4dd',Eh|Eb,ell(9,23,1.8,2.6),ell(23.5,24,1.9,2.6)-Eb,ell(12.5,30.5,2.4,1.6)|ell(19.5,30.5,2.6,1.6),(15,13),{(17,17),(18,17)},ell(17.5,25.5,4,3.6))
# F Toy figure: small head, longer body, slim legs
Fh=ell(16.5,13,6.5,5.2)|ears(11,19,6,9); Fb=rect(12,18,20,27)-{(12,18),(20,18),(12,27),(20,27)}
build('F-toy','#e6f4f8',Fh|Fb,rect(10,19,11,24),rect(21,19,22,24),rect(13,28,14,31)|rect(18,28,19,31),(15,12),{(17,16),(18,16)},rect(15,20,19,26))
json.dump(out,open('/home/user/CryptoPurrl/art/shapes/palettes.json','w'),indent=1)
print(len(out))
