// Simulation (run « idées » du 19/10/2026 20:30) : faux départs de la porte du visage (gate.js) quand l'humeur et les
// indices du visage dérivent lentement (AR(1)), et trois correctifs. Pour la relancer : copier ce fichier dans
// app/src/services/mood/ puis `npx vitest run src/services/mood/porte-autocorrelation-sim.test.js --reporter=verbose`.
// 300 tirages sans lien (faux départs) et 150 avec un lien visage ↔ humeur ρ = 0,5 au niveau du jour, 120 jours,
// 80 % de jours notés, regards hebdomadaires, z ≥ 3,29 deux regards de suite, ≥ 30 jours (règle de gate.js).
// phiM / phiF = autocorrélation d'un jour à l'autre de l'humeur / des indices ; share = part de la dérive dans l'indice.
import { it } from 'vitest'
import { faceIndexLoo, jackknifeCorrelation } from './gate'
function rng(seed){let s=seed>>>0||1;const u=()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296};const normal=()=>{let a=0;while(!a)a=u();return Math.sqrt(-2*Math.log(a))*Math.cos(2*Math.PI*u())};return{u,normal}}
function sim({seed,n=120,phiM=0,phiF=0,share=1,rho=0}){const {u,normal}=rng(seed);const K=['smile','brow','eyes','mouth','valence','arousal'];const f={};for(const k of K)f[k]=normal();let m=normal();const days=[];
for(let i=0;i<n;i++){m=phiM*m+Math.sqrt(1-phiM*phiM)*normal();const face={};for(const k of K){f[k]=phiF*f[k]+Math.sqrt(1-phiF*phiF)*normal();face[k]=Math.sqrt(share)*f[k]+Math.sqrt(1-share)*normal()}
face.valence=rho*m+Math.sqrt(1-rho*rho)*face.valence;if(u()>0.8)continue;const note=Math.min(5,Math.max(1,Math.round(3+0.9*m+0.5*normal())));days.push({i,note,face})}return days}
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length
function lag1(x){const m=mean(x);let num=0,den=0;for(let i=0;i<x.length;i++){den+=(x[i]-m)**2;if(i)num+=(x[i]-m)*(x[i-1]-m)}return den>0?num/den:0}
function detrend(days,w=14){const K=Object.keys(days[0].face);return days.map(d=>{const prev=days.filter(e=>d.i-e.i>0&&d.i-e.i<=w);if(prev.length<5)return null;const face={};for(const k of K)face[k]=d.face[k]-mean(prev.map(e=>e.face[k]));return{i:d.i,note:d.note-mean(prev.map(e=>e.note)),face}}).filter(Boolean)}
function solve(A,b){const n=b.length;const M=A.map((r,i)=>[...r,b[i]]);for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(M[r][c])>Math.abs(M[p][c]))p=r;[M[c],M[p]]=[M[p],M[c]];for(let r=0;r<n;r++){if(r===c)continue;const f=M[r][c]/M[c][c];for(let k=c;k<=n;k++)M[r][k]-=f*M[c][k]}}return M.map((r,i)=>r[n]/r[i])}
function blockIndex(days,h){const K=Object.keys(days[0].face).sort();const cols=K.map(k=>{const v=days.map(d=>d.face[k]);const m=mean(v);const sd=Math.sqrt(v.reduce((a,x)=>a+(x-m)**2,0)/(v.length-1));return v.map(x=>(x-m)/sd)});const X=days.map((_,i)=>[1,...cols.map(c=>c[i])]);const y=days.map(d=>d.note);
return days.map((d,i)=>{const tr=days.map((e,j)=>j).filter(j=>Math.abs(days[j].i-d.i)>h);const p=X[0].length;const A=Array.from({length:p},()=>Array(p).fill(0));const b=Array(p).fill(0);for(const j of tr){for(let a=0;a<p;a++){b[a]+=X[j][a]*y[j];for(let c=0;c<p;c++)A[a][c]+=X[j][a]*X[j][c]}}for(let a=1;a<p;a++)A[a][a]+=10;const w=solve(A,b);return X[i].reduce((s,x,a)=>s+x*w[a],0)})}
function z(days,mode){const fit=mode.block?{index:blockIndex(days,mode.block)}:faceIndexLoo(days);if(!fit)return 0;const y=days.map(d=>d.note);let {z}=jackknifeCorrelation(fit.index,y);if(mode.neff){const a=Math.max(0,lag1(fit.index))*Math.max(0,lag1(y));z*=Math.sqrt((1-a)/(1+a))}return z}
function opens(days,mode){const D=mode.detrend?detrend(days):days;let streak=0;for(let look=6;look<120;look+=7){const pool=D.filter(d=>d.i<=look);if(pool.length<30)continue;streak=z(pool,mode)>=3.29?streak+1:0;if(streak>=2)return true}return false}
it('sim',()=>{const out=[];const modes={actuel:{},'neff+detrend':{neff:1,detrend:1},'bloc7+neff':{block:7,neff:1},'bloc7+neff+detrend':{block:7,neff:1,detrend:1}};
for(const [phiM,phiF,share] of [[0,0,1],[0.4,0.4,1],[0.6,0.6,1],[0.6,0.9,0.5],[0.8,0.95,0.5],[0.9,0.95,0.7]])for(const [name,mode] of Object.entries(modes)){let k=0;for(let s=1;s<=300;s++)if(opens(sim({seed:s*7+3,phiM,phiF,share}),mode))k++;let p=0;for(let s=1;s<=150;s++)if(opens(sim({seed:s*11+5,phiM,phiF,share,rho:0.5}),mode))p++;
out.push(`| ${phiM} | ${phiF} | ${share} | ${name} | ${(100*k/300).toFixed(1)} % | ${(100*p/150).toFixed(0)} % |`)}console.log(out.join('\n'))},900000)
