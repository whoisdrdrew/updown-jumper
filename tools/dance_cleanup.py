"""Cleans the Higgsfield dance poses into game sprites for the VIP room (Boris dancing while the music plays).

Inputs, in the current folder: q0/q1.png (masked small hero: fist pump, arms up) and q4/q5.png (big hero),
plus each variant's idle/run/jump frames named like hero-idle.png. The body is snapped to the bare palette,
then each variant's exact head from its idle frame is put on, and raised arms are drawn in front of it.
Run:  python3 tools/dance_cleanup.py [scale 1.18] [out_dir]
"""
import numpy as np, sys
from PIL import Image, ImageDraw
from collections import deque
TEALC=np.array([0x57,0x97,0xa1]); OUT=[0x15,0x0b,0x22]
SHIRT=np.array([[0x45,0x2c,0x3b],[0x22,0x15,0x33],[0x30,0x23,0x3f]])
MASKC=np.array([[0xfd,0xfe,0xfd],[0xfa,0xe8,0xbf],[0x2e,0x67,0xa9],[0x68,0x8a,0xb0],[0xf5,0xc3,0x5c],[0xe0,0x93,0x1a],[0xf7,0xce,0x12],[0xcf,0xcd,0xcd]])
SK=np.array([[0xdc,0x99,0x83],[0xc1,0x87,0x6c],[0xf1,0xb9,0xa3],[0xf4,0xca,0xb8],[0x9a,0x65,0x5b],[0xd2,0x90,0x5e],[0x9c,0x63,0x50],[0x6f,0x3e,0x3d],[0xf0,0xa3,0x60]])
def near(rgb, C, tol=10): return np.abs(rgb[...,None,:]-C[None,None]).sum(-1).min(-1) < tol
def load(n): return np.array(Image.open(n).convert('RGBA')).astype(int)
def pal_of(v):
    cs=set()
    for f in ('idle','run','jump'):
        a=load(f'{v}-{f}.png'); cs|={tuple(p[:3]) for p in a.reshape(-1,4) if p[3]>0}
    return np.array(sorted(cs))
