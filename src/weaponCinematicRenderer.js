import {electricFlight,electricImpact,kineticImpact} from './approvedProjectileEffects.js';
import {Vector3} from 'three';
import {boardPointToWorld,worldPointToBoard} from './maglioProjectile3D.js';
import {thermalChargeForShot} from './metalWeaponBattleVisuals.js';
import {cinematicStyle,clamp01,weaponVisualSeed,seededUnit,weaponTravelProgress} from './weaponCinematicStyle.js';
import {weaponFlightFrame} from './weaponKinematics.js';
import {weaponHullImpactProfile,weaponImpactHullFrame,weaponHullContactPoint,
 weaponHullImpactRadius,hullImpactEnvelope} from './weaponHullImpacts.js';

const TAU=Math.PI*2;
const UP=new Vector3(0,1,0);
const prism=['#c4f5ff','#c9b3ff','#f9e5ff','#8cdbff'];
const rgba=(hex,a)=>{const h=hex.slice(1);return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${clamp01(a)})`;};
const point=(ctx,p,first)=>first?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y);
export function prepareCinematicEntry(path,camera){
 const style=cinematicStyle(path.profile);if(!style)return null;
 if(path.profile.kind!=='alloy-collision'&&!path.shot.fires&&!path.shot.defenseBlocked)return null;
 const a=boardPointToWorld(path.from,camera),b=boardPointToWorld(path.to,camera);
 const axis=b.clone().sub(a).normalize(),side=new Vector3(axis.z,0,-axis.x);
 return {...path,style,a,b,axis,side,seed:weaponVisualSeed(path.shot),
  thermal:thermalChargeForShot(path.shot),camera};
}
function local(entry,center,side=0,up=0,back=0){
 const scale=entry.flightScale||1;
 return center.clone().addScaledVector(entry.side,side*scale).addScaledVector(entry.axis,-back*scale)
  .addScaledVector(entry.flightUp||UP,up*scale);
}
const project=(entry,p)=>worldPointToBoard(p,entry.camera);
function polygon(ctx,points,fill,stroke=null,width=1){
 ctx.beginPath();points.forEach((p,i)=>point(ctx,p,i===0));ctx.closePath();
 if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
}
function glow(ctx,p,r,color,opacity=1,stretch=1){
 if(r<.1||opacity<.002)return;
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,stretch);
 const g=ctx.createRadialGradient(0,0,0,0,0,r);
 g.addColorStop(0,rgba(color,.78*opacity));g.addColorStop(.23,rgba(color,.32*opacity));g.addColorStop(1,rgba(color,0));
 ctx.fillStyle=g;ctx.fillRect(-r,-r,r*2,r*2);ctx.restore();
}
function streak(ctx,a,b,color,width,opacity=1){
 ctx.save();ctx.globalAlpha*=opacity;ctx.lineCap='round';
 const g=ctx.createLinearGradient(a.x,a.y,b.x,b.y);g.addColorStop(0,rgba(color,0));g.addColorStop(1,color);
 ctx.strokeStyle=g;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();
}
// Cross sections live in world space; the front/rear camera never sees the
// same pasted ellipse. Width, foreshortening and occlusion follow the table.
function ring(ctx,e,center,r,tilt,color,alpha=1,segments=48,start=0,end=TAU){
 ctx.save();ctx.globalAlpha*=alpha;
 for(let i=0;i<segments;i++){
  const a=start+(end-start)*i/segments,b=start+(end-start)*(i+1)/segments;
  const thickness=.012+Math.min(.012,r*.02);
  const vertices=[[a,r-thickness],[b,r-thickness],[b,r+thickness],[a,r+thickness]].map(([angle,radius])=>
   project(e,local(e,center,Math.cos(angle)*radius,Math.sin(angle)*radius*Math.sin(tilt),Math.sin(angle)*radius*Math.cos(tilt))));
  const light=.35+.65*Math.max(0,Math.sin(a+tilt+.8));
  polygon(ctx,vertices,rgba(color,.35+light*.6));
 }
 ctx.restore();
}
function ribbon(ctx,e,nose,{length=1.5,radius=.14,phase=0,turns=1,color=e.profile.glow,alpha=.7,width=.035}={}){
 const rear=e.profile.kind==='gravity-maul'?.88:e.profile.kind==='thermal-reclaimer'?.9:1.1;
 const edge=[[],[]];
 for(let i=0;i<=28;i++){
  const u=i/28,angle=u*TAU*turns+phase,spread=radius*(.65+u*.7);
  for(let s=0;s<2;s++){
   const a=angle+(s?width:-width)/(spread||1);
   edge[s].push(project(e,local(e,nose,Math.cos(a)*spread,.04+Math.sin(a)*spread,rear+u*length)));
  }
 }
 const head=edge[0][0],tail=edge[0][28],g=ctx.createLinearGradient(head.x,head.y,tail.x,tail.y);
 g.addColorStop(0,rgba(color,alpha));g.addColorStop(.6,rgba(color,alpha*.45));g.addColorStop(1,rgba(color,0));
 polygon(ctx,[...edge[0],...edge[1].reverse()],g);
}
// A shaded shard has a moving bright face, dark side and ballistic height.
// It is a piece of the contact effect, never a secondary damaging projectile.
function shard(ctx,e,world,size,rotation,color,alpha){
 const x=new Vector3(Math.cos(rotation),Math.sin(rotation)*.55,Math.sin(rotation*.7)).multiplyScalar(size);
 const y=new Vector3(-Math.sin(rotation)*.4,.7,Math.cos(rotation)*.65).multiplyScalar(size*.55);
 const a=project(e,world.clone().sub(x)),b=project(e,world.clone().add(x));
 const c=project(e,world.clone().add(y)),d=project(e,world.clone().addScaledVector(y,-.6));
 ctx.save();ctx.globalAlpha*=alpha;
 polygon(ctx,[a,b,c],color,'#e7edf144',.35);polygon(ctx,[a,d,b],'#27323c');
 streak(ctx,a,c,'#effaff',.55,.65);ctx.restore();
}
const smokeTextures=new Map();
function smoke(ctx,e,p,size,alpha,hot=false){
 const color=hot?e.profile.glow:'#8c9eae',key=color+hot;
 let smokeTexture=smokeTextures.get(key);
 if(!smokeTexture){
  const c=document.createElement('canvas');c.width=96;c.height=96;
  const cx=c.getContext('2d'),im=cx.createImageData(96,96);
  for(let y=0;y<96;y++)for(let x=0;x<96;x++){
   const dx=(x-48)/48,dy=(y-48)/48,r=Math.hypot(dx,dy);
   const n=.60+.21*Math.sin(x*.23+Math.cos(y*.19)*3)+.14*Math.sin(y*.43+x*.13);
   const normal=Math.sqrt(Math.max(0,1-r*r)),light=.22+Math.max(0,-dx*.37-dy*.48+normal*.6);
   const i=(y*96+x)*4;
   for(let channel=0;channel<3;channel++)im.data[i+channel]=parseInt(color.slice(1+channel*2,3+channel*2),16)*light;
   im.data[i+3]=Math.max(0,1-r*r)**1.3*n*(hot?245:200);
  }cx.putImageData(im,0,0);smokeTexture=c;smokeTextures.set(key,c);
 }
 const q=project(e,p),edge=project(e,p.clone().addScaledVector(e.side,size)),r=Math.hypot(q.x-edge.x,q.y-edge.y);
 ctx.save();ctx.globalAlpha*=alpha;ctx.translate(q.x,q.y);ctx.rotate(size*1.7);
 ctx.drawImage(smokeTexture,-r,-r*.8,r*2,r*1.6);ctx.restore();
 if(hot)glow(ctx,q,r*.7,e.profile.glow,alpha*.45,.8);
}
function particles(floor,air,e,ms,{cone=null,inward=false,hot=false,count=e.style.fragments,spread=1,speed=1}={}){
 const age=ms/1000;if(age<0)return;
 for(let i=0;i<count;i++){
  const r=n=>seededUnit(e.seed,i*13+n),delay=r(1)*.045,t=Math.max(0,age-delay);
  if(age<delay)continue;
  const life=.32+r(2)*.55,fade=clamp01(1-t/life);if(!fade)continue;
  const angle=cone===null?r(3)*TAU:cone+(r(3)-.5)*spread;
  let distance=t*(.8+r(4)*2.8)*speed;
  if(inward&&t<.10)distance=(1-t/.10)*(.45+r(4)*.5);
  const height=Math.max(.015,t*(.8+r(5)*2.4)-t*t*4.3);
  const p=local(e,e.b,Math.cos(angle)*distance,height,-Math.sin(angle)*distance);
  const shadow=p.clone();shadow.y=0;const s=project(e,shadow);
  floor.save();floor.globalAlpha=.18*fade;floor.fillStyle='#02060b';
  floor.beginPath();floor.ellipse(s.x,s.y,2+r(4)*2,.8,0,0,TAU);floor.fill();floor.restore();
  const color=e.style.prism?prism[i%4]:i%4===0?e.profile.glow:i%3?'#9eafbc':'#e1cfb8';
  const size=.025+r(6)*.06;
  shard(air,e,p,size,t*(r(7)*16+4)+r(8)*TAU,color,fade);
  if(hot&&i%3===0){const q=project(e,p),tail=project(e,p.clone().addScaledVector(e.axis,-.10));
   streak(air,tail,q,e.profile.core,1.05,fade);glow(air,q,5,e.profile.glow,fade*.5);}
 }
}
function floorWave(ctx,e,ms,{delay=0,radius=1.1,color=e.profile.secondary,alpha=.65}={}){
 const t=(ms-delay)/500;if(t<0||t>=1)return;
 ring(ctx,e,e.b,(.08+Math.sqrt(t)*radius),0,color,alpha*(1-t)**2);
 // Dust occupies the table surface; the core and sparks occupy the air.
 for(let i=0;i<11;i++){
  const a=i*2.399+seededUnit(e.seed,i),r=.12+t*radius;
  const p=local(e,e.b,Math.cos(a)*r,.015,Math.sin(a)*r);
  glow(ctx,project(e,p),4+t*9,'#abb4c1',.12*(1-t),.38);
 }
}
function charge(floor,air,e,elapsed){
 const {profile:p}=e,ms=p.chargeMs||0;if(!ms)return;
 const t=clamp01(1+elapsed/ms);
 if(elapsed<-ms||elapsed>=0||e.shot.cascadeTransfer)return;
 const source=e.from,o=boardPointToWorld(source,e.camera);
 const color=p.glow;
 glow(floor,source,30+t*32,color,t*.5,.28);
 air.save();air.globalAlpha=t;
 if(p.kind==='thermal-reclaimer'){
  // Exactly three collectors converge locally. No fake HP is drained from ships.
  for(let b=0;b<3;b++)for(let i=0;i<16;i++){
   const u=i/15,a=b*TAU/3+u*2.5-t*3,r=(1-u)*(.8+t*.18);
   const q=project(e,local(e,o,Math.cos(a)*r,.12+Math.sin(a)*r*.5,(1-u)*.7));
   const q2=project(e,local(e,o,Math.cos(a+.06)*r,.12+Math.sin(a+.06)*r*.5,(1-u)*.68));
   streak(air,q,q2,b===1?p.core:color,1.4+t*1.1,.3+t*.7);
  }
  glow(air,project(e,o),17+t*12,color,.3+e.thermal.ratio*.5);
  if(e.style.prism)ring(air,e,o,.38-t*.12,Math.PI/2,prism[1],t);
 }else if(p.kind==='gravity-maul'){
  const count=p.tier===0?5:8+p.tier*2;
  for(let i=0;i<count;i++){
   const a=i*2.399-t*3,r=(1-t)*.75+.14;
   const q=local(e,o,Math.cos(a)*r,.1+Math.sin(a)*r*.6,Math.sin(a)*r*.35);
   shard(air,e,q,.035,a,p.tier===3?prism[i%4]:'#8999a5',t*.65);
  }
  for(let i=0;i<=p.tier;i++)ring(air,e,o,.46-t*.25+i*.10,.35+i*.4,i%2?p.secondary:color,t*.65);
 }else if(p.kind==='steel-rail'){
  for(const s of [-1,1]){
   const a=project(e,local(e,o,s*(.30-t*.13),.02,-.5));
   const b=project(e,local(e,o,s*(.30-t*.13),.02,.65));
   streak(air,b,a,p.secondary,2.2,t);streak(air,b,a,p.core,.7,t);
  }
  if(p.tier===1)ring(air,e,o,.35,Math.PI/2,p.secondary,t);
  if(p.tier>=2)for(let i=0;i<3;i++)ring(air,e,local(e,o,0,0,i*.26),.32-t*.18,Math.PI/2,
   p.tier===3?prism[i]:p.secondary,t);
 }else if(p.kind==='induction'){
  for(let i=0;i<3;i++){
   const h=.08+i*.10,a=project(e,local(e,o,-.5*(1-t)+.12,h,0));
   const b=project(e,local(e,o,.5*(1-t)-.12,h,0));
   streak(air,a,b,p.tier===3?prism[i]:p.core,1.3,t);
  }
 }else if(p.kind==='magnetic-grapple'){
  for(let i=0;i<3;i++)ring(air,e,local(e,o,0,0,i*.20),.22,Math.PI/2,p.secondary,t*(1-i*.2));
 }else if(p.kind==='cascade-piercer'){
  for(let i=0;i<3;i++)ring(air,e,local(e,o,0,0,i*.32),.32*(1-.35*t),Math.PI/2,
   p.tier===3?prism[i]:p.secondary,t);
 }else if(p.kind==='wandering-shrapnel'){
  for(let i=0;i<5;i++){
   const a=(i-2)*.29,s=.35;
   const pos=local(e,o,Math.sin(a)*s,.04,Math.cos(a)*s);
   shard(air,e,pos,.055,a,i===((e.shot.stage||1)-1)%5?color:p.secondary,t*.8);
  }
 }
 air.restore();
}
function gravityFlight(floor,air,e,nose,t,age){
 const p=e.profile;
 for(let i=0;i<=p.tier;i++)ribbon(floor,e,nose,{length:.9+i*.12,radius:.12+i*.045,
  phase:age*.008+i*TAU/(1+p.tier),turns:p.tier===0?.08:1+p.tier*.25,
  color:p.tier===3?prism[i]:i%2?p.secondary:p.glow,alpha:.72,width:.026});
 if(p.tier>=1)for(let i=0;i<5+p.tier*2;i++){
  const a=i*2.399+age*.003,r=.24+(i%3)*.045;
  shard(air,e,local(e,nose,Math.cos(a)*r,.05+Math.sin(a)*r,.5+(i%3)*.35),.025,a,
   p.tier===3?prism[i%4]:'#7e8e9c',.65);
 }
 if(p.tier>=2){
  const q=local(e,nose,0,0,.30);
  ring(floor,e,q,.40,Math.PI/2,p.secondary,.38);
  if(p.tier===3)for(let i=0;i<3;i++)ring(floor,e,q,.38+i*.08,.6+i*.8,prism[i],.4,32,age*.003,age*.003+Math.PI*1.4);
 }
 if(p.tier===3){
  const phase=age*.004,ends=[local(e,nose,0,.05,.10),local(e,nose,0,.05,1.02)];
  const belt=Array.from({length:4},(_,i)=>local(e,nose,Math.cos(phase+i*TAU/4)*.37,
   .05+Math.sin(phase+i*TAU/4)*.37,.55));
  for(let i=0;i<4;i++)for(const end of ends)polygon(floor,[project(e,end),project(e,belt[i]),project(e,belt[(i+1)%4])],
   rgba(prism[i],.055),rgba(prism[i],.48),.8);
 }
 // Turbulent vapor is pulled into the wake; its lit side and height show
 // real volume instead of adding more flat circles around the projectile.
 for(let i=0;i<7+p.tier*2;i++){
  const u=(age*.0012+i*.117)%1,a=i*2.399-age*.004;
  smoke(floor,e,local(e,nose,Math.cos(a)*(.10+u*.14),.10+Math.sin(a)*.12,.92+u*1.1),
   .12+u*.12,(1-u)*.50,false);
 }
 glow(floor,project(e,local(e,nose,0,0,.5)),19,p.glow,.25,.45);
}
function railFlight(floor,air,e,nose,t,age){
 const p=e.profile,n=p.tier===0?1:p.tier===1?2:3;
 if(e.shot.finisher){
  const head=project(e,local(e,nose,0,.02,.85)),tail=project(e,local(e,nose,0,.02,3.65));
  const light=floor.createLinearGradient(head.x,head.y,tail.x,tail.y);
  light.addColorStop(0,rgba(p.core,.95));light.addColorStop(.45,rgba(p.secondary,.62));light.addColorStop(1,rgba(p.glow,0));
  // The seventh round is a charged lance, with two luminous blade planes
  // and a continuous shaft, different from the six preceding tracers.
  for(const vertical of [false,true]){
   const points=[[-.065,.80],[.065,.80],[.018,3.65],[-.018,3.65]].map(([w,z])=>
    project(e,local(e,nose,vertical?0:w,vertical?w+.02:.02,z)));
   polygon(floor,points,light);
  }
  streak(floor,tail,head,p.core,2.7,.95);glow(floor,head,18,p.secondary,.65);
 }
 for(let i=0;i<n;i++)ribbon(floor,e,nose,{length:1.9,radius:p.tier===0?.018:.12+i*.025,
  phase:age*.017+i*TAU/n,turns:p.tier===1?1.8:p.tier===3?.65:.15,
  color:p.tier===3?prism[i]:i?p.secondary:p.core,width:i===0?.034:.023,alpha:.90});
 // Mach cone / compression funnel, distinct from the heavy gravitational wake.
 for(let i=0;i<(p.tier>=2?3:1);i++){
  const back=.75+((age*.002+i*.33)%1)*1.55;
  const center=local(e,nose,0,0,back);
  if(p.tier!==3)ring(floor,e,center,.09+(back-.6)*.16,Math.PI/2,p.secondary,.55);
  else{
   const r=.12+(back-.6)*.12;
   const points=Array.from({length:3},(_,n)=>project(e,local(e,center,
    Math.cos(n*TAU/3+age*.002)*r,.04+Math.sin(n*TAU/3+age*.002)*r,0)));
   polygon(floor,points,rgba(prism[i],.08),rgba(prism[i],.65),1);
  }
 }
 const a=project(e,local(e,nose,0,.02,2.7)),b=project(e,local(e,nose,0,.02,.95));
 streak(floor,a,b,p.core,1.4,.65);
 glow(floor,b,16,p.glow,.33,.7);
}
function thermalFlight(floor,air,e,nose,t,age){
 const p=e.profile,hot=e.thermal.ratio;
 for(let b=0;b<3;b++){
  ribbon(floor,e,nose,{length:1.35+hot*.6,radius:.17+hot*.08,phase:b*TAU/3-age*.01,turns:.75,
    width:.10+hot*.04,color:p.tier===3?prism[b]:b===1?p.core:p.glow,alpha:.9});
  for(let i=0;i<5;i++){
   const u=((age*.0018+i*.2)%1),a=b*TAU/3+u*2.5;
   const pos=local(e,nose,Math.cos(a)*(.14+u*.2),.07+u*.12+Math.sin(a)*.13,.95+u*1.4);
   smoke(floor,e,pos,.15+u*.18,(1-u)*(.55+hot*.3),true);
  }
 }
 glow(floor,project(e,local(e,nose,0,.04,.7)),23+hot*10,p.glow,.4+hot*.4);
}
function inductionFlight(floor,air,e,nose,t,age){
 for(let plane=0;plane<3;plane++){
  const offset=plane*.11+.04;
  const points=[];
  for(let i=0;i<=22;i++){
   const u=i/22,w=Math.sin(u*Math.PI)*(.17+plane*.08);
   points.push(project(e,local(e,nose,Math.sin(u*14-age*.018+plane*2.1)*w,offset,.55+u*1.15)));
  }
  floor.beginPath();points.forEach((p,i)=>point(floor,p,i===0));
  floor.strokeStyle=e.style.prism?prism[plane]:plane===1?e.profile.core:e.profile.secondary;
  floor.lineWidth=plane===1?2.5:1.1;floor.stroke();
  const noseP=project(e,local(e,nose,-.20,offset,.4)),rear=project(e,local(e,nose,.20,offset,1.5));
  const g=floor.createLinearGradient(noseP.x,noseP.y,rear.x,rear.y);
  g.addColorStop(0,rgba(e.profile.glow,.19));g.addColorStop(1,rgba(e.profile.glow,0));
  polygon(floor,[project(e,local(e,nose,-.24,offset,.4)),project(e,local(e,nose,.24,offset,.4)),
   project(e,local(e,nose,.10,offset,1.8)),project(e,local(e,nose,-.10,offset,1.8))],g);
 }
 if(e.style.prism){
  // A folding triangular brace refracts the three planes, not a recolor.
  const a=age*.006;
  const vertices=Array.from({length:3},(_,i)=>{
   const phase=a+i*TAU/3;
   return project(e,local(e,nose,Math.cos(phase)*.31,.12+Math.sin(phase)*.31,.63));
  });
  polygon(air,vertices,rgba('#b5d9ff',.07),rgba('#d8e7ff',.65),1.1);
  for(let i=0;i<3;i++){
   const phase=a+i*TAU/3;
   shard(air,e,local(e,nose,Math.cos(phase)*.31,.12+Math.sin(phase)*.31,.63),.07,phase,prism[i],.85);
  }
 }
}
function precisionFlight(floor,air,e,nose,t,age){
 const p=e.profile,cascade=p.kind==='cascade-piercer',residue=e.shot.cascadeTransfer?Math.max(.42,.82-e.shot.cascadeIndex*.16):1;
 if(cascade){
  for(let i=0;i<2;i++)ribbon(floor,e,nose,{length:1.8*residue,radius:.12*residue,
   phase:age*.03+i*Math.PI,turns:2.5,width:.022*residue,color:p.tier===3?prism[i]:i?p.secondary:p.glow});
  for(let i=0;i<3;i++){
   const u=(age*.002+i/3)%1;
   ring(floor,e,local(e,nose,0,0,.95+u*1.2),(.18-u*.08)*residue,Math.PI/2,
    p.tier===3?prism[i]:p.secondary,(1-u)*.65);
  }
  if(p.tier===3){
   // A physical three-strut bridge surrounds the one residual core.
   for(let i=0;i<3;i++){
    const a=i*TAU/3+age*.004,side=Math.cos(a)*.24*residue,up=.05+Math.sin(a)*.24*residue;
    const a1=project(e,local(e,nose,side,up,.55)),b1=project(e,local(e,nose,side*.65,up*.65,1.35));
    streak(air,b1,a1,prism[i],1.7,.8);
    shard(air,e,local(e,nose,side,up,.55),.06*residue,a,prism[i],.85);
   }
  }
 }else{
  ribbon(floor,e,nose,{length:.75,radius:.04,phase:0,turns:0,width:.035,color:p.glow});
  // Uneven tumbling flakes shed from one fragment, never a five-shot fan.
  for(let i=0;i<5+p.tier;i++){
   const u=(age*.0015+i*.16)%1,a=i*2.399+age*.007;
   shard(air,e,local(e,nose,Math.sin(a)*u*.17,Math.cos(a)*u*.14,.8+u*.85),
    .02+(1-u)*.02,a,p.tier===3?prism[i%4]:p.secondary,(1-u)*.8);
  }
  if(p.tier===3){
   // Four orbiting facets open and fold around this single fragment.
   for(let i=0;i<4;i++){
    const a=i*TAU/4+age*.006,r=.18+Math.sin(t*Math.PI)*.05;
    shard(air,e,local(e,nose,Math.cos(a)*r,.05+Math.sin(a)*r,.48),.065,a,prism[i],.8);
   }
  }
 }
}
// A solid, shaded pressure lobe gives a hit a readable body. It is built
// around the measured contact in the table camera, never a full-screen flash.
function pressureLobe(ctx,e,center,size,heat,alpha,color){
 const q=project(e,center),edge=project(e,local(e,center,size,0,0));
 const r=Math.hypot(q.x-edge.x,q.y-edge.y);if(r<.1||alpha<.003)return;
 const g=ctx.createRadialGradient(q.x-r*.22,q.y-r*.25,r*.04,q.x,q.y,r);
 g.addColorStop(0,rgba('#fff9e8',alpha*.96));
 g.addColorStop(.28,rgba(heat?'#ffe9b0':e.profile.core,alpha*.95));
 g.addColorStop(.61,rgba(color,alpha*.91));
 g.addColorStop(1,rgba(heat?'#a43b20':'#364c66',0));
 const points=Array.from({length:12},(_,i)=>{
  const a=i*TAU/12,noise=.68+seededUnit(e.seed,i+401)*.53;
  return project(e,local(e,center,Math.cos(a)*size*noise,Math.sin(a)*size*.76*noise,0));
 });
 polygon(ctx,points,g);
}
function drawHullContact(floor,air,e,ms,contact){
 const {profile:p}=e,age=ms/1000,fade=hullImpactEnvelope(ms,p.impactMs);
 if(!fade)return;
 const q=project(e,e.b),radius=weaponHullImpactRadius(e.to,contact);
 const unit=project(e,e.b.clone().add(e.side)),world=radius/Math.max(1,Math.hypot(unit.x-q.x,unit.y-q.y));
 const h={...e,flightScale:world,flightUp:null};
 const pop=1-Math.exp(-ms/45),heat=Math.exp(-ms/(contact.intermediate?135:260));
 const color=p.tier===3?p.glow:'#ff9e38',hot=['compression-detonation','plasma-bloom','fragmentation-burst'].includes(contact.kind);
 air.save();floor.save();
 // Every actual round has a sharp material contact, including early rounds.
 // Zero-HP packets are an armor ping rather than another damaging explosion.
 const star=(1-clamp01(ms/contact.flashMs))**.55;
 const strikeRays=()=>{if(star>0){
  const n=contact.damaging?contact.intermediate?7:11+p.tier:4;
  for(let i=0;i<n;i++){
   const a=i*2.399963+seededUnit(e.seed,i)*.35,length=.65+pop*(1.05+seededUnit(e.seed,i+9)*.90);
   const tip=local(h,h.b,Math.cos(a)*length,Math.sin(a)*length*.6,.02);
   const a1=local(h,h.b,Math.cos(a-.12)*.28,Math.sin(a-.12)*.20,0);
   const b1=local(h,h.b,Math.cos(a+.12)*.28,Math.sin(a+.12)*.20,0);
   polygon(air,[project(h,a1),project(h,tip),project(h,b1)],rgba(i%3?p.core:hot?'#ffc15b':p.secondary,star*.85));
  }
 }};
 if(!contact.damaging){
  strikeRays();particles(floor,air,h,ms,{count:4,hot:true,speed:.65});air.restore();floor.restore();return;
 }
 if(contact.kind==='compression-detonation'){
  // A crushed center opens into a dense mechanical detonation, with armor
  // pieces above it and pressure traveling over the table below it.
  const burst=clamp01((ms-38)/90);
  for(let i=0;i<(contact.intermediate?3:5+p.tier);i++){
   const a=i*2.399963,r=burst*(.12+(i%3)*.16);
   pressureLobe(air,h,local(h,h.b,Math.cos(a)*r,.06+burst*.09,Math.sin(a)*r*.5),
    .48+pop*(contact.intermediate?.48:.70),true,heat*.90,color);
  }
  if(!contact.intermediate)floorWave(floor,h,ms,{delay:40,radius:2.0,alpha:.8});
 }else if(contact.kind==='plasma-bloom'){
  const rise=clamp01(ms/390),lobes=contact.intermediate?3:6;
  for(let i=0;i<lobes;i++){
   const a=i*2.399963,r=pop*(.15+i%3*.18);
   const c=local(h,h.b,Math.cos(a)*r,.08+rise*(.4+i%3*.32),Math.sin(a)*r*.35);
   pressureLobe(air,h,c,.45+pop*.50,true,heat*.90,p.tier===3?prism[i%4]:'#ff7528');
   if(ms>80)smoke(air,h,c,world*(.24+rise*.30),fade*.42,true);
  }
 }else if(contact.kind==='armor-punch'||contact.kind==='drill-breach'){
  const drill=contact.kind==='drill-breach',length=pop*(contact.intermediate?.95:1.65);
  // A white-hot puncture and an axial ejecta jet, not a spherical fireball.
  for(let i=0;i<3;i++){
   const width=.13-i*.032,a=project(h,local(h,h.b,-width,.035,0)),b=project(h,local(h,h.b,width,.035,0));
   const tip=project(h,local(h,h.b,Math.sin(ms*.022+i)*.10,.10+length*.30,-length));
   polygon(air,[a,tip,b],rgba(i===2?p.core:p.secondary,heat*(.42+i*.17)));
  }
  const cutA=project(h,local(h,h.b,-.32,.025,.06)),cutB=project(h,local(h,h.b,.32,.025,-.06));
  streak(air,cutA,cutB,'#0a1018',Math.max(2,radius*.13),fade*.8);
  streak(air,cutA,cutB,p.core,1.4,heat);
  if(drill)for(let i=0;i<2+p.tier%2;i++){
   const phase=ms*.014+i*TAU/3;
   ring(air,h,local(h,h.b,0,.06,-pop*.20),.25+pop*.40,Math.PI/2,
    p.tier===3?prism[i]:p.secondary,heat*.8,22,phase,phase+Math.PI*.75);
  }
 }else if(contact.kind==='jaw-bite'){
  const shut=Math.exp(-ms/55),a=ms*.02;
  for(const s of [-1,1]){
   const c=local(h,h.b,s*(.1+shut*.45),.08,0);
   shard(air,h,c,world*.16,a*s,p.secondary,fade);
   const tip=project(h,local(h,h.b,s*.04,.04,-.08));
   streak(air,project(h,c),tip,p.core,2.4,heat);
  }
  // A metal bite and a traveling magnetic arc leave the real latch intact.
  ring(air,h,h.b,.27+pop*.45,Math.PI/2,p.secondary,heat*.7,25,ms*.018,ms*.018+Math.PI*1.4);
 }else if(contact.kind==='induction-rupture'){
  // Offset jagged field cuts discharge across the hull; no invented burn.
  for(let plane=0;plane<(p.tier===3?6:3);plane++){
   const a=plane*Math.PI/3+ms*.002,span=.5+pop*.95;
   const points=Array.from({length:8},(_,i)=>{
    const u=i/7*2-1,jag=Math.sin(i*2.4+plane+ms*.04)*.11;
    return project(h,local(h,h.b,Math.cos(a)*u*span-Math.sin(a)*jag,
     .04+plane*.035,Math.sin(a)*u*span+Math.cos(a)*jag));
   });
   air.beginPath();points.forEach((pt,i)=>point(air,pt,i===0));
   air.strokeStyle=rgba(p.tier===3?prism[plane%4]:p.core,heat*.9);air.lineWidth=plane%2?1.6:2.7;air.stroke();
   if(plane<3)shard(air,h,local(h,h.b,Math.cos(a)*pop*.7,.1+pop*.3,Math.sin(a)*pop*.7),world*.22,a+age*7,p.secondary,fade);
  }
 }else if(contact.kind==='fragmentation-burst'){
  // Asymmetric armor pops, followed by spinning fragments and gray vapor.
  for(let i=0;i<(contact.intermediate?2:4);i++){
   const a=seededUnit(e.seed,i+31)*TAU,r=pop*(.14+i*.18),c=local(h,h.b,Math.cos(a)*r,.06+pop*.12,Math.sin(a)*r*.5);
   pressureLobe(air,h,c,.43+pop*.36,true,heat*.85,i%2?p.secondary:color);
  }
 }
 // Crisp edges remain above the luminous body. Otherwise the bloom would
 // hide the material fracture and look like another soft glowing ellipse.
 strikeRays();
 // Ballistic metal chips and their floor shadows give the strike depth.
 const narrow=['armor-punch','drill-breach'].includes(contact.kind);
 particles(floor,air,h,ms,{count:contact.sparks,hot:true,speed:contact.intermediate?2.8:3.6,
  cone:narrow?Math.PI/2:null,spread:narrow?.8:1});
 if(ms<560)for(let i=0;i<(contact.intermediate?3:6);i++){
  const a=seededUnit(e.seed,i+550)*TAU,travel=.20+age*(3.5+i*.45),up=.12+age*(1.7+i*.2)-age*age*3.5;
  const c=local(h,h.b,Math.cos(a)*travel,Math.max(.02,up),Math.sin(a)*travel);
  const size=world*(.09+seededUnit(e.seed,i+570)*.085),alpha=fade*(1-ms/560);
  shard(air,h,c,size,a+age*(i%2?-12:15),p.tier===3?prism[i%4]:i%2?'#bccbd3':'#6c7b85',alpha);
 }
 if(contact.smoke&&ms>90&&contact.kind!=='plasma-bloom')for(let i=0;i<(contact.intermediate?2:4);i++){
  const a=i*2.399963,c=local(h,h.b,Math.cos(a)*age*.7,.10+age*.9,Math.sin(a)*age*.4);
  smoke(air,h,c,world*(.28+age*.30),fade*.52);
 }
 glow(floor,q,radius*1.25,p.glow,heat*.40,.38);
 air.restore();floor.restore();
}
function impact(floor,air,entry,ms,reduced,contactPose){
 const {profile:p}=entry;if(ms<0||ms>=p.impactMs)return;
 let e=entry;
 const t=ms/p.impactMs,flash=Math.exp(-ms/65),fade=(1-t)**2;
 let q=project(e,e.b);
 if(e.shot.defenseBlocked){
  // Shield contact only. No hole, debris from a hull, or hull reaction.
  ring(air,e,e.b,.34+t*.10,Math.PI/2,'#9bd9ff',fade);
  glow(air,q,24,'#9bd9ff',Math.exp(-ms/130)*.35);return;
 }
 if(reduced){glow(air,q,21,p.glow,fade*.5,.6);return;}
 const contact=weaponHullImpactProfile(p,e.shot);if(!contact)return;
 const pose=contactPose||weaponImpactHullFrame(p,e.shot,ms);
 const anchor=weaponHullContactPoint(e.to,pose);
 e={...e,to:anchor,b:boardPointToWorld(anchor,e.camera)};q=project(e,e.b);
 if(!contact.damaging){drawHullContact(floor,air,e,ms,contact);return;}
 if((e.shot.salvoCount||1)>1&&!p.salvoLast){
  // Each early round makes a sharp local contact. The last round resolves
  // the family-specific finish instead of nine identical full explosions.
  const thermal=p.kind==='thermal-reclaimer',narrow=['steel-rail','cascade-piercer'].includes(p.kind);
  glow(air,q,thermal?19:12,p.glow,Math.exp(-ms/70)*.65);
  particles(floor,air,e,ms,{count:thermal?7:6,hot:thermal||narrow,
   cone:narrow?Math.PI/2:null,spread:narrow?.7:1,speed:.5});
  if(thermal)for(let i=0;i<3;i++){
   const a=i*TAU/3;smoke(air,e,local(e,e.b,Math.cos(a)*t*.25,t*.5,Math.sin(a)*t*.25),
    .14+t*.19,fade*.7,true);
  }
  if(p.kind==='induction')for(let i=0;i<3;i++){
   const a=project(e,local(e,e.b,-.18,.03+i*.06,-.12+t*.18));
   const b=project(e,local(e,e.b,.18,.03+i*.06,.12-t*.18));
   streak(air,a,b,p.core,1.25,fade);
  }
  drawHullContact(floor,air,e,ms,contact);return;
 }
 if(p.kind==='gravity-maul'){
  const well=clamp01(1-ms/140);
  glow(floor,q,44,p.glow,flash*.55,.4);
  if(well>0){
   air.save();air.globalAlpha=well*.9;air.fillStyle='#10101b';air.beginPath();air.ellipse(q.x,q.y,7+well*9,5+well*5,0,0,TAU);air.fill();air.restore();
   for(let i=0;i<=p.tier;i++)ring(air,e,e.b,(.10+well*.27+i*.05),.2+i*.4,
    p.tier===3?prism[i]:p.glow,well*.8);
  }
  floorWave(floor,e,ms,{delay:55,radius:.9+p.tier*.15});
  if(p.tier>=2)floorWave(floor,e,ms,{delay:130,radius:1.05,alpha:.38});
  particles(floor,air,e,ms,{inward:true,hot:true,speed:.8});
  for(let i=0;i<e.style.smoke;i++){
   const a=i*2.399,r=.08+t*(.18+(i%4)*.12);
   smoke(air,e,local(e,e.b,Math.cos(a)*r,.02+t*.50,Math.sin(a)*r),.12+t*.26,fade*.35);
  }
 }else if(p.kind==='steel-rail'){
  const a=project(e,local(e,e.b,0,.02,.21)),b=project(e,local(e,e.b,0,.02,-.26));
  streak(air,a,b,'#18232b',4,fade);streak(air,a,b,p.core,1.15,Math.exp(-ms/220));
  glow(air,q,23,p.glow,flash*.7);
  particles(floor,air,e,ms,{cone:Math.PI/2,spread:.72,speed:1.25,hot:true,count:15+p.tier*3});
  for(const s of [-1,1]){
   const tip=project(e,local(e,e.b,s*(.1+t*.9),.04,-t*.40));
   streak(air,q,tip,p.secondary,1.15,Math.exp(-ms/180));
  }
 }else if(p.kind==='thermal-reclaimer'){
  const heat=e.thermal.ratio;
  glow(floor,q,46+heat*14,p.glow,Math.exp(-ms/350)*.8,.5);
  for(let i=0;i<3;i++){
   const a=i*TAU/3+t*1.8;
   const pos=local(e,e.b,Math.cos(a)*(.08+t*.42),t*.9,Math.sin(a)*(.08+t*.42));
   smoke(air,e,pos,.23+t*.38,fade*(.65+heat*.25),true);
   glow(air,project(e,pos),12+t*13,p.tier===3?prism[i]:p.glow,Math.exp(-ms/190)*.7);
   if(p.tier===3)ring(air,e,pos,.18+t*.2,.7+i*.45,prism[i],Math.exp(-ms/200)*.5);
  }
  particles(floor,air,e,ms,{hot:true,count:16,speed:.5});
  if((e.shot.salvoCount||1)>1){
   // A plasma capsule blooms upward in billowing lobes, distinct from the
   // Collassatore's ground-level kinetic explosion and shock ring.
   const rise=clamp01(ms/360),burn=Math.exp(-ms/210);
   for(let i=0;i<7;i++){
    const a=i*2.399,r=(.12+rise*.35)*(i%3+1)/3;
    const pos=local(e,e.b,Math.cos(a)*r,.08+rise*(.35+i%3*.18),Math.sin(a)*r);
    smoke(air,e,pos,.20+rise*.32,(1-t)*.65,true);
    glow(air,project(e,pos),10+rise*17,p.tier===3?prism[i%4]:'#ff9c36',burn*.75);
   }
   glow(air,q,26,p.core,Math.exp(-ms/45)*.9);
  }
  if(p.tier===3)for(let i=0;i<6;i++){
   const a=i*TAU/6,r=.12+Math.sin(Math.min(1,t*1.6)*Math.PI)*.4;
   const center=local(e,e.b,Math.cos(a)*r,.10+t*.45,Math.sin(a)*r);
   shard(air,e,center,.10*(1-t),a+t*2,prism[i%4],fade*.75);
  }
 }else if(p.kind==='magnetic-grapple'){
  // The latch snaps inward and sheds metal chips; no explosive fireball.
  const close=1-Math.exp(-ms/45);
  for(const s of [-1,1]){
   const a=project(e,local(e,e.b,s*(.10+.18*(1-close)),.03,.14));
   const b=project(e,local(e,e.b,s*.07,.06,-.10));
   streak(air,a,b,p.secondary,2.2,fade);
  }
  particles(floor,air,e,ms,{count:8+p.tier*2,speed:.4,hot:true});
  glow(air,q,16,p.glow,flash*.55);
  if(p.tier>=2)ring(air,e,e.b,.20,.2,p.secondary,Math.exp(-ms/210));
  if(p.tier===3)for(let i=0;i<4;i++){
   const a=i*TAU/4;shard(air,e,local(e,e.b,Math.cos(a)*.24,.10,Math.sin(a)*.24),.055,a,prism[i],fade);
  }
 }else if(p.kind==='induction'){
  // Three cutting field planes pass through each other; contact is not fire.
  for(let plane=0;plane<3;plane++){
   const u=clamp01(ms/(230+plane*65)),w=.43*(1-u)+.10,h=.03+plane*.10;
   const points=[[-w,-.28],[w,-.28],[w,.28],[-w,.28]].map(([x,z])=>project(e,local(e,e.b,x,h,z)));
   polygon(air,points,rgba(p.tier===3?prism[plane]:p.secondary,fade*.10),rgba(p.core,fade*.75),.7);
   const b=project(e,local(e,e.b,w,h,0)),a=project(e,local(e,e.b,-w,h,0));
   streak(air,a,b,p.tier===3?prism[plane]:p.core,1.5,fade);
  }
  particles(floor,air,e,ms,{count:14,speed:.55});glow(air,q,22,p.glow,flash*.55);
 }else if(p.kind==='cascade-piercer'){
  const a=project(e,local(e,e.b,0,.025,.12)),b=project(e,local(e,e.b,0,.025,-.25));
  streak(air,a,b,'#070d13',5.5,fade);streak(air,a,b,p.core,1.1,Math.exp(-ms/240));
  const residue=e.shot.cascadeTransfer?.65:1;
  particles(floor,air,e,ms,{cone:Math.PI/2,spread:.4,speed:1.45*residue,hot:true,count:18});
  for(let i=0;i<3;i++){
   const u=clamp01((ms-i*25)/280);
   if(ms>=i*25&&u<1)ring(air,e,local(e,e.b,0,.05,-u*.8),.10+u*.16,Math.PI/2,
    p.tier===3?prism[i]:p.secondary,(1-u)*.7);
  }
  glow(air,q,21,p.glow,flash*.7);
 }else if(p.kind==='wandering-shrapnel'){
  // A broad asymmetric fracture, unlike the narrow rail/cascade jet.
  particles(floor,air,e,ms,{cone:.9,spread:2.4,speed:.95,hot:true});
  glow(air,q,26,p.glow,flash*.7);
  for(let i=0;i<6;i++){
   const a=i*1.7,dist=.07+t*(.22+i*.025);
   smoke(air,e,local(e,e.b,Math.cos(a)*dist,t*.25,-.1-Math.sin(a)*dist),.10+t*.20,fade*.40);
  }
  if(p.tier>=2){
   const a=project(e,local(e,e.b,-.18,.02,.1)),b=project(e,local(e,e.b,.24,.02,-.1));
   streak(air,a,b,p.tier===3?prism[1]:p.secondary,1.2,Math.exp(-ms/220));
  }
 }
 drawHullContact(floor,air,e,ms,contact);
}
export function drawCinematicWeapon(floor,air,e,age,{reduced=false,contactPose=null}={}){
 const elapsed=age-e.start,p=e.profile;
 if(elapsed<0){if(!reduced)charge(floor,air,e,elapsed);return;}
 if((p.kind.startsWith('ionic-')||p.kind==='steel-rail')&&elapsed>=0){
  const ms=elapsed-p.flightMs;
  if(ms<0){if(!reduced&&p.kind.startsWith('ionic-'))electricFlight(air,e,elapsed,e.camera);return;}
  if(e.shot.defenseBlocked){impact(floor,air,e,ms,reduced,contactPose);return;}
  const pose=contactPose||{x:0,y:0,lift:0};const contact=weaponHullContactPoint(e.to,pose);
  if(!e.shot.fires)return;
  if(p.kind==='steel-rail')kineticImpact(air,contact,ms,{power:reduced?.45:1+p.tier*.08});
  else electricImpact(air,contact,p.kind,ms,p.tier);
  return;
 }
 if(elapsed>=p.flightMs){
  const end=weaponFlightFrame(e.from,e.to,1,e.camera,0,{shot:e.shot,kind:p.kind});
  e.axis.copy(end.direction);e.axis.y=0;e.axis.normalize();e.side.set(e.axis.z,0,-e.axis.x).normalize();
  e.flightScale=1;e.flightUp=null;
  impact(floor,air,e,elapsed-p.flightMs,reduced,contactPose);return;
 }
 if(reduced)return;
 const t=weaponTravelProgress(p.kind,elapsed/p.flightMs),pose=weaponFlightFrame(e.from,e.to,elapsed/p.flightMs,e.camera,0,{shot:e.shot,kind:p.kind}),nose=pose.nose;
 e.axis.copy(pose.direction);e.side.set(e.axis.z,0,-e.axis.x).normalize();
 e.flightScale=e.shot.visualScale||1;e.flightUp=new Vector3().crossVectors(e.axis,e.side).normalize();
 // A soft ground shadow separates a flying volume from the metal surface.
 const center=local(e,nose,0,0,.5),screen=project(e,center),fade=Math.min(1,t*18,(1-t)*22);
 floor.save();air.save();floor.globalAlpha=fade;air.globalAlpha=fade;
 floor.fillStyle='#04081044';floor.beginPath();floor.ellipse(screen.x,screen.y+6,7,3.1,0,0,TAU);floor.fill();
 if(p.kind==='gravity-maul')gravityFlight(floor,air,e,nose,t,elapsed);
 else if(p.kind==='steel-rail')railFlight(floor,air,e,nose,t,elapsed);
 else if(p.kind==='thermal-reclaimer')thermalFlight(floor,air,e,nose,t,elapsed);
 else if(p.kind==='induction')inductionFlight(floor,air,e,nose,t,elapsed);
 else if(p.kind==='magnetic-grapple'){
  // Travelling tension pulses track the real chain, not an unrelated beam.
  const q=project(e,local(e,nose,0,0,.7));glow(floor,q,15,p.glow,.28);
  if(p.tier>=2)ring(floor,e,local(e,nose,0,0,.5),.25,Math.PI/2,p.secondary,.6);
 }else precisionFlight(floor,air,e,nose,t,elapsed);
 floor.restore();air.restore();
}
// Extra depth during the real pull only. The existing collision renderer
// remains the sole owner of the contact, explosion and two moving hulls.
export function drawCollisionConvergence(floor,air,e,contact,elapsed,reduced){
 if(reduced||elapsed<0||elapsed>=e.profile.flightMs)return;
 const center=boardPointToWorld(contact,e.camera),t=clamp01(elapsed/e.profile.flightMs);
 const power=clamp01((t-.52)/.48);
 for(let i=0;i<18;i++){
  const a=i*2.399+elapsed*.001,r=(.3+(1-power)*.9)*( .6+seededUnit(e.seed,i)*.6);
  const q=local(e,center,Math.cos(a)*r,.10+power*.10,Math.sin(a)*r);
  const tail=local(e,center,Math.cos(a)*r*1.18,.10,Math.sin(a)*r*1.18);
  streak(air,project(e,tail),project(e,q),e.style.prism?prism[i%4]:e.profile.secondary,.8,.3+power*.6);
 }
 glow(floor,contact,35+power*25,e.profile.glow,.2+power*.35,.35);
 if(e.style.prism)for(let i=0;i<3;i++)ring(floor,e,center,.35+(1-power)*.7,i*.6,prism[i],power*.5);
}
export function drawDefenseDismantle(ctx,position,profile,elapsed,camera,{reduced=false}={}){
 if(elapsed<0||elapsed>=1000)return;
 const t=elapsed/1000,fade=(1-t)**2,center=boardPointToWorld(position,camera);
 const axis=new Vector3(0,0,1),side=new Vector3(1,0,0);
 const e={camera,axis,side,profile,b:center,style:{prism:profile.tier===3,fragments:12},seed:1733};
 if(reduced){glow(ctx,position,24,profile.secondary,fade*.45);return;}
 // Three armor leaves peel apart at different heights, with lit thickness.
 for(let i=0;i<3;i++){
  const angle=(i-1)*1.1,spread=(1-Math.exp(-elapsed/80))*.55;
  const c=local(e,center,Math.sin(angle)*spread,.04+Math.sin(t*Math.PI)*(.26+i*.10),Math.cos(angle)*spread*.35);
  const rotation=(i-1)*t*1.5,pts=[[-.10,-.23],[.10,-.23],[.10,.23],[-.10,.23]];
  const face=pts.map(([x,z])=>project(e,local(e,c,x*Math.cos(rotation),x*Math.sin(rotation),z)));
  ctx.save();ctx.globalAlpha=fade;
  polygon(ctx,face,profile.tier===3?prism[i]:'#748b9d',profile.core,.6);
  const a=project(e,local(e,c,-.08*Math.cos(rotation),-.08*Math.sin(rotation)+.01,0));
  const b=project(e,local(e,c,.08*Math.cos(rotation),.08*Math.sin(rotation)+.01,0));
  streak(ctx,a,b,profile.glow,1.5,.9);ctx.restore();
 }
 glow(ctx,position,27,profile.glow,Math.exp(-elapsed/110)*.45,.5);
 for(let i=0;i<10;i++){
  const a=i*2.399,r=.08+t*(.25+seededUnit(1733,i)*.3);
  shard(ctx,e,local(e,center,Math.cos(a)*r,.03+t*.2,Math.sin(a)*r),.032,a+t*4,
   profile.tier===3?prism[i%4]:profile.secondary,fade);
 }
}
