// Volumetric electrical lance; no machine is drawn on the battlefield.
import {commandLanceTier,commandLanceHullPose} from './commandLanceSpec.js';
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));
export function lanceLine(ctx,points,color,width=1,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore();}
export function lanceGlow(ctx,p,r,color,alpha=1){if(r<=0)return;ctx.save();ctx.globalAlpha*=alpha;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);g.addColorStop(0,color);g.addColorStop(.22,color+'bb');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);ctx.restore();}
export function commandLanceFlight(h,elapsed,to){
 const t=clamp(elapsed/h.flightMs),point={x:h.originX+(to.x-h.originX)*t,y:h.originY+(to.y-h.originY)*t};
 return {t,point,phi:Math.atan2(to.y-h.originY,to.x-h.originX),scale:.55+.75*clamp(point.y/800)};
}
export function drawCommandLanceProjectile(ctx,h,elapsed,to){
 if(elapsed<0||elapsed>h.flightMs)return;
 const {t,point:p,phi,scale}=commandLanceFlight(h,elapsed,to),tier=commandLanceTier(h.rarity),length=(42+tier*3)*scale,halfWidth=(4+tier*.6)*scale;
 // The nose is p: it reaches the measured target, never its mesh center.
 const local=(x,y,z=0)=>({x:p.x+Math.cos(phi)*x-Math.sin(phi)*y+z*.4,y:p.y+Math.sin(phi)*x+Math.cos(phi)*y-z*.65,z});
 const tail=local(-length,0),shoulder=-length*.70,back=-length*.93;
 const ring=[local(shoulder,-halfWidth,0),local(shoulder,0,halfWidth*.7),local(shoulder,halfWidth,0),local(shoulder,0,-halfWidth*.7)];
 const faces=ring.map((v,i)=>({points:[p,v,ring[(i+1)%4]],color:['#7ed7ff','#eefaff','#468be0','#b5a9fb'][i]}));
 faces.sort((a,b)=>a.points.reduce((n,p)=>n+(p.z||0),0)-b.points.reduce((n,p)=>n+(p.z||0),0));
 lanceGlow(ctx,local(-length*.5,0),length*.65,'#4e9cff',.23);
 for(const f of faces){ctx.save();ctx.fillStyle=f.color;ctx.beginPath();f.points.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.closePath();ctx.fill();ctx.restore();}
 for(const v of ring)lanceLine(ctx,[p,v,local(back,0)],'#d6f8ff',.8,.95);
 lanceLine(ctx,[tail,p],'#ffffff',1.6);
 // Connected electrical tail: branches are light, never additional projectiles.
 const trail=[];for(let i=0;i<19;i++)trail.push(local(-length-i*scale*3.3,Math.sin(i*2.3+elapsed*.033)*(i%2?1:3)*scale));
 lanceLine(ctx,trail,'#2a74ed',5,.18);lanceLine(ctx,trail,'#a3e7ff',.9,.8);
 for(let i=0;i<3+tier;i++){
  const x=-length*(.25+i*.16),sign=i%2?1:-1;
  lanceLine(ctx,[local(x,0),local(x-5,sign*(7+Math.sin(elapsed*.025+i)*2)*scale),local(x-12,sign*11*scale),local(x-18,sign*7*scale)],i%3?'#6ec7ff':'#cdbbff',.65,.8);
 }
 if(tier===2){lanceLine(ctx,[local(-length*.80,-halfWidth*.7),local(-length*.15,0)],'#e3b9ff',.7);}
}
export function drawCommandLanceContact(ctx,h,age,p,{reduced=false}={}){
 if(age<0||age>1000)return;
 const tier=commandLanceTier(h.rarity),fade=Math.exp(-age/210);
 if(h.blocked){ctx.save();ctx.strokeStyle='#b7efff';ctx.globalAlpha=fade;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,23+clamp(age/110)*8,15+clamp(age/110)*5,0,0,TAU);ctx.stroke();ctx.restore();lanceGlow(ctx,p,19,'#7acbff',fade*.5);return;}
 if(h.actualDamage<=0){lanceGlow(ctx,p,7,'#dceeff',fade*.25);return;}
 lanceGlow(ctx,p,24+tier*4,'#438aff',fade*.75);lanceGlow(ctx,p,8,'#e8fcff',fade);
 const branchCount=8+tier*2,spread=24+tier*4;
 for(let i=0;i<branchCount;i++){
  const angle=i*2.399+Math.sin(i)*.13,extent=spread*(.6+(i%4)*.13),phase=reduced?0:age*.016;
  const end={x:p.x+Math.cos(angle)*extent,y:p.y+Math.sin(angle)*extent*.56};
  const mid={x:p.x+(end.x-p.x)*.5+Math.sin(phase+i)*3,y:p.y+(end.y-p.y)*.5+Math.cos(phase*1.3+i)*2};
  lanceLine(ctx,[p,mid,end],i%4?'#9edbff':'#d4b2ff',1.1,fade);
  lanceLine(ctx,[mid,{x:mid.x+Math.cos(angle+.6)*extent*.25,y:mid.y+Math.sin(angle+.6)*extent*.17}],'#75baff',.7,fade*.7);
 }
 if(!reduced)for(let i=0;i<12+tier*3;i++){
  const a=i*2.399,d=6+age*.11*(.4+(i%5)*.16),q={x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d*.55};
  lanceLine(ctx,[q,{x:q.x+Math.cos(a)*3,y:q.y+Math.sin(a)*2}],i%3?'#d5f4ff':'#a3bdff',.9,Math.exp(-age/260));
 }
}
export function drawCommandLanceSignal(ctx,p,age){
 if(age<0||age>600)return;const fade=Math.sin(clamp(age/600)*Math.PI);
 lanceGlow(ctx,p,27,'#a6d8ff',fade*.5);ctx.save();ctx.strokeStyle='#b2e9ff';ctx.globalAlpha=fade;ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(p.x,p.y,21,27,0,0,TAU);ctx.stroke();ctx.restore();
}
export {commandLanceHullPose};
