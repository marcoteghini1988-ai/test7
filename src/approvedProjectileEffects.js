import {Group,Mesh,MeshStandardMaterial,SphereGeometry,TorusGeometry,OctahedronGeometry,ConeGeometry,BoxGeometry,Vector3} from 'three';
import {boardPointToWorld,worldPointToBoard} from './maglioProjectile3D.js';
export const clamp=n=>Math.max(0,Math.min(1,n));
const TAU=Math.PI*2;
export function stroke(ctx,pts,color,width=1,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.restore();}
export function glow(ctx,p,r,color,alpha=1){if(r<=0||alpha<=0)return;ctx.save();ctx.globalAlpha*=alpha;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);g.addColorStop(0,color);g.addColorStop(.14,color+'bb');g.addColorStop(1,color+'00');ctx.fillStyle=g;ctx.fillRect(p.x-r,p.y-r,r*2,r*2);ctx.restore();}
export function newProjectile(kind,tier=0){
 const root=new Group(),finish=['#53616f','#b38452','#c6d6e3','#c3d7f5'][tier];
 const mat=(c,e=0)=>new MeshStandardMaterial({color:c,metalness:.91,roughness:.25,emissive:c,emissiveIntensity:e});
 const m=mat(finish,kind==='cannonball'?.02:0),dark=mat('#18232f'),silver=mat('#b6c4d0'),prism=mat('#b7d8f5',.14);
 const add=(geo,material,pos=[0,0,0],rot=[0,0,0],parent=root)=>{const o=new Mesh(geo,material);o.position.set(...pos);o.rotation.set(...rot);parent.add(o);return o;};
 if(kind==='cannonball'){
  add(new SphereGeometry(.26+tier*.014,22,16),m);
  // Rarità conserva la sfera; aggiunge una fascia, poi piccole piastre e inserti.
  if(tier>=1)add(new TorusGeometry(.267+tier*.014,.019,5,28),tier>=2?silver:m,[0,0,0],[Math.PI/2,.15,0]);
  if(tier>=2)for(let i=0;i<3;i++)add(new BoxGeometry(.09,.02,.11),silver,[Math.cos(i*TAU/3)*.26,.02,Math.sin(i*TAU/3)*.26],[0,-i*TAU/3,0]);
  if(tier===3)for(let i=0;i<4;i++)add(new OctahedronGeometry(.055),prism,[Math.cos(i*Math.PI/2)*.255,Math.sin(i*Math.PI/2)*.255,0]);
  root.userData={frontZ:-.28,rearZ:.28};
 }else if(kind==='residual'){
  const o=add(new OctahedronGeometry(.27,0),m);o.scale.set(.7,.45,1.6);
  add(new BoxGeometry(.11,.08,.33),dark,[.08,.05,.04],[.2,.2,.5]);root.userData={frontZ:-.4,rearZ:.35};
 }else if(kind==='ionic-dart'){
  add(new ConeGeometry(.065,.52,6),mat('#c5ddff',.26),[0,0,-.03],[-Math.PI/2,0,0]);
  const body=add(new OctahedronGeometry(.12),mat('#8c9fff',.30),[0,0,.14]);body.scale.set(.35,.35,1.65);
  root.userData={frontZ:-.29,rearZ:.34};
 }
 return root;
}
// Electric paths are projected from the same world plane as the solid meshes.
export function electricFlight(ctx,e,ms,camera){
 const p=e.profile,t=clamp(ms/p.flightMs);if(ms<0||ms>p.flightMs)return;
 const a=boardPointToWorld(e.from,camera),b=boardPointToWorld(e.to,camera),axis=b.clone().sub(a).normalize(),side=new Vector3(axis.z,0,-axis.x);
 const loc=(u,s=0,h=0)=>{const q=boardPointToWorld({x:e.from.x+(e.to.x-e.from.x)*u,y:e.from.y+(e.to.y-e.from.y)*u},camera).addScaledVector(side,s);q.y+=h;return worldPointToBoard(q,camera);};
 const tick=Math.floor(ms/30),kind=p.kind,bright='#edf8ff',color=kind==='ionic-dart'?'#a47bff':'#6cc8ff';
 if(kind==='ionic-flash'){
  const fade=Math.sin(Math.PI*clamp(ms/p.flightMs));
  const pts=[loc(0),loc(Math.min(1,t*1.8))];stroke(ctx,pts,'#b1dfff',10,.17*fade);stroke(ctx,pts,bright,3.4,fade);return;
 }
 if(kind==='ionic-dart'){
  const length=.25,steps=44;
  for(let helix=0;helix<2;helix++){
   const points=[];for(let i=0;i<=steps;i++){
    const u=i/steps,phase=u*Math.PI*5.5+ms*.018+helix*Math.PI,rad=.18*(1-u*.25);
    points.push(loc(t-length*u,Math.cos(phase)*rad,.10+Math.sin(phase)*rad));
   }
   stroke(ctx,points,color,5,.18);stroke(ctx,points,helix?'#8edfff':'#d4b8ff',1.25,.94);
  }
  glow(ctx,loc(t),9,'#a59aff',.75);return;
 }
 const start=kind==='ionic-whip'?0:Math.max(0,t-.38),pts=[];
 for(let i=0;i<=34;i++){
  const u=start+(t-start)*i/34,env=Math.sin(Math.PI*u),wave=kind==='ionic-whip'?Math.sin(u*9-ms*.004)*.48*env:0;
  const noise=Math.sin(i*2.731+tick*1.9)*.10;
  pts.push(loc(u,wave+noise,.06+Math.cos(i*1.7+tick)*.025));
 }
 stroke(ctx,pts,color,7,.16);stroke(ctx,pts,color,2.8,.8);stroke(ctx,pts,bright,1,.98);
 if(kind==='ionic-comb'&&t<.30){
  for(let i=0;i<5;i++){
   const fil=[];for(let k=0;k<10;k++){const u=k/9,spread=(i-2)*.20*(1-u);fil.push(loc(t*u,spread+Math.sin(k*2+tick+i)*.025,.04));}
   stroke(ctx,fil,'#9adfff',1.1,.9);
  }
 }
 glow(ctx,loc(t),7,'#b7eaff',.7);
}
export function electricImpact(ctx,p,kind,ms,tier=0){
 if(ms<0||ms>900)return;const u=ms/900,fade=(1-u)**2;
 glow(ctx,p,24+tier*3,'#a7dfff',Math.exp(-ms/120)*.9);
 for(let i=0;i<14+tier*2;i++){
  const a=i*2.399,dist=3+u*(20+(i%4)*7),q={x:p.x+Math.cos(a)*dist,y:p.y+Math.sin(a)*dist*.63};
  stroke(ctx,[q,{x:q.x+Math.cos(a)*6*(1-u),y:q.y+Math.sin(a)*6*(1-u)}],i%3?'#79c9ff':'#fffaff',1.1,fade);
 }
 if(kind==='ionic-comb'&&ms<380){
  for(let i=-2;i<=2;i++){
   stroke(ctx,[{x:p.x-15,y:p.y+i*6-3},{x:p.x+15,y:p.y+i*6+3}],'#d9f5ff',.65,fade*.65);
   stroke(ctx,[{x:p.x+i*6-2,y:p.y-14},{x:p.x+i*6+2,y:p.y+14}],'#8bd6ff',.65,fade*.65);
  }
 }else if(kind==='ionic-dart'&&ms<420){
  for(let j=0;j<2;j++){ctx.save();ctx.globalAlpha=fade*.8;ctx.strokeStyle=j?'#c3a3ff':'#9fe5ff';ctx.lineWidth=1.1;ctx.beginPath();ctx.ellipse(p.x,p.y,8+u*17,4+u*8,j*.9+u*3,0,TAU);ctx.stroke();ctx.restore();}
 }else if(kind==='ionic-whip'&&ms<220)stroke(ctx,[{x:p.x-18+u*20,y:p.y+7},{x:p.x,y:p.y},{x:p.x+10,y:p.y-9+u*10}],'#eefaff',1.7,fade);
 else if(kind==='ionic-flash')glow(ctx,p,11,'#ffffff',Math.exp(-ms/45));
}
export function kineticImpact(ctx,p,ms,{power=1,destroy=false}={}){
 if(ms<0||ms>1250)return;const age=ms/1000,fade=clamp(1-ms/1100);
 const e=Math.exp(-ms/100);glow(ctx,p,35*power,'#ffb45e',e*.8);glow(ctx,p,12*power,'#fff7dd',e);
 ctx.save();ctx.globalAlpha=fade*.5;ctx.fillStyle='#10161b';ctx.beginPath();ctx.ellipse(p.x,p.y,9*power,5*power,0,0,TAU);ctx.fill();ctx.restore();
 ctx.save();ctx.globalAlpha=fade*.38;ctx.strokeStyle='#f2d3a9';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(p.x,p.y,8+Math.sqrt(age)*42*power,4+Math.sqrt(age)*21*power,0,0,TAU);ctx.stroke();ctx.restore();
 for(let i=0;i<(destroy?42:24);i++){
  const a=i*2.399,v=18+(i%7)*9,x=p.x+Math.cos(a)*age*v*power,y=p.y+Math.sin(a)*age*v*.58*power-age*(1-age)*30;
  ctx.save();ctx.globalAlpha=fade*(i%3?.85:.55);ctx.translate(x,y);ctx.rotate(a+age*(i%5+4));
  if(i%3){ctx.fillStyle=i%2?'#a5b5bd':'#435866';ctx.fillRect(-2,-1,3+(i%3),2);ctx.fillStyle='#e9e6d8';ctx.fillRect(-2,-1,4,.6);}
  else{ctx.strokeStyle='#ffd087';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(-7*fade,0);ctx.stroke();}ctx.restore();
 }
 for(let i=0;i<6;i++)glow(ctx,{x:p.x+Math.cos(i*2.4)*age*19,y:p.y-8-age*24+Math.sin(i)*8},9+age*13,'#8796a2',fade*.055*power);
}
export function hullPose(ms,kind){if(ms<0||ms>1050)return {x:0,y:0,roll:0,pitch:0,light:0};
 const impulse=(1-Math.exp(-ms/13))*Math.exp(-ms/230),strength=kind.startsWith('ionic')?3.2:7;
 return {x:Math.sin(ms*.09)*impulse*2,y:-impulse*strength,roll:Math.sin(ms*.023)*impulse*5,pitch:impulse*6,light:Math.exp(-ms/95)*.6};}