def native(n,px):
    im=Image.open(n).convert('RGB'); m=im.copy()
    for xy in [(0,0),(im.width-1,0),(0,im.height-1),(im.width-1,im.height-1),(im.width//2,0),(im.width//2,im.height-1)]:
        ImageDraw.floodfill(m,xy,(255,0,255),thresh=45)
    bg=(np.array(m)==[255,0,255]).all(2); o=np.array(im).astype(int); best=None
    for ox in np.linspace(0,px,8,endpoint=False):
      for oy in np.linspace(0,px,8,endpoint=False):
        ys=(np.arange(int((o.shape[0]-oy)/px))*px+oy+px/2).astype(int); xs=(np.arange(int((o.shape[1]-ox)/px))*px+ox+px/2).astype(int)
        q=int(px*0.3)
        a1=o[ys][:,xs]; a2=o[(ys-q).clip(0)][:,(xs-q).clip(0)]; a3=o[(ys+q).clip(0,o.shape[0]-1)][:,(xs+q).clip(0,o.shape[1]-1)]
        err=np.abs(a1-a2).sum()+np.abs(a1-a3).sum()
        if best is None or err<best[0]: best=(err,ys,xs)
    _,ys,xs=best
    return np.dstack([o[ys][:,xs],(~bg[ys][:,xs])*255]).astype(int)
def snap(r,P):
    a=r[...,:3].reshape(-1,1,3); i=((a-P[None])**2).sum(2).argmin(1); r[...,:3]=P[i].reshape(r.shape[:2]+(3,)); return r
def edge(s):
    p=np.pad(s,1); return s&~(p[:-2,1:-1]&p[2:,1:-1]&p[1:-1,:-2]&p[1:-1,2:])
def denoise(r):
    h,w,_=r.shape; o=r.copy(); key=r[...,0]*65536+r[...,1]*256+r[...,2]; al=r[...,3]>0
    for y in range(1,h-1):
        for x in range(1,w-1):
            if not al[y,x]: continue
            nb=[key[y+dy,x+dx] for dy in (-1,0,1) for dx in (-1,0,1) if (dy or dx) and al[y+dy,x+dx]]
            if len(nb)<8: continue
            if sum(k==key[y,x] for k in nb)<2:
                vals,cnt=np.unique(nb,return_counts=True)
                if cnt.max()>=4: v=vals[cnt.argmax()]; o[y,x,:3]=[v//65536,(v//256)%256,v%256]
    return o
def biggest(r):
    s=r[...,3]>0; seen=np.zeros_like(s); best=None; h,w=s.shape
    for y0,x0 in zip(*np.where(s)):
        if seen[y0,x0]: continue
        q=deque([(y0,x0)]); seen[y0,x0]=1; pts=[]
        while q:
            y,x=q.popleft(); pts.append((y,x))
            for dy in (-1,0,1):
                for dx in (-1,0,1):
                    ny,nx=y+dy,x+dx
                    if 0<=ny<h and 0<=nx<w and s[ny,nx] and not seen[ny,nx]: seen[ny,nx]=1; q.append((ny,nx))
        if best is None or len(pts)>len(best): best=pts
    ys,xs=np.array(best).T; mk=np.zeros_like(s); mk[ys,xs]=1; p=r.copy(); p[~mk,3]=0
    return p[ys.min():ys.max()+1,xs.min():xs.max()+1]
def body(src,v,px):
    """Two snaps on the same grid: with the mask palette (to find the small head) and without (clean skin)."""
    r=native(src,px); r[np.abs(r[...,:3]-TEALC).sum(2)<60,3]=0
    bare='hero-bare' if v=='hero' else 'hero-big-bare'
    full=denoise(snap(r.copy(),pal_of(v))); skin=denoise(snap(r.copy(),pal_of(bare)))
    full[edge(full[...,3]>0),:3]=OUT; skin[edge(skin[...,3]>0),:3]=OUT
    both=np.concatenate([full,skin],1)
    b=biggest(np.concatenate([full,np.zeros_like(full)],1))
    ys,xs=np.where(full[...,3]>0)
    sl=(slice(ys.min(),ys.max()+1),slice(xs.min(),xs.max()+1))
    return full[sl], skin[sl]
def label(s):
    lab=np.zeros(s.shape,int); n=0; h,w=s.shape
    for y0,x0 in zip(*np.where(s)):
        if lab[y0,x0]: continue
        n+=1; q=deque([(y0,x0)]); lab[y0,x0]=n
        while q:
            y,x=q.popleft()
            for dy in (-1,0,1):
                for dx in (-1,0,1):
                    ny,nx=y+dy,x+dx
                    if 0<=ny<h and 0<=nx<w and s[ny,nx] and not lab[ny,nx]: lab[ny,nx]=n; q.append((ny,nx))
    return lab,n
def cut_row(sm):
    w=sm.sum(1); return int(np.where(w>=0.55*w.max())[0][0])
def head_of(v):
    a=load(f'{v}-idle.png'); al=a[...,3]>0; sm=near(a[...,:3],SHIRT)&al
    ic=cut_row(sm); xs=np.where(sm[ic:ic+3].any(0))[0]; return a[:ic], ic, (xs.min()+xs.max())//2
def anchor(d):
    al=d[...,3]>0; mm=near(d[...,:3],MASKC)&al; ys,xs=np.where(mm)
    top=ys<d.shape[0]*0.6; ys,xs=ys[top],xs[top]; cx=int(np.median(xs))
    keep=np.abs(xs-cx)<=6; ys,xs=ys[keep],xs[keep]; chin=ys.max()
    sm=near(d[...,:3],SHIRT)&al
    for y in range(chin-3,d.shape[0]):
        if sm[y,cx-3:cx+4].sum()>=4: return y,cx,(ys.min(),ys.max(),xs.min(),xs.max())
def build(full,skin,headv):
    d=skin.copy(); d0=skin.copy(); hd,ic,nx=head_of(headv); ac,cx,(y0,y1,x0,x1)=anchor(full)
    box=np.zeros(d.shape[:2],bool); box[max(0,y0-1):ac, x0-1:x1+2]=True
    d[box&~near(d[...,:3],SHIRT)]=0
    pad=30; H=d.shape[0]+pad; W=d.shape[1]+2*pad
    o=np.zeros((H,W,4),int); o[pad:,pad:pad+d.shape[1]]=d
    oy=pad+ac-ic; ox=pad+cx-nx; hm=hd[...,3]>0
    o[oy:oy+hd.shape[0], ox:ox+hd.shape[1]][hm]=hd[hm]
    # The raised arms go in front of the bigger head: skin pieces above the neck that mostly stick out of it.
    arm=near(d0[...,:3],SK)&(d0[...,3]>0); arm[ac:]=False
    head=np.zeros(o.shape[:2],bool); head[oy:oy+hd.shape[0], ox:ox+hd.shape[1]]=hm
    lab,n=label(arm)
    keep=np.zeros_like(arm)
    for i in range(1,n+1):
        m=lab==i; yy,xx=np.where(m)
        if (~head[pad+yy,pad+xx]).mean()>=0.5 and m.sum()>=6: keep|=m
    arm=keep
    ay,ax=np.where(arm); o[pad+ay,pad+ax]=d0[ay,ax]
    am=np.zeros(o.shape[:2],bool); am[pad+ay,pad+ax]=True
    p2=np.pad(am,1); ring=~am&(p2[:-2,1:-1]|p2[2:,1:-1]|p2[1:-1,:-2]|p2[1:-1,2:])
    o[ring&(o[...,3]>0)&~near(o[...,:3],SK),:3]=OUT
    s=o[...,3]>0; o[edge(s),:3]=OUT
    ys,xs=np.where(o[...,3]>0); return o[ys.min():ys.max()+1, xs.min():xs.max()+1]
F=float(sys.argv[1]) if len(sys.argv)>1 else 1.18
JOBS=[('q0.png','hero',0,15.87),('q1.png','hero',1,15.62),('q4.png','hero-big',0,14.36),('q5.png','hero-big',1,14.13)]
for src,v,k,px in JOBS:
    full,skin=body(src,v,px/F)
    for hv in (v, v.replace('hero','hero-bare') if v=='hero' else 'hero-big-bare'):
        o=build(full,skin,hv); Image.fromarray(o.astype(np.uint8)).save(f'f-{hv}-{k}.png'); print(hv,k,o.shape)
vs=['hero','hero-bare','hero-big','hero-big-bare']
im=Image.new('RGBA',(3*60*4,84*4*4),(87,151,161,255))
for r,v in enumerate(vs):
  for c,n in enumerate([v+'-idle.png',f'f-{v}-0.png',f'f-{v}-1.png']):
    s=Image.open(n).convert('RGBA'); s=s.resize((s.width*4,s.height*4),Image.NEAREST)
    im.alpha_composite(s,(c*240+8,(r+1)*336-8-s.height))
im.convert('RGB').save('fchk.png')

# Final frames: per variant the same canvas, feet on the bottom row, the shirt's centre on the middle column.
import os
OUTD=sys.argv[2] if len(sys.argv)>2 else '/mnt/project-files/art/vip-fx/dance'
def centre(a):
    sm=near(a[...,:3],SHIRT)&(a[...,3]>0); c=cut_row(sm); xs=np.where(sm[c:c+4].any(0))[0]
    return (xs.min()+xs.max())//2
for v in vs:
    fr=[load(f'f-{v}-0.png'), load(f'f-{v}-1.png')]
    fr.append(fr[0][:, ::-1].copy())
    cs=[centre(a) for a in fr]
    half=max(max(c, a.shape[1]-c) for a,c in zip(fr,cs))+1
    H=max(a.shape[0] for a in fr); W=half*2
    os.makedirs(f'{OUTD}/{v}', exist_ok=True)
    for i,(a,c) in enumerate(zip(fr,cs)):
        o=np.zeros((H,W,4),np.uint8); y=H-a.shape[0]; x=half-c
        o[y:,x:x+a.shape[1]]=a
        Image.fromarray(o).save(f'{OUTD}/{v}/dance-{i}.png')
    print(v,'canvas',W,'x',H)
