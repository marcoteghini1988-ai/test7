// Approved direction B: shared volumetric projectile, reticle and contact in game and studio.
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));
const tier=r=>['Comune','Rara','Epica','Leggendaria'].indexOf(r);
function line(ctx,points,color,width=1,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore();}
function glow(ctx,p,r,color,alpha=1){if(r<=0)return;ctx.save();ctx.globalAlpha*=alpha;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);g.addColorStop(0,color);g.addColorStop(.22,color+'bb');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);ctx.restore();}
function curve(from,to,t,bend){const u=1-t,c={x:(from.x+to.x)/2+bend,y:(from.y+to.y)/2};return {x:u*u*from.x+2*u*t*c.x+t*t*to.x,y:u*u*from.y+2*u*t*c.y+t*t*to.y};}
function crescentGeometry(p,r,angle,t){
 const n=30,outer=[],inner=[],pitch=.57+.11*Math.sin(t*TAU),yaw=.23*Math.sin(t*TAU*.7);
 const project=(x,y,z)=>{const a=x*Math.cos(angle)-y*Math.sin(angle),b=x*Math.sin(angle)+y*Math.cos(angle);return {x:p.x+a+z*yaw,y:p.y+b*pitch-z*.65,z:z+b*.35};};
 for(let i=0;i<=n;i++){const u=i/n,a=-1.93+u*3.86,b=-1.49+u*2.98;outer.push({x:Math.cos(a)*r,y:Math.sin(a)*r});inner.push({x:(-.42+.943*Math.cos(b))*r,y:.943*Math.sin(b)*r});}
 return {n,outer,inner,project};
}
export function crescentLeadingPoint(r,angle,t,phi){
 const g=crescentGeometry({x:0,y:0},r,angle,t),points=[];
 for(const v of [...g.outer,...g.inner])for(const z of [-r*.095,r*.095])points.push(g.project(v.x,v.y,z));
 return points.reduce((a,b)=>a.x*Math.cos(phi)+a.y*Math.sin(phi)>b.x*Math.cos(phi)+b.y*Math.sin(phi)?a:b);
}
function meshCrescent(ctx,p,r,angle,t,rarity){
 const {n,outer,inner,project}=crescentGeometry(p,r,angle,t);
 const faces=[];for(let i=0;i<n;i++){
  for(const z of [-r*.095,r*.095])faces.push({p:[outer[i],outer[i+1],inner[i+1],inner[i]].map(v=>project(v.x,v.y,z)),color:z>0?(i%4?'#d6f8ff':'#ffffff'):'#3b6ab2'});
  faces.push({p:[project(outer[i].x,outer[i].y,-r*.095),project(outer[i+1].x,outer[i+1].y,-r*.095),project(outer[i+1].x,outer[i+1].y,r*.095),project(outer[i].x,outer[i].y,r*.095)],color:i%3?'#62aaff':'#ad8cff'});
 }
 faces.sort((a,b)=>a.p.reduce((n,p)=>n+p.z,0)-b.p.reduce((n,p)=>n+p.z,0));
 ctx.save();for(const f of faces){ctx.fillStyle=f.color;ctx.beginPath();f.p.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fill();}ctx.restore();
 ctx.save();ctx.shadowColor='#71b6ff';ctx.shadowBlur=8;
 line(ctx,outer.map(v=>project(v.x,v.y,r*.105)),'#edfaff',1.2);ctx.restore();
 for(let i=3;i<n;i+=3){const v=outer[i],a=project(v.x,v.y,r*.13),b=project(v.x*1.12+Math.sin(t*47+i)*r*.09,v.y*1.12,r*.16),c=project(v.x*1.22,v.y*1.19,r*.08);line(ctx,[a,b,c],i%2?'#ad97ff':'#84d3ff',.65,.85);}
 for(let j=0;j<2+tier(rarity);j++){const points=[];for(let i=0;i<=n;i++){const w=.25+j*.10+(i%2?-.035:.035),v={x:outer[i].x*(1-w)+inner[i].x*w,y:outer[i].y*(1-w)+inner[i].y*w};points.push(project(v.x,v.y,r*.12));}line(ctx,points,j%2?'#c1a0ff':'#48acff',.55,.85);}
 if(tier(rarity)===3)for(let j=4;j<n;j+=5){const v=project(outer[j].x,outer[j].y,r*.16);glow(ctx,v,2.6,j%2?'#f0a4ff':'#ceffff',.85);}
}
export function probeHammerFlightPosition(h,elapsed,to){
 const t=clamp(elapsed/h.flightMs),from={x:h.originX,y:h.originY},bend=h.kind==='probe'?0:(h.index?65:-65),p=curve(from,to,t,bend),c={x:(from.x+to.x)/2+bend,y:(from.y+to.y)/2};
 const phi=Math.atan2(2*(1-t)*(c.y-from.y)+2*t*(to.y-c.y),2*(1-t)*(c.x-from.x)+2*t*(to.x-c.x));
 return {from,bend,point:p,phi,scale:.68+.62*clamp(p.y/800)};
}
export function drawProbeHammerProjectile(ctx,h,elapsed,to){
 const t=elapsed/h.flightMs;if(t<0||t>1)return;const {from,bend,point:p,phi,scale}=probeHammerFlightPosition(h,elapsed,to);
 for(let layer=0;layer<2;layer++){const points=[];for(let i=0;i<=18;i++){const u=Math.max(0,t-(18-i)*.009),q=curve(from,to,u,bend);q.x+=Math.sin(i*2.7+elapsed*.021)*1.1;q.y+=Math.cos(i*1.9+elapsed*.018)*.7;points.push(q);}line(ctx,points,layer?'#dcefff':'#6495ff',layer?.7:4.5,layer?.85:.18);}
 glow(ctx,p,(h.kind==='probe'?10:24)*scale,'#4b8bff',.35);
 if(h.kind==='probe'){
  const l=15*scale,w=2.8*scale;ctx.save();ctx.translate(p.x-Math.cos(phi)*l,p.y-Math.sin(phi)*l);ctx.rotate(phi);ctx.fillStyle='#d5f8ff';ctx.beginPath();ctx.moveTo(l,0);ctx.lineTo(-l*.6,-w);ctx.lineTo(-l*.25,0);ctx.lineTo(-l*.6,w);ctx.closePath();ctx.fill();line(ctx,[{x:-l*.6,y:-w},{x:l,y:0},{x:-l*.6,y:w}],'#72b4ff',1);ctx.restore();
 }else{
  const angle=phi+Math.PI/2+t*TAU*1.65+(h.bonus?Math.PI/2:0),r=(18+tier(h.rarity)*1.2)*scale;
  // Il punto più avanzato del volume, non il centro della mesh, raggiunge lo scafo.
  const lead=crescentLeadingPoint(r,angle,t,phi),center={x:p.x-lead.x,y:p.y-lead.y};meshCrescent(ctx,center,r,angle,t,h.rarity);
  const spin=[];for(let i=0;i<=13;i++){const a=angle-i*.11;spin.push({x:center.x+Math.cos(a)*r*1.15,y:center.y+Math.sin(a)*r*.64});}line(ctx,spin,'#ab84ff',1,.65);
 }
}
export function drawProbeHammerReticle(ctx,p,elapsed,rarity,{opacity=1,scale=1}={}){
 const grow=clamp(elapsed/140),r=(14+tier(rarity))*grow;ctx.save();ctx.globalAlpha*=opacity;ctx.translate(p.x,p.y);ctx.scale(scale,scale*.7);ctx.shadowColor='#7cbaff';ctx.shadowBlur=6;
 ctx.strokeStyle='#86cfff';ctx.lineWidth=.8;ctx.strokeRect(-r,-r,r*2,r*2);for(const f of [-.5,0,.5]){line(ctx,[{x:f*r,y:-r},{x:f*r,y:r}],'#86cfff',.65);line(ctx,[{x:-r,y:f*r},{x:r,y:f*r}],'#86cfff',.65);}
 ctx.beginPath();ctx.arc(0,0,r*.69,0,TAU);ctx.stroke();line(ctx,[{x:-r-6,y:0},{x:r+6,y:0}],'#c4efff',1);line(ctx,[{x:0,y:-r-6},{x:0,y:r+6}],'#c4efff',1);
 if(tier(rarity)>1){ctx.rotate(elapsed*.0008);for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);line(ctx,[{x:r+3,y:3},{x:r+3,y:r*.6},{x:r*.6,y:r+3}],'#b6b7ff',1.4);}}
 ctx.restore();
}
export function drawProbeHammerContact(ctx,h,age,p,reduced=false){
 if(age<0||age>1000)return;const a=Math.exp(-age/(h.bonus?240:150)),r=h.kind==='probe'?9:h.bonus?46:26;
 if(h.blocked||h.actualDamage<=0){ctx.save();ctx.globalAlpha=a;ctx.strokeStyle='#b8edff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,18,12,.3,0,TAU);ctx.stroke();ctx.restore();return;}
 glow(ctx,p,r*(.32+Math.min(1,age/80)),'#5aa6ff',a*.8);glow(ctx,p,r*.28,'#f1fdff',a);
 if(h.bonus){
  ctx.save();
  const expansion=clamp(age/170),pulse=Math.exp(-age/210);
  const radius=13+expansion*29,ball=ctx.createRadialGradient(p.x-3,p.y-4,0,p.x,p.y,radius);ball.addColorStop(0,'#ffffff');ball.addColorStop(.16,'#d7f7ff');ball.addColorStop(.35,'#80b8ff');ball.addColorStop(.64,'#285df3b0');ball.addColorStop(1,'#173ed900');ctx.globalAlpha=pulse*.9;ctx.fillStyle=ball;ctx.fillRect(p.x-radius,p.y-radius,radius*2,radius*2);
  for(let i=0;i<15;i++){const angle=i*2.399+Math.sin(i*3.1)*.22,dist=(20+expansion*43)*(.64+(i%5)*.10),end={x:p.x+Math.cos(angle)*dist,y:p.y+Math.sin(angle)*dist*.68},middle={x:p.x+Math.cos(angle)*dist*.52+Math.sin(i*4+age*.035)*5,y:p.y+Math.sin(angle)*dist*.68*.52+Math.cos(i*3)*4},route=[p,middle,end];line(ctx,route,'#2665ff',5.4,pulse*.52);line(ctx,route,i%3?'#e1f6ff':'#bfa4ff',1.3,pulse);line(ctx,[middle,{x:middle.x+Math.cos(angle+.75)*dist*.30,y:middle.y+Math.sin(angle+.75)*dist*.20}],'#a9d9ff',.85,pulse*.85);}
  ctx.globalCompositeOperation='screen';
  for(let i=0;i<6;i++){const angle=i*TAU/6,dist=7+expansion*15;glow(ctx,{x:p.x+Math.cos(angle)*dist,y:p.y+Math.sin(angle)*dist*.50},9+expansion*4,i%2?'#477dff':'#c0a0ff',pulse*.6);}
  ctx.globalAlpha=pulse;ctx.fillStyle='#f5fdff';ctx.beginPath();for(let i=0;i<18;i++){const angle=i*TAU/18,rad=i%2?5:12;const x=p.x+Math.cos(angle)*rad,y=p.y+Math.sin(angle)*rad*.7;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.restore();
 }
 const angle=h.bonus?-.70:.75,len=(h.bonus?39:24)*(1+clamp(age/120)*.20);
 if(h.kind==='hammer'){for(const [width,col,alpha]of [[8,'#518eff',.15],[2.8,'#a4d6ff',.75],[1.2,'#ffffff',1]])line(ctx,[{x:p.x-Math.cos(angle)*len,y:p.y-Math.sin(angle)*len*.65},{x:p.x+Math.cos(angle)*len,y:p.y+Math.sin(angle)*len*.65}],col,width,a*alpha);}
 const count=h.bonus?30:h.kind==='probe'?9:15;
 for(let i=0;i<count;i++){const angle=i*TAU/count+.27*Math.sin(i*2.2),speed=(.55+(i%7)*.13),d=(6+(reduced?3:age*(h.bonus?.36:.13))*speed),end=Math.min(r*1.55,d);line(ctx,[{x:p.x+Math.cos(angle)*end*.20,y:p.y+Math.sin(angle)*end*.62*.20},{x:p.x+Math.cos(angle)*end*.72+Math.sin(i*3)*2,y:p.y+Math.sin(angle)*end*.62*.72},{x:p.x+Math.cos(angle)*end,y:p.y+Math.sin(angle)*end*.62}],i%4?'#8dc8ff':'#e5c6ff',i%3?.85:1.7,a);}
 if(h.bonus){ctx.save();ctx.globalAlpha=a*.8;ctx.lineWidth=1.8;ctx.strokeStyle='#bedfff';ctx.beginPath();ctx.ellipse(p.x,p.y+7,(12+clamp(age/250)*53),(4+clamp(age/250)*18),0,0,TAU);ctx.stroke();ctx.restore();}
}
