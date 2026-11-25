import {boardPointToWorld,worldPointToBoard} from './maglioProjectile3D.js';

export function combatTargetElement(root,shot){
 const fleet=root.querySelector(`[data-fleet-side="${shot.who==='A'?'B':'A'}"]`);
 if(shot.targetKind==='part')return fleet?.querySelector('.official-mother');
 return [...(fleet?.querySelectorAll('[data-combat-id]')||[])].find(el=>
  el.dataset.combatId===shot.targetId&&el.dataset.combatKind===shot.targetKind);
}
export function boardHullPoint(el,board){
 const hull=el.querySelector('.f3d-escort-hull')||el.querySelector('.f3d-craft-hover')||el;
 const rect=hull.getBoundingClientRect();
 return {x:(rect.left+rect.width/2-board.left)*450/board.width,
  y:(rect.top+rect.height/2-board.top)*800/board.height,
  radius:rect.width*450/board.width*(el.matches('.official-mother')?.26:.29)};
}
export function createEffectCanvas(element){
 const canvas=document.createElement('canvas');canvas.width=900;canvas.height=1600;
 const ctx=canvas.getContext('2d');ctx.scale(2,2);element.append(canvas);return {canvas,ctx};
}
// Veri volumi della catena proiettati dalla camera del tavolo. Le maglie
// alternate conservano spessore e orientamento, con una lieve catenaria.
export function drawMagneticChain(ctx,from,to,profile,camera,age=0,tension=0,opacity=1){
 const a=boardPointToWorld(from,camera),b=boardPointToWorld(to,camera);
 const distance=Math.hypot(to.x-from.x,to.y-from.y),count=Math.max(3,Math.ceil(distance/6));
 const axis=b.clone().sub(a).normalize(),side={x:axis.z,z:-axis.x};
 const points=[];
 for(let i=0;i<=count;i++){
  const u=i/count,p=a.clone().lerp(b,u),wave=Math.sin(u*Math.PI)*
   Math.sin(u*Math.PI*5-age*.014)*.048*(1-tension);
  p.y-=Math.sin(u*Math.PI)*.24*(1-tension);p.y+=wave*.45;
  p.x+=side.x*wave;p.z+=side.z*wave;
  points.push(worldPointToBoard(p,camera));
 }
 ctx.save();ctx.globalAlpha=opacity;
 ctx.lineCap='round';ctx.lineJoin='round';
 ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
 ctx.strokeStyle='#101820';ctx.lineWidth=4;ctx.stroke();
 for(let i=1;i<points.length;i++){
  const p=points[i],q=points[i-1],depth=.60+Math.max(0,Math.min(1,p.y/800))*.55;
  ctx.save();ctx.translate((p.x+q.x)/2,(p.y+q.y)/2);ctx.rotate(Math.atan2(p.y-q.y,p.x-q.x));
  ctx.beginPath();ctx.ellipse(0,0,3.15*depth,(i%2?1.7:.65)*depth,0,0,Math.PI*2);
  ctx.strokeStyle=profile.tier>=2&&i%4===0?profile.secondary:'#d6a367';
  ctx.lineWidth=1.15*depth;ctx.stroke();
  if(profile.tier===3&&i%11===0){
   ctx.fillStyle=['#b9c9ff','#bdf4ff','#e8cbff'][i%3];
   ctx.beginPath();ctx.moveTo(0,-2.8);ctx.lineTo(2,0);ctx.lineTo(0,2.8);ctx.lineTo(-2,0);ctx.closePath();ctx.fill();
  }
  ctx.restore();
 }
 if(profile.tier>=2){
  const p=points[Math.floor(((age/1800)%1)*count)];
  ctx.fillStyle=profile.core;ctx.shadowColor=profile.glow;ctx.shadowBlur=5;
  ctx.beginPath();ctx.arc(p.x,p.y,1.7,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
export function drawLatch(ctx,to,profile,progress=1,opacity=1){
 ctx.save();ctx.translate(to.x,to.y);ctx.globalAlpha=opacity;
 ctx.strokeStyle=profile.secondary;ctx.lineWidth=2;
 const gap=4+(1-progress)*9;
 for(const s of [-1,1]){
  ctx.beginPath();ctx.moveTo(s*gap,-8);ctx.lineTo(s*(gap+3),0);ctx.lineTo(s*gap,8);ctx.lineTo(s*(gap-3),8);
  ctx.stroke();
 }
 if(profile.tier>=2){ctx.strokeStyle=profile.core;ctx.lineWidth=1;
  ctx.beginPath();ctx.ellipse(0,0,11,7,0,0,Math.PI*2);ctx.stroke();}
 if(profile.tier===3)for(let i=0;i<4;i++){
  const a=i*Math.PI/2;ctx.fillStyle=i%2?'#cff6ff':'#dec9ff';
  ctx.beginPath();ctx.moveTo(Math.cos(a)*13,Math.sin(a)*10-2);
  ctx.lineTo(Math.cos(a)*13+2,Math.sin(a)*10);ctx.lineTo(Math.cos(a)*13,Math.sin(a)*10+2);
  ctx.lineTo(Math.cos(a)*13-2,Math.sin(a)*10);ctx.closePath();ctx.fill();
 }
 ctx.restore();
}
export function drawMetalContact(ctx,p,profile,elapsed,duration=profile.impactMs){
 if(elapsed<0||elapsed>duration)return;
 const t=elapsed/duration,fade=1-t;
 ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=fade;
 const glow=ctx.createRadialGradient(0,0,0,0,0,38);
 glow.addColorStop(0,profile.core);glow.addColorStop(.25,profile.glow+'aa');glow.addColorStop(1,profile.glow+'00');
 ctx.fillStyle=glow;ctx.fillRect(-40,-30,80,60);
 for(let i=0;i<10+profile.tier*2;i++){
  const a=i*2.399,r=8+t*(23+(i%4)*5);
  ctx.beginPath();ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r*.65);
  ctx.lineTo(Math.cos(a)*(r+6*(1-t)),Math.sin(a)*(r+6)*.65);
  ctx.strokeStyle=i%3?profile.secondary:profile.core;ctx.lineWidth=1.3;ctx.stroke();
 }
 ctx.restore();
}
