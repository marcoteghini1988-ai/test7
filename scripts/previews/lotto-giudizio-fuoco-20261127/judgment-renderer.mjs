// Three electrically jagged hoops in distinct 3D planes, one compact nucleus.
// Projection is depth sorted. Rings align on approach; they are never hits.
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));
const mix=(a,b,k)=>a+(b-a)*k;
export function judgmentLine(ctx,points,color,width=1,alpha=1){
 ctx.save();ctx.globalAlpha*=Math.max(0,alpha);ctx.lineWidth=width;ctx.lineJoin=ctx.lineCap='round';ctx.strokeStyle=color;ctx.beginPath();
 points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore();
}
export function judgmentGlow(ctx,p,r,color,alpha=1){
 if(r<=0||alpha<=0)return;ctx.save();ctx.globalAlpha*=alpha;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);
 g.addColorStop(0,color);g.addColorStop(.25,color+'88');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(p.x-r,p.y-r,2*r,2*r);ctx.restore();
}
export function judgmentFlight(hit,age,to){
 const t=clamp(age/hit.flightMs),k=t*t*(3-2*t);
 return {t,point:{x:mix(hit.originX,to.x,k),y:mix(hit.originY,to.y,k)},scale:.66+.65*clamp(mix(hit.originY,to.y,k)/800)};
}
export function judgmentOrbitSegments(p,r,ms,alignment=0){
 const segments=[];
 for(let ring=0;ring<3;ring++){
  const speed=[.0013,-.00175,.00215][ring],theta=ms*speed+ring*2.2,
   tilt=mix([.65,1.19,.90][ring],1.18,alignment),rot=mix(theta,Math.PI/2,alignment),radius=r*(.77+ring*.14);
  const point=n=>{
   const a=n/96*TAU,jitter=1+.025*Math.sin(n*7.19+Math.floor(ms/65)*3.17+ring),x=Math.cos(a)*radius*jitter,
    y=Math.sin(a)*radius*Math.cos(tilt)*jitter,z=Math.sin(a)*radius*Math.sin(tilt);
   return {x:p.x+x*Math.cos(rot)-y*Math.sin(rot),y:p.y+x*Math.sin(rot)+y*Math.cos(rot),z};
  };
  for(let n=0;n<96;n++){const a=point(n),b=point(n+1);segments.push({a,b,z:(a.z+b.z)/2,ring});}
 }
 return segments.sort((a,b)=>a.z-b.z);
}
function nucleus(ctx,p,r,ms,fade=1){
 judgmentGlow(ctx,p,r*2.7,'#248fff',fade*.25);judgmentGlow(ctx,p,r*1.05,'#cdf6ff',fade*.85);
 ctx.save();ctx.globalAlpha*=fade;const g=ctx.createRadialGradient(p.x-r*.23,p.y-r*.25,0,p.x,p.y,r);
 g.addColorStop(0,'#ffffff');g.addColorStop(.28,'#f3fcff');g.addColorStop(.63,'#7dccff');g.addColorStop(1,'#2165c4');
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fill();ctx.restore();
 for(let i=0;i<5;i++){const a=ms*.004+i*2.399;judgmentLine(ctx,[{x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r},
  {x:p.x+Math.cos(a+.2)*r*1.6,y:p.y+Math.sin(a+.2)*r*1.6},{x:p.x+Math.cos(a)*r*2.4,y:p.y+Math.sin(a)*r*2.4}],i%2?'#d7c7ff':'#b2eaff',.7,fade*.7);}
}
function rings(ctx,p,r,ms,align,fade=1){
 const seg=judgmentOrbitSegments(p,r,ms,align),layer=front=>{
  for(const s of seg.filter(s=>(s.z>=0)===front)){const color=['#a9eaff','#d6c8ff','#a7d4ff'][s.ring],alpha=(front?.95:.4)*fade;
   judgmentLine(ctx,[s.a,s.b],'#1c70f8',4.5,alpha*.2);judgmentLine(ctx,[s.a,s.b],color,front?1.6:.8,alpha);}
 };
 judgmentGlow(ctx,p,r*1.55,'#397cff',.09*fade);layer(false);nucleus(ctx,p,r*.19,ms,fade);layer(true);
}
export function drawJudgmentFlight(ctx,hit,age,to,{reduced=false}={}){
 if(age<0||age>hit.flightMs)return;const v=judgmentFlight(hit,age,to),align=clamp((v.t-.82)/.18),r=(40-15*align)*v.scale;
 if(reduced){judgmentGlow(ctx,v.point,r*.7,'#83c7ff',.3);return;}
 // The fading ion trail is continuous decoration, not an independent bolt.
 const norm=Math.hypot(to.x-hit.originX,to.y-hit.originY)||1,dx=(to.x-hit.originX)/norm,dy=(to.y-hit.originY)/norm;
 const points=Array.from({length:14},(_,i)=>({x:v.point.x-dx*i*4+dy*Math.sin(i*1.8+age*.01)*1.1,y:v.point.y-dy*i*4-dx*Math.sin(i*1.8+age*.01)*1.1}));
 judgmentLine(ctx,points,'#3196ff',2.2,.22);rings(ctx,v.point,r,age,align);
}
export function drawJudgmentContact(ctx,hit,age,p,{reduced=false}={}){
 if(age<0||age>1000)return;const fade=Math.exp(-age/210);
 if(hit.blocked){
  ctx.save();ctx.globalAlpha*=fade;ctx.strokeStyle='#b1e7ff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,35,24,0,0,TAU);ctx.stroke();ctx.restore();
  for(let i=0;i<9;i++){const a=i/9*TAU,d=age*.055;judgmentLine(ctx,[{x:p.x+Math.cos(a)*22,y:p.y+Math.sin(a)*16},{x:p.x+Math.cos(a+.12)*(30+d),y:p.y+Math.sin(a+.12)*(20+d*.7)}],'#b5dbff',1.1,fade*.8);}
  judgmentGlow(ctx,p,31,'#5b9cff',fade*.4);return;
 }
 if(hit.actualDamage<=0){judgmentGlow(ctx,p,9,'#8cbdff',fade*.2);return;}
 const collapse=clamp(age/150);if(age<220)rings(ctx,p,25*(1-collapse)+2,age,1,(1-collapse)*.9);
 judgmentGlow(ctx,p,reduced?25:54,'#5a8eff',fade*.65);judgmentGlow(ctx,p,15,'#e8faff',fade);
 for(let i=0;i<(reduced?4:18);i++){
  const a=i*2.399,reach=22+(i%5)*5,dx=Math.cos(a),dy=Math.sin(a)*.52;
  const points=[p,{x:p.x+dx*reach*.36-dy*6,y:p.y+dy*reach*.36+dx*5},{x:p.x+dx*reach*.66+dy*5,y:p.y+dy*reach*.66-dx*2},{x:p.x+dx*reach,y:p.y+dy*reach}];
  judgmentLine(ctx,points,i%3?'#b7edff':'#dbb5ff',1.35,fade);
  if(!reduced){const d=age*.11;judgmentLine(ctx,[{x:p.x+dx*(reach+d),y:p.y+dy*(reach+d)},{x:p.x+dx*(reach+d+3),y:p.y+dy*(reach+d+3)}],'#e4f9ff',.8,fade);}
 }
}
