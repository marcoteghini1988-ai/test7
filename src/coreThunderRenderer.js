// Revisione scenica 2: un solo nodo, un solo contatto; nessun effetto HP.
import {Vector3} from 'three';
import {createProjectileCamera,boardPointToWorld,worldPointToBoard} from './maglioProjectile3D.js';
function stroke(ctx,pts,color,width=1,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore();}
function glow(ctx,p,r,color,alpha=1){if(r<=0||alpha<=0)return;ctx.save();ctx.globalAlpha*=alpha;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);g.addColorStop(0,color);g.addColorStop(.14,color+'bb');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);ctx.restore();}

const camera=createProjectileCamera(),TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));
const tier=f=>['Rara','Epica','Leggendaria'].indexOf(f.rarity);
export const CORE_SCENIC_REVISION=2;
export function coreScenicPose(f,elapsed,from,to,flightMs){
 const t=clamp(elapsed/flightMs),a=boardPointToWorld(from,camera),b=boardPointToWorld(to,camera);
 const axis=b.clone().sub(a).normalize(),side=new Vector3(axis.z,0,-axis.x).normalize();
 const up=axis.clone().cross(side).normalize(),point=a.clone().lerp(b,t);
 point.y+=(.18+f.currentStage*.025)*Math.sin(Math.PI*t);
 return {t,axis,side,up,point,compression:clamp((t-.79)/.21),radius:.11+f.currentStage*.034+tier(f)*.009};
}
function corona(ctx,center,pose,radius,phase,color,alpha=1,tilt=.65){
 const normal=pose.axis.clone().multiplyScalar(Math.cos(tilt))
  .addScaledVector(pose.side,Math.sin(tilt)*Math.cos(phase))
  .addScaledVector(pose.up,Math.sin(tilt)*Math.sin(phase)).normalize();
 const u=pose.up.clone().cross(normal).normalize(),v=normal.clone().cross(u).normalize();
 const pts=[];
 for(let i=0;i<=64;i++){
  const a=i/64*TAU,r=radius*(1+.025*Math.sin(i*3.4+phase*4));
  pts.push(worldPointToBoard(center.clone().addScaledVector(u,Math.cos(a)*r).addScaledVector(v,Math.sin(a)*r),camera));
 }
 stroke(ctx,pts,color,7,alpha*.13);stroke(ctx,pts,color,2.2,alpha*.72);stroke(ctx,pts,'#eafaff',.65,alpha*.95);
 // Segmenti luminosi in rotazione: una corona non è una circonferenza statica.
 const first=((Math.floor(phase*11)%64)+64)%64,arc=[];
 for(let i=0;i<13;i++)arc.push(pts[(first+i)%64]);
 stroke(ctx,arc,'#c4edff',3,alpha*.90);stroke(ctx,arc,'#ffffff',1,alpha);
 const spark=arc.at(-1);glow(ctx,spark,4,color,alpha*.65);
}
export function drawScenicFlight(ctx,f,elapsed,from,to,flightMs){
 if(elapsed<0||elapsed>flightMs)return;
 const pose=coreScenicPose(f,elapsed,from,to,flightMs),{axis,side,up,point,t,compression}=pose;
 const level=f.currentStage,r=pose.radius,prism=tier(f)===2,screen=worldPointToBoard(point,camera);
 const floor=worldPointToBoard(new Vector3(point.x,0,point.z),camera);
 ctx.save();ctx.globalCompositeOperation='lighter';
 ctx.save();ctx.translate(floor.x,floor.y+10);ctx.scale(1,.35);glow(ctx,{x:0,y:0},23+level*7,'#269cfc',.12+level*.035);ctx.restore();
 glow(ctx,screen,17+level*4,'#2584f9',.22);
 // Il volume ha filamenti longitudinali e una pelle di scariche pulsanti.
 for(let k=0;k<10+level*3+tier(f)*2;k++){
  const pts=[];
  for(let j=0;j<=18;j++){
   const u=j/18,a=u*TAU*1.25+k*2.399+elapsed*.009;
   const width=r*.72*Math.sin(Math.PI*u)*(1+.17*Math.sin(j*2.6+k));
   const q=point.clone().addScaledVector(axis,(u-.5)*r*1.6)
    .addScaledVector(side,Math.cos(a)*width).addScaledVector(up,Math.sin(a)*width);
   pts.push(worldPointToBoard(q,camera));
  }
  stroke(ctx,pts,k%3?'#68cbff':'#efffff',k%3?1:1.5,.80);
 }
 const collapse=1-compression*.70;
 for(let i=0;i<level;i++){
  const center=point.clone().addScaledVector(axis,(i-(level-1)/2)*r*.60*(1-compression));
  corona(ctx,center,pose,r*(1.9+i*.27)*collapse,
   elapsed*(.004+i*.0017)*(i%2?-1:1)+i*1.2,
   prism&&i%2?'#d1b7ff':'#68cfff',.85,.45+i*.22+Math.sin(elapsed*.003)*.12);
 }
 // Una scia a imbuto si sfilaccia dietro il nodo; non sono altri proiettili.
 for(let ribbon=0;ribbon<3+level;ribbon++){
  const pts=[];
  for(let i=0;i<=27;i++){
   const u=i/27,angle=ribbon*TAU/(3+level)+elapsed*.009-u*3.7;
   const spread=r*(.24+u*.9)*(1-u*.28);
   const q=point.clone().addScaledVector(axis,-u*(.65+level*.16))
    .addScaledVector(side,Math.cos(angle)*spread).addScaledVector(up,Math.sin(angle)*spread*.7);
   pts.push(worldPointToBoard(q,camera));
  }
  stroke(ctx,pts,prism&&ribbon===1?'#bba7ff':'#52b8ff',3,.13);
  stroke(ctx,pts,ribbon%2?'#8cdcff':'#d2f4ff',.8,.55);
 }
 for(let i=0;i<8+level*3;i++){
  const phase=((elapsed*.0015+i*.117)%1),q=point.clone().addScaledVector(axis,-phase*(.7+level*.14));
  q.addScaledVector(side,Math.sin(i*2.399+elapsed*.004)*r*(.5+phase));
  q.addScaledVector(up,Math.cos(i*2.399+elapsed*.004)*r*.8);
  const p=worldPointToBoard(q,camera);glow(ctx,p,1.6,'#9ee4ff',(1-phase)*.6);
 }
 // La compressione precede il contatto, senza una seconda detonazione.
 glow(ctx,screen,7+level*2+compression*4,'#8cddff',.65);
 glow(ctx,screen,2.6+level*.6+compression*2.4,'#ffffff',.92);
 ctx.restore();
}
export function drawScenicContact(ctx,f,ms,p,impactMs){
 if(ms<0||ms>impactMs)return;
 const level=f.currentStage,prism=tier(f)===2,u=ms/impactMs,fade=(1-u)**2;
 if(f.blocked){
  // L'energia si distende sulla protezione, senza rinculo o ferita dello scafo.
  ctx.save();ctx.globalCompositeOperation='lighter';
  glow(ctx,p,36,'#3ba8ef',Math.exp(-ms/180)*.5);
  for(let ring=0;ring<3;ring++){
   ctx.globalAlpha=fade*(.65-ring*.13);ctx.strokeStyle=ring?'#8bdfff':'#eaffff';ctx.lineWidth=ring?1:2;
   ctx.beginPath();ctx.ellipse(p.x,p.y,28+ring*5,18+ring*4,Math.sin(ms*.004)*.2,0,TAU);ctx.stroke();
  }
  for(let i=0;i<14;i++){
   const a=i*TAU/14+ms*.0006,pts=[];
   for(let j=0;j<10;j++){const b=a+(j-5)*.055;
    pts.push({x:p.x+Math.cos(b)*(29+Math.sin(j*2+i)*2),y:p.y+Math.sin(b)*20});}
   stroke(ctx,pts,'#bceeff',.8,fade*.8);
  }
  ctx.restore();return;
 }
 const opening=clamp(ms/100),burst=Math.exp(-Math.max(0,ms-60)/160)*Math.min(1,.3+ms/30);
 // Implosione al vero contatto, poi un unico sboccio elettrico.
 ctx.save();ctx.globalCompositeOperation='lighter';
 if(ms<120)for(let i=0;i<level+1;i++){
  const radius=Math.max(2,(26+i*9)*(1-ms/120));
  ctx.globalAlpha=(1-ms/120)*.9;ctx.strokeStyle=i%2?'#81d7ff':'#e9fbff';ctx.lineWidth=1.3;
  ctx.beginPath();ctx.ellipse(p.x,p.y,radius,radius*.55,i*.6,0,TAU);ctx.stroke();
 }
 ctx.globalAlpha=1;
 glow(ctx,p,36+level*11,'#378cfa',burst*.8);
 // Lobi sovrapposti danno corpo al plasma senza nascondere tutta la nave.
 for(let i=0;i<5+level;i++){
  const a=i*2.399,spread=(7+level*2)*opening,q={x:p.x+Math.cos(a)*spread,y:p.y+Math.sin(a)*spread*.7};
  glow(ctx,q,11+level*3.3,'#8fd7ff',burst*.72);
 }
 glow(ctx,p,9+level*2.3,'#ffffff',burst*.95);
 const petals=5+level,turn=ms*.0013;
 for(let i=0;i<petals;i++){
  const points=[],a=i*TAU/petals+turn,reach=(26+level*12)*Math.sin(Math.min(1,ms/390)*Math.PI*.65);
  for(let j=0;j<=26;j++){
   const t=j/26,r=Math.sin(Math.PI*t)*reach,angle=a+(t-.5)*.7+Math.sin(j*2.8+i+ms*.02)*.035;
   points.push({x:p.x+Math.cos(angle)*r,y:p.y+Math.sin(angle)*r*.65-t*3});
  }
  stroke(ctx,points,prism&&i%3===0?'#cbb0ff':'#5ebfff',7,fade*.20);
  stroke(ctx,points,'#b5edff',1.8,fade*.95);stroke(ctx,points,'#ffffff',.6,fade*.8);
 }
 ctx.restore();
 // Un fronte di pressione luminoso aderente alla prospettiva del piano.
 if(ms>55&&ms<860){
  const radius=9+Math.sqrt(clamp((ms-55)/805))*(34+level*8);
  ctx.save();ctx.globalAlpha=(1-ms/860)*.82;ctx.strokeStyle='#82dfff';ctx.lineWidth=2+level*.3;
  ctx.beginPath();ctx.ellipse(p.x,p.y+4,radius,radius*.40,0,0,TAU);ctx.stroke();
  ctx.globalAlpha*=.7;ctx.strokeStyle='#ecfdff';ctx.lineWidth=.8;
  ctx.beginPath();ctx.ellipse(p.x,p.y+4,radius-2,(radius-2)*.40,0,0,TAU);ctx.stroke();ctx.restore();
 }
 // Spruzzi e filamenti appartengono alla stessa detonazione, senza nuovi HP.
 for(let i=0;i<20+level*6;i++){
  const a=i*2.399,v=(42+(i%7)*13)*(.75+level*.15),age=ms/1000;
  const q={x:p.x+Math.cos(a)*age*v,y:p.y+Math.sin(a)*age*v*.62-age*14};
  const back={x:q.x-Math.cos(a)*(4+level)*fade,y:q.y-Math.sin(a)*5*fade};
  stroke(ctx,[back,q],i%3?'#91dbff':'#f2ffff',i%5?.85:1.4,fade);
  if(i%4===0)glow(ctx,q,2.2,'#8fdcff',fade*.8);
 }
}
export function drawScenicPreparation(ctx,f,ms,origin,chargeMs){
 if(ms<0||ms>chargeMs)return;
 const phase=ms/chargeMs,p={x:origin.x,y:f.who==='A'?695:145};
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(p.x,p.y);ctx.scale(1,.35);
 glow(ctx,{x:0,y:0},24+phase*18,'#419dff',Math.sin(phase*Math.PI)*(.16+f.currentStage*.04));ctx.restore();
}
