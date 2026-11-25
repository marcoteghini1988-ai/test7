// Il BOOM appartiene all'unico urto del Collassatore, mai ai singoli danni HP.
// Onda sul piano e detriti balistici usano la stessa camera della battaglia.
import {Vector3} from 'three';
import {boardPointToWorld,worldPointToBoard} from './maglioProjectile3D.js';

const clamp=n=>Math.max(0,Math.min(1,n));
const seed=n=>{const s=Math.sin(n*127.1+37.7)*43758.5453;return s-Math.floor(s);};
export const COLLISION_BOOM_MS=1250;
export function drawCollisionExplosion(ctx,p,profile,elapsed,camera,{reduced=false}={}){
 if(elapsed<0||elapsed>COLLISION_BOOM_MS)return 'none';
 const legendary=profile.tier===3,seconds=elapsed/1000;
 const origin=boardPointToWorld(p,camera),right=worldPointToBoard(origin.clone().add(new Vector3(1,0,0)),camera);
 const unit=Math.max(1,Math.hypot(right.x-p.x,right.y-p.y));
 const depth=.75+clamp(p.y/800)*.25,power=(legendary?1.12:1)*depth;
 const flash=Math.exp(-elapsed/55),heat=Math.pow(1-clamp(elapsed/480),1.15);
 ctx.save();ctx.globalCompositeOperation='source-over';
 // Fumo volumetrico irregolare: emerge dietro il nucleo caldo e sale.
 if(elapsed>100){
  const smoke=Math.sin(clamp((elapsed-100)/1150)*Math.PI)*.40;
  for(let i=0;i<9;i++){
   const a=i*2.399,r=(15+elapsed*.027)*power,
    x=p.x+Math.cos(a)*r*(.5+seed(i)),y=p.y+Math.sin(a)*r*.35-elapsed*.026;
   const size=(15+seed(i+30)*15+elapsed*.018)*power;
   const g=ctx.createRadialGradient(x,y,0,x,y,size);
   g.addColorStop(0,`rgba(55,47,43,${smoke})`);g.addColorStop(.55,`rgba(39,43,49,${smoke*.7})`);g.addColorStop(1,'rgba(22,29,36,0)');
   ctx.fillStyle=g;ctx.fillRect(x-size,y-size,size*2,size*2);
  }
 }
 // Pressione sul tavolo: un fronte radente, con prospettiva fisica.
 const wave=clamp(elapsed/650),waveRadius=(8+110*(1-Math.pow(1-wave,2)))*power/unit;
 if(wave<1)for(let band=0;band<(legendary?3:2);band++){
  const radius=waveRadius*(1-band*.14);ctx.beginPath();
  for(let i=0;i<=64;i++){
   const a=i*Math.PI/32,q=worldPointToBoard(origin.clone().add(new Vector3(Math.cos(a)*radius,.035,Math.sin(a)*radius)),camera);
   i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);
  }
  ctx.strokeStyle=band===0?'#fff0c6':legendary&&band===2?'#b9ceff':'#ff9c42';
  ctx.globalAlpha=(1-wave)*(band===0?.9:.65);ctx.lineWidth=(band===0?5:2)*(1-wave)+.5;ctx.stroke();
 }
 ctx.globalAlpha=1;
 // Fronte spezzato e netto, brevissimo: rende leggibile lo schianto anche
 // prima che il fumo e il nucleo sfumati prendano il sopravvento.
 if(elapsed<190&&!reduced){
  const burst=1-elapsed/190,spread=1-Math.exp(-elapsed/35);
  ctx.save();ctx.translate(p.x,p.y);ctx.globalCompositeOperation='lighter';
  for(let i=0;i<18;i++){
   const a=i*2.399,inner=(10+seed(i+380)*12)*power,
    outer=(inner+spread*(30+seed(i+410)*43))*power;
   ctx.globalAlpha=burst*(.4+seed(i+430)*.5);ctx.fillStyle=i%3?'#ffcf6a':'#f6fbff';
   ctx.beginPath();ctx.moveTo(Math.cos(a-.07)*inner,Math.sin(a-.07)*inner*.65);
   ctx.lineTo(Math.cos(a)*outer,Math.sin(a)*outer*.65);
   ctx.lineTo(Math.cos(a+.07)*inner,Math.sin(a+.07)*inner*.65);ctx.closePath();ctx.fill();
  }
  ctx.restore();
 }
 // Lampo bianco, palla di fuoco multilobo e getto di gas incandescenti.
 if(heat>0){
  ctx.globalCompositeOperation='lighter';
  const expansion=1-Math.exp(-elapsed/115);
  for(let i=0;i<11;i++){
   const a=i*2.399,d=(i===0?0:10+seed(i+8)*20)*expansion*power,
    x=p.x+Math.cos(a)*d,y=p.y+Math.sin(a)*d*.65-elapsed*.018;
   const radius=(15+seed(i+18)*15+expansion*15)*power;
   const fire=ctx.createRadialGradient(x,y,0,x,y,radius);
   fire.addColorStop(0,`rgba(255,248,210,${heat*.82})`);
   fire.addColorStop(.21,`rgba(255,211,100,${heat*.8})`);
   fire.addColorStop(.55,`rgba(255,106,24,${heat*.66})`);
   fire.addColorStop(.82,`rgba(213,48,7,${heat*.35})`);fire.addColorStop(1,'rgba(128,20,2,0)');
   ctx.fillStyle=fire;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
  }
  const radius=(24+36*(1-flash))*power,core=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,radius);
  core.addColorStop(0,`rgba(255,255,246,${flash*(reduced?.35:.95)})`);
  core.addColorStop(.35,`rgba(255,238,183,${flash*.7})`);core.addColorStop(1,'rgba(255,158,54,0)');
  ctx.fillStyle=core;ctx.fillRect(p.x-radius,p.y-radius,radius*2,radius*2);
  ctx.globalCompositeOperation='source-over';
 }
 // Scintille e schegge metalliche: traiettorie diverse, peso e caduta.
 const count=legendary?62:46;
 for(let i=0;i<count;i++){
  const life=.47+seed(i+70)*.65;if(seconds>life)continue;
  const a=i*2.399,speed=(65+seed(i+100)*135)*power/unit;
  const direction=new Vector3(Math.cos(a),.28+seed(i+200)*.85,Math.sin(a));
  const position=origin.clone().addScaledVector(direction,speed*seconds);
  position.y-=2.3*seconds*seconds;
  const q=worldPointToBoard(position,camera),fade=Math.pow(1-seconds/life,1.2);
  ctx.globalAlpha=fade;
  if(i%3){
   const tail=position.clone().addScaledVector(direction,-speed*.034),end=worldPointToBoard(tail,camera);
   ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(end.x,end.y);
   ctx.strokeStyle=i%5===0&&legendary?'#bdedff':i%2?'#ffeab0':'#ff9e3c';ctx.lineWidth=i%4===0?2:1.2;ctx.stroke();
  }else{
   ctx.save();ctx.translate(q.x,q.y);ctx.rotate(a+seconds*(i%2?7:-9));
   const size=(2+seed(i+300)*3)*power;
   ctx.fillStyle=i%2?'#a8b6c5':'#d6c1a1';ctx.beginPath();ctx.moveTo(-size,-size*.45);
   ctx.lineTo(size*.8,-size*.65);ctx.lineTo(size,size*.45);ctx.lineTo(-size*.6,size*.6);ctx.closePath();ctx.fill();
   ctx.strokeStyle='#ffd997';ctx.lineWidth=.65;ctx.stroke();ctx.restore();
  }
 }
 // La Leggendaria frantuma otticamente la gabbia prismatica attorno al boom.
 if(legendary&&elapsed<520){
  ctx.globalAlpha=(1-elapsed/520)*.8;ctx.lineWidth=1.5;
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,d=(30+elapsed*.105)*power;
   ctx.strokeStyle=i%2?'#bdeeff':'#d9bcff';ctx.beginPath();
   ctx.moveTo(p.x+Math.cos(a)*d,p.y+Math.sin(a)*d*.58);
   ctx.lineTo(p.x+Math.cos(a+.08)*(d+17),p.y+Math.sin(a+.08)*(d+17)*.58);ctx.stroke();
  }
 }
 ctx.restore();
 return elapsed<95?'flash':elapsed<480?'fireball':'smoke';
}
