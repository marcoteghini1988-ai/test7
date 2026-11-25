// Coreografia di presentazione: nessun evento HP viene creato qui.
// Ogni riga corrisponde a una variante già approvata e a una dinamica diversa.
const motifs=Object.freeze({
 'gravity-maul':['piston-pressure','orbital-sling','gravity-well','prismatic-implosion'],
 'steel-rail':['mach-cut','braided-rail','compression-tunnel','refracted-lance'],
 'thermal-reclaimer':[null,null,'three-flow-furnace','crystal-converter'],
 'magnetic-grapple':[null,'winch-snap','magnetic-arch','crystal-cage'],
 'alloy-collision':[null,null,'pole-collapse','prismatic-crush'],
 induction:[null,null,'three-plane-shear','crystal-interference'],
 'cascade-piercer':[null,null,'residual-drill','prismatic-relay'],
 'wandering-shrapnel':[null,'indexed-fragment','recoil-splinter','prismatic-fracture']
});
const weights=Object.freeze({
 'gravity-maul':1.3,'steel-rail':.62,'thermal-reclaimer':.95,
 'magnetic-grapple':.5,'alloy-collision':1.6,induction:.7,
 'cascade-piercer':.8,'wandering-shrapnel':.85
});
export const clamp01=n=>Math.max(0,Math.min(1,n));
export function weaponTravelProgress(kind,progress){
 const t=clamp01(progress);
 if(kind==='gravity-maul')return .20*t+.80*t**1.55;
 if(kind==='steel-rail')return .06*t+.94*t**1.9;
 if(kind==='thermal-reclaimer')return t+.045*Math.sin(t*Math.PI*2);
 if(kind==='magnetic-grapple')return .4*t+.6*t**.7;
 if(kind==='induction')return t+.035*Math.sin(t*Math.PI*4);
 if(kind==='cascade-piercer')return t**1.45;
 return t;
}
export function cinematicStyle(profile){
 const motif=motifs[profile.kind]?.[profile.tier];
 if(!profile.approved||!motif)return null;
 return Object.freeze({motif,weight:weights[profile.kind],
  // Particle budget is bounded even in a three-card resolution.
  fragments:14+profile.tier*5,smoke:7+profile.tier*2,
  prism:profile.tier===3,version:3});
}
export function weaponHullFrame(kind,age,duration,{tier=0,direction=1,reduced=false,blocked=false}={}){
 const zero={x:0,y:0,roll:0,pitch:0,lift:0,light:0,thrust:0};
 if(blocked||kind==='alloy-collision'||age<0||age>=duration||!weights[kind])return zero;
 const t=age/duration,tail=(1-t)**2,kick=(1-Math.exp(-age/11))*Math.exp(-age/160);
 const w=weights[kind]*(1+tier*.07),r={...zero,light:Math.exp(-age/145)*.85};
 if(reduced)return {...r,light:r.light*.3};
 if(kind==='gravity-maul'){
  r.y=direction*(10*kick-3*Math.sin(age/65)*tail);r.pitch=-direction*12*kick;
  r.roll=Math.sin(age/42)*3.5*tail;r.lift=-4*Math.sin(Math.min(1,t*2)*Math.PI)*tail;
 }else if(kind==='steel-rail'||kind==='cascade-piercer'){
  r.y=direction*7*kick;r.roll=direction*Math.sin(age/31)*4.5*Math.exp(-age/150);
  r.pitch=-direction*7*kick;r.x=Math.sin(age*.14)*2.2*Math.exp(-age/85);
 }else if(kind==='thermal-reclaimer'){
  r.y=direction*6*kick;r.pitch=direction*6*kick;
  r.lift=-3*Math.sin(Math.min(1,t*1.8)*Math.PI)*tail;r.light=Math.exp(-age/320)*.85;
 }else if(kind==='magnetic-grapple'){
  r.y=-direction*5*kick;r.roll=direction*6*kick;r.pitch=direction*5*kick;
 }else if(kind==='induction'){
  r.x=Math.sin(age*.19)*2.8*Math.exp(-age/145);r.roll=Math.sin(age*.12)*3*tail;
  r.light=(.55+.45*Math.cos(age*.065))*Math.exp(-age/230);
 }else{
  r.roll=direction*11*kick;r.x=direction*4*kick;r.y=direction*6*kick;r.pitch=8*kick;
 }
 r.thrust=w*kick*.65;
 for(const key of ['x','y','roll','pitch','lift'])r[key]*=w;
 return r;
}
// Stable per event, independent of rendering frame rate and replay order.
export function weaponVisualSeed(shot){
 let seed=2166136261;
 for(const c of `${shot.cardId}:${shot.who}:${shot.targetKind}:${shot.targetId}:${shot.cascadeIndex||0}:${shot.salvoIndex||0}:${shot.ply||0}`)
  seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
 return seed;
}
export function seededUnit(seed,index){
 let n=(seed+Math.imul(index+1,0x9e3779b9))>>>0;
 n=Math.imul(n^(n>>>16),0x21f0aaad);n=Math.imul(n^(n>>>15),0x735a2d97);
 return ((n^(n>>>15))>>>0)/4294967296;
}
