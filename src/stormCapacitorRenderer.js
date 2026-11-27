// One connected volumetric thundercloud; electric branches are not extra hits.
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));
export function stormLine(ctx,points,color,width=1,alpha=1){
 ctx.save();ctx.globalAlpha*=Math.max(0,alpha);ctx.lineWidth=width;ctx.strokeStyle=color;
 ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
 points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore();
}
export function stormGlow(ctx,p,r,color,alpha=1){
 if(r<=0||alpha<=0)return;ctx.save();ctx.globalAlpha*=alpha;
 const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);
 g.addColorStop(0,color);g.addColorStop(.25,color+'99');g.addColorStop(1,color+'00');
 ctx.fillStyle=g;ctx.fillRect(p.x-r,p.y-r,2*r,2*r);ctx.restore();
}
export function stormFlight(hit,age,to){
 const t=clamp(age/hit.flightMs),curve=Math.sin(t*Math.PI)*(hit.who==='A'?1:-1)*13;
 const point={x:hit.originX+(to.x-hit.originX)*t+curve,y:hit.originY+(to.y-hit.originY)*t};
 return {t,point,scale:.50+.85*clamp(point.y/800),angle:(hit.who==='A'?-1:1)*(.2+t*1.8)};
}
function cloud(ctx,p,r,angle,age,legendary,{flatten=1,fade=1}={}){
 // Fractal billows use many small, shaded volume lobes rather than smooth balls.
 const lobes=Array.from({length:96},(_,i)=>{
  const parent=Math.floor(i/6),a=parent*2.399+angle,b=i*1.731;
  return {i,x:Math.sin(a)*r*(.25+(parent%4)*.055)+Math.sin(b)*r*.13,
   y:Math.cos(a)*r*(.22+(parent%3)*.05)+Math.cos(b*1.4)*r*.10,
   z:Math.sin(parent*1.82+angle*.7)+Math.sin(b)*.24,
   size:r*(i%6===0?.30:.145+(i%5)*.025)};
 }).sort((a,b)=>a.z-b.z);
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,flatten);ctx.globalAlpha*=fade;
 for(const l of lobes){
  const x=l.x+l.z*r*.11,y=l.y-l.z*r*.16,light=(l.z+1)/2;
  const g=ctx.createRadialGradient(x-l.size*.26,y-l.size*.31,l.size*.04,x,y,l.size);
  g.addColorStop(0,light>.55?'#5284ba':'#386799');g.addColorStop(.36,'#2b5487');
  g.addColorStop(.72,'#19395e');g.addColorStop(.91,'#102541bb');g.addColorStop(1,'#08152b00');
  ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,l.size,l.size*.85,0,0,TAU);ctx.fill();
 }
 const currents=legendary?3:1;
 const bolt=(a,b,seed,depth=3)=>{
  if(!depth)return [a,b];const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
  const off=Math.sin(seed*19.73+Math.floor(age/110)*1.83)*len*.19,
   mid={x:(a.x+b.x)/2-dy/len*off,y:(a.y+b.y)/2+dx/len*off};
  return [...bolt(a,mid,seed+1.3,depth-1).slice(0,-1),...bolt(mid,b,seed+4.1,depth-1)];
 };
 for(let k=0;k<currents;k++){
  const ends=[[{x:-r*.66,y:r*.30},{x:r*.57,y:-r*.44}],
   [{x:-r*.63,y:-r*.19},{x:r*.52,y:r*.31}],
   [{x:-r*.21,y:r*.60},{x:r*.24,y:-r*.55}]][k];
  const points=bolt(...ends,k*8+1);
  const color=k===1?'#c8b4ff':k===2?'#9be9ff':'#a4eaff';
  stormLine(ctx,points,'#2786ff',5,.22);stormLine(ctx,points,color,1.15,.95);
  for(let i=2;i<points.length-1;i+=3){const a=points[i],end={x:a.x+r*.18,y:a.y+((i+k)%2?1:-1)*r*.26};
   stormLine(ctx,bolt(a,end,i+k+3,2),color,.72,.8);}
 }
 stormGlow(ctx,{x:0,y:0},r*.62,'#1c92ff',.12);ctx.restore();
}
export function drawStormCloud(ctx,hit,age,to,{reduced=false}={}){
 if(age<0||age>hit.flightMs)return;const v=stormFlight(hit,age,to),r=(hit.rarity==='Leggendaria'?38:34)*v.scale;
 if(reduced){stormGlow(ctx,v.point,r,'#6cbaff',.22);return;}
 const back={x:v.point.x+(hit.originX-to.x)*.14,y:v.point.y+(hit.originY-to.y)*.14};
 const wake=Array.from({length:12},(_,i)=>({x:back.x+(v.point.x-back.x)*i/11+Math.sin(i*2.2+age*.014)*2,y:back.y+(v.point.y-back.y)*i/11}));
 stormLine(ctx,wake,'#2676ed',6,.12);stormLine(ctx,wake,'#9bdfff',.75,.6);
 cloud(ctx,v.point,r,v.angle,age,hit.rarity==='Leggendaria');
}
export function drawStormContact(ctx,hit,age,p,{reduced=false}={}){
 if(age<0||age>1050)return;const f=Math.exp(-age/250),legendary=hit.rarity==='Leggendaria';
 if(hit.blocked){
  cloud(ctx,p,32,.8,age,legendary,{flatten:.35,fade:f*.75});
  ctx.save();ctx.strokeStyle='#a8e6ff';ctx.lineWidth=2;ctx.globalAlpha=f;
  ctx.beginPath();ctx.ellipse(p.x,p.y,32,20,0,0,TAU);ctx.stroke();ctx.restore();
  stormGlow(ctx,p,26,'#61c5ff',f*.5);return;
 }
 if(hit.actualDamage<=0){stormGlow(ctx,p,8,'#85caff',f*.22);return;}
 cloud(ctx,p,35+clamp(age/100)*7,.8,age,legendary,{flatten:Math.max(.30,1-age/210),fade:f*.9});
 stormGlow(ctx,p,legendary?43:36,'#2678ef',f*.72);stormGlow(ctx,p,12,'#effaff',f);
 const count=legendary?15:11;
 for(let i=0;i<count;i++){
  const a=i*2.399,len=22+(i%4)*6,q={x:p.x+Math.cos(a)*len,y:p.y+Math.sin(a)*len*.48};
  const mid={x:p.x+(q.x-p.x)*.5+Math.sin(age*.02+i)*3,y:p.y+(q.y-p.y)*.6};
  stormLine(ctx,[p,{x:mid.x-2,y:mid.y+3},mid,q],legendary&&i%3===0?'#d1bcff':'#a3e4ff',1.25,f);
  if(!reduced){const d=age*.13*((i%4+3)/7),s={x:q.x+Math.cos(a)*d,y:q.y+Math.sin(a)*d*.55};
   stormLine(ctx,[s,{x:s.x+Math.cos(a)*3,y:s.y+Math.sin(a)*2}],'#dcf7ff',.9,f);}
 }
}
export function drawStormContributor(ctx,p,age,{support=false}={}){
 if(age<0||age>650)return;const fade=Math.sin(age/650*Math.PI);
 stormGlow(ctx,p,support?23:30,support?'#71cfff':'#ffd762',fade*.4);
 ctx.save();ctx.strokeStyle=support?'#a1e5ff':'#ffe6a1';ctx.lineWidth=1.4;ctx.globalAlpha=fade;
 ctx.beginPath();ctx.ellipse(p.x,p.y,support?22:21,support?11:30,0,0,TAU);ctx.stroke();ctx.restore();
}
