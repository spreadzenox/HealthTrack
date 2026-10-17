# Simulation des règles « chez vous : … » (I102–I103, journal/IDEES.md, run « idées » du 17/10/2026 20:30).
# Séries AR(1) (autocorrélation 0,4) ; renvoie, par règle et nombre de jours, la part de tirages où :
#   (1) un sens est affiché et c'est le bon, (2) un sens est affiché à tort (aucun lien ou sens inversé),
#   (3) « pas de lien notable » est dit (borne haute à 95 % de |effet| < 0,2).
# Outil de recherche hors app, pas du code de HealthTrack. Usage : python3 sens-personnel-sim.py
import numpy as np
from math import erf, sqrt
rng=np.random.default_rng(1)
def ar1(n,phi):
    e=rng.standard_normal(n); x=np.empty(n); x[0]=e[0]
    for i in range(1,n): x[i]=phi*x[i-1]+sqrt(1-phi**2)*e[i]
    return x
Phi=lambda z:0.5*(1+erf(z/sqrt(2)))
def run(n,r,phi=0.4,tau=0.2,thr=0.9,reps=2000,mode='naive'):
    hit=wrong=null_ok=0
    for _ in range(reps):
        x=ar1(n,phi); noise=ar1(n,phi)
        y=r*x+sqrt(1-r*r)*noise
        if mode=='naive':
            b=np.corrcoef(x,y)[0,1]; se=1/sqrt(n-3)
        else:
            # prewhiten: residuals of AR(1) on each, then slope
            def pw(s):
                a=np.dot(s[1:]-s[1:].mean(),s[:-1]-s[:-1].mean())/np.dot(s[:-1]-s[:-1].mean(),s[:-1]-s[:-1].mean())
                return s[1:]-a*s[:-1]
            xp,yp=pw(x),pw(y); b=np.corrcoef(xp,yp)[0,1]; se=1/sqrt(n-4)
        post_var=1/(1/tau**2+1/se**2); m=post_var*b/se**2; s=sqrt(post_var)
        p=Phi(m/s)
        if max(p,1-p)>=thr:
            if r==0 or np.sign(m)!=np.sign(r): wrong+=1
            else: hit+=1
        if abs(m)+1.64*s<0.2: null_ok+=1
    return hit/reps,wrong/reps,null_ok/reps
for mode, thr in [('naive', 0.9), ('pw', 0.9), ('pw', 0.975)]:
  for n in [30, 60, 90, 120, 180]:
    print(mode, thr, n, ' '.join(f"r={r}:{run(n, r, mode=mode, thr=thr)}" for r in [0, 0.15, 0.3]))
