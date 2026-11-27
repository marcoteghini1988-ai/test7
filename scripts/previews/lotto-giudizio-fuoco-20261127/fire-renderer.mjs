import {judgmentLine as line,judgmentGlow as glow} from './judgment-renderer.mjs';
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));
export function magmaFlight(hit,age,to){
 const t=clamp(age/hit.flightMs),arch=Math.sin(t*Math.PI),sign=hit.who==='A'?-1:1;
 return {t,point:{x:hit.originX+(to.x-hit.originX)*t+arch*(hit.index%2?-1:1)*(40+hit.tier*5),y:hit.originY+(to.y-hit.originY)*t+sign*arch*52},
  scale:.58+.70*clamp((hit.originY+(to.y-hit.originY)*t)/800)};
}
function magmaSphere(ctx,p,r,age,tier){
 glow(ctx,p,r*2.5,'#ff740b',.22);
 ctx.save();const g=ctx.createRadialGradient(p.x-r*.23,p.y-r*.25,0,p.x,p.y,r);g.addColorStop(0,'#ffe3a1');g.addColorStop(.33,'#ff9c24');g.addColorStop(.7,'#d94605');g.addColorStop(1,'#3d1004');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fill();ctx.clip();
 // Basalt crust pieces leave luminous cracks, without adding independent shells.
 for(let i=0;i<30;i++){const a=i*2.399+age*.00025,z=Math.sin(i*1.73),radius=r*(.15+(i%6)*.16),x=p.x+Math.cos(a)*radius,y=p.y+Math.sin(a)*radius,chunk=r*(.18+(i%4)*.025);
  ctx.fillStyle=z>0?'#392b23':'#170e0b';ctx.beginPath();for(let n=0;n<6;n++){const b=n/6*TAU,xx=x+Math.cos(b)*chunk*(1+.16*Math.sin(n*3+i)),yy=y+Math.sin(b)*chunk*.8;n?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.closePath();ctx.fill();
  line(ctx,[{x:x-chunk*.5,y},{x,y:y-chunk*.5},{x:x+chunk*.55,y:y-chunk*.1}],tier===3?'#fff5b7':'#ffb43c',tier===1?.6:.85,.8);
 }
 ctx.restore();
}
export function drawMagmaFlight(ctx,h,age,to,{reduced=false,texture=null}={}){
 if(age<0||age>h.flightMs)return;const v=magmaFlight(h,age,to),r=(h.index?15:21)*v.scale;
 if(reduced){glow(ctx,v.point,r,'#ffad42',.4);return;}
 for(let j=12;j>=1;j--){const prev=magmaFlight(h,Math.max(0,age-j*12),to).point;glow(ctx,prev,r*(1-j/15),'#f45e09',(1-j/14)*.07);}
 for(let i=0;i<h.tier*3;i++){const q=magmaFlight(h,Math.max(0,age-45-i*13),to).point,jitter=Math.sin(age*.017+i*2.2)*4;
  line(ctx,[{x:q.x+jitter,y:q.y},{x:q.x+jitter+1.3,y:q.y+3}],'#ffca6d',1,.7);}
 if(h.tier===3)for(let i=0;i<3;i++){const points=Array.from({length:18},(_,n)=>{const q=magmaFlight(h,Math.max(0,age-n*8),to).point;return {x:q.x+Math.sin(n*.6+age*.01+i*TAU/3)*r*.4,y:q.y};});line(ctx,points,i===1?'#fff2ae':'#ffb941',.8,.8);}
 if(texture){ctx.save();ctx.translate(v.point.x,v.point.y);ctx.rotate(age*.00024*(h.index%2?-1:1));ctx.drawImage(texture,-r*1.3,-r*1.3,r*2.6,r*2.6);ctx.restore();}
 else magmaSphere(ctx,v.point,r,age,h.tier);
}
export function drawPlasmaFlight(ctx,h,age,to,{reduced=false}={}){
 if(age<0||age>h.flightMs+230)return;const head=clamp(age/h.flightMs),tail=clamp((age-900)/h.flightMs),dx=to.x-h.originX,dy=to.y-h.originY,norm=Math.hypot(dx,dy)||1,nx=-dy/norm,ny=dx/norm;
 if(reduced){line(ctx,[{x:h.originX+dx*tail,y:h.originY+dy*tail},{x:h.originX+dx*head,y:h.originY+dy*head}],'#ffd290',3,.35);return;}
 const length=Math.max(.001,head-tail),layers=h.tier===3?3:2,alpha=age>h.flightMs?clamp(1-(age-h.flightMs)/230):1;
 // Shaded hot gas lobes and fine turbulent filaments give the jet depth.
 // The multiple strands form one connected pulse and one contact.
 for(let i=0;i<75;i++){
  const u=i/74,t=tail+length*u,phase=t*(h.tier===3?51:39)-age*.017,envelope=Math.sin(u*Math.PI)**.5,
   swirl=Math.sin(phase)*6.5*envelope,p={x:h.originX+dx*t+nx*swirl,y:h.originY+dy*t+ny*swirl},r=(3.2+2.2*Math.sin(i*1.7+age*.006)**2)*envelope;
  if(r>.1){glow(ctx,p,r*2.1,'#e94805',alpha*.10);glow(ctx,p,r,'#ffb336',alpha*.22);}
 }
 for(let layer=0;layer<layers;layer++){
  const points=Array.from({length:90},(_,i)=>{const u=i/89,t=tail+length*u,envelope=Math.sin(u*Math.PI)**.45,width=(h.tier===3?8.5:6)*envelope,
   phase=t*(h.tier===3?51:39)-age*.017+layer*TAU/layers,wave=Math.sin(phase)*width;
   return {x:h.originX+dx*t+nx*wave,y:h.originY+dy*t+ny*wave};});
  line(ctx,points,'#ed4803',9,alpha*.12);line(ctx,points,'#ffad24',h.tier===3?3.3:2.8,alpha*.55);line(ctx,points,layer?'#ffd575':'#fff0bd',h.tier===3?1.2:.95,alpha*.9);
  for(let strand=0;strand<4;strand++){const fine=points.map((p,i)=>{const u=i/89,shake=Math.sin(i*.75+age*.021+strand*2.39)*1.5*Math.sin(u*Math.PI);return {x:p.x+nx*shake,y:p.y+ny*shake};});line(ctx,fine,strand%2?'#fff2c0':'#ffd261',.38,alpha*.48);}
 }
 const p={x:h.originX+dx*head,y:h.originY+dy*head};glow(ctx,p,14,'#ffc06d',alpha*.45);
 for(let i=0;i<14;i++){const t=tail+length*i/14,a=i*2.399+age*.01,r=5+(i%4)*2;const p={x:h.originX+dx*t+Math.cos(a)*r,y:h.originY+dy*t+Math.sin(a)*r};line(ctx,[p,{x:p.x+nx*2,y:p.y+ny*2}],'#ffdb88',.8,alpha*.55);}
}
export function drawFireContact(ctx,h,age,p,{reduced=false}={}){
 if(age<0||age>1100)return;const f=Math.exp(-age/(h.kind==='mortar'?280:220));
 if(h.blocked){ctx.save();ctx.globalAlpha*=f;ctx.strokeStyle='#99dbff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(p.x,p.y,33,23,0,0,TAU);ctx.stroke();ctx.restore();glow(ctx,p,28,'#ffba6e',f*.25);return;}
 if(h.actualDamage<=0){glow(ctx,p,8,'#ffb259',f*.18);return;}
 glow(ctx,p,h.kind==='mortar'?45+h.tier*3:34+h.tier*2,'#ff740b',f*.6);glow(ctx,p,12,'#ffeab2',f);
 const count=reduced?4:h.kind==='mortar'?18+h.tier*4:10+h.tier*3;
 for(let i=0;i<count;i++){const a=i*2.399,d=10+(i%6)*4+age*(h.kind==='mortar'?.10:.065),x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d*.5+age*age*.00003;
  line(ctx,[{x,y},{x:x+Math.cos(a)*(h.kind==='mortar'?3:5),y:y+Math.sin(a)*2}],i%3?'#ffb548':'#ffeaa0',h.kind==='mortar'?1.5:1,f);}
 if(h.kind==='mortar'){ctx.save();ctx.globalAlpha=f*.6;ctx.strokeStyle=h.tier===3?'#ffe8a9':'#ff8f27';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(p.x,p.y,10+age*.06,5+age*.025,0,0,TAU);ctx.stroke();ctx.restore();}
}
export function drawBurnTick(ctx,p,age,tier,{reduced=false}={}){
 if(age<0||age>680)return;const f=Math.sin(Math.PI*age/680);glow(ctx,p,27,'#ff720b',f*.35);
 if(!reduced)for(let i=0;i<8+tier;i++){const x=p.x+Math.sin(i*2.399)*22,y=p.y+Math.cos(i*1.8)*8-age*.022;line(ctx,[{x,y:y+5},{x:x+Math.sin(age*.018+i)*2,y},{x:x+1,y:y-4}],'#ffc162',1.1,f);}
}
