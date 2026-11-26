// Renderer di anteprima condiviso da HTML e video; nessuna registrazione live.
import {Vector3} from 'three';
import {createProjectileCamera,boardPointToWorld,worldPointToBoard} from '../../../src/maglioProjectile3D.js';
import {stroke,glow} from '../20261126/review-visuals.mjs';
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));
export const TIMING={charge:880,flight:1250,impact:1150,total:4000};
const camera=createProjectileCamera();
export const coreOrigin=f=>({x:[88,332,170][(f.stage-1+(f.who==='B'?1:0))%3],y:f.who==='A'?835:-35});
const label=(ctx,text,x,y,size=12,color='#e5f3ff',align='left')=>{ctx.fillStyle=color;ctx.font=`600 ${size}px "Eclissi Preview",sans-serif`;ctx.textAlign=align;ctx.fillText(text,x,y);};
function circle(ctx,x,y,r,color,width=1,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.restore();}
function ring(ctx,center,axis,radius,phase,color,alpha=1,tilt=0){
 const side=new Vector3(1,0,0).cross(axis).normalize();
 if(side.lengthSq()<.01)side.set(1,0,0);
 const up=axis.clone().cross(side).normalize();
 const points=[];
 for(let i=0;i<=72;i++){
  const a=i/72*TAU,noise=1+.035*Math.sin(i*2.9+phase*4);
  const q=center.clone().addScaledVector(side,Math.cos(a)*radius*noise)
   .addScaledVector(up,Math.sin(a)*radius*noise).addScaledVector(axis,Math.sin(a+phase)*tilt);
  points.push(worldPointToBoard(q,camera));
 }
 stroke(ctx,points,color,4,alpha*.13);stroke(ctx,points,color,1.5,alpha*.75);stroke(ctx,points,'#effcff',.55,alpha);
}
export function drawCoreFlight(ctx,f,elapsed,from,to){
 const t=elapsed/TIMING.flight;if(t<0||t>1)return;
 const a=boardPointToWorld(from,camera),b=boardPointToWorld(to,camera),axis=b.clone().sub(a).normalize();
 const center=a.clone().lerp(b,t);center.y+=.14;
 const tier=['Rara','Epica','Leggendaria'].indexOf(f.rarity),level=f.currentStage;
 const point=worldPointToBoard(center,camera),radius=.09+level*.035+tier*.006;
 // Il nucleo è un intreccio volumetrico elettrico, non una sfera metallica.
 const side=new Vector3(axis.z,0,-axis.x).normalize(),up=axis.clone().cross(side).normalize();
 for(let k=0;k<8+level*3+tier*3;k++){
  const pts=[];
  for(let j=0;j<=14;j++){
   const u=j/14,angle=u*TAU*1.4+k*2.399+elapsed*.006;
   const r=radius*.62*Math.sin(Math.PI*u)*(1+.24*Math.sin(j*2.7+k));
   const q=center.clone().addScaledVector(axis,(u-.5)*radius*1.5)
    .addScaledVector(side,Math.cos(angle)*r).addScaledVector(up,Math.sin(angle)*r);
   pts.push(worldPointToBoard(q,camera));
  }
  stroke(ctx,pts,k%3?'#8cdcff':'#ffffff',k%3?.8:1.1,.9);
 }
 for(let r=0;r<level;r++){
  const c=center.clone().addScaledVector(axis,(r-(level-1)/2)*radius*.44);
  ring(ctx,c,axis,radius*(1.8+r*.32),elapsed*.006*(r%2?-1:1)+r,
   tier===2&&r%2?'#d3b6ff':'#78ceff',.85,radius*.18);
 }
 const tail=[];
 for(let i=0;i<=24;i++){
  const q=center.clone().addScaledVector(axis,-i*radius*.18)
   .addScaledVector(side,Math.sin(i*2.71+elapsed*.027)*radius*.19*(i/24));
  tail.push(worldPointToBoard(q,camera));
 }
 stroke(ctx,tail,'#58aaff',5,.10);stroke(ctx,tail,'#b8eaff',1.1,.75);
 glow(ctx,point,7+level*1.4,'#87cfff',.55);glow(ctx,point,2,'#ffffff',.95);
}
function impact(ctx,f,ms,p){
 if(ms<0||ms>TIMING.impact)return;
 const u=ms/TIMING.impact,fade=(1-u)**2,level=f.currentStage,tier=['Rara','Epica','Leggendaria'].indexOf(f.rarity);
 if(f.blocked){
  ctx.save();ctx.globalAlpha=fade*.70;ctx.strokeStyle='#83dcff';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(p.x,p.y,29,19,0,0,TAU);ctx.stroke();ctx.restore();
  for(let i=0;i<10;i++){const a=i*TAU/10,q={x:p.x+Math.cos(a)*25,y:p.y+Math.sin(a)*15};
   stroke(ctx,[p,q],'#b1e7ff',.75,fade*.7);}
  glow(ctx,p,17,'#83dcff',Math.exp(-ms/90)*.6);return;
 }
 // Un solo contatto elettrico: le ramificazioni non sono nuovi colpi.
 ctx.save();ctx.globalCompositeOperation='lighter';
 glow(ctx,p,26+level*10,'#6ec6ff',Math.exp(-ms/180)*.92);
 for(let i=0;i<4+level;i++){
  const angle=i*2.399,spread=(7+level*2)*(1+u*2),q={x:p.x+Math.cos(angle)*spread,y:p.y+Math.sin(angle)*spread*.5};
  glow(ctx,q,9+level*4,'#a0ddff',Math.exp(-ms/150)*.68);
 }
 glow(ctx,p,8+level*3,'#ffffff',Math.exp(-ms/110)*.95);ctx.restore();
 if(ms<800){
  ctx.save();const shock=7+Math.sqrt(u)*(32+level*12);ctx.globalAlpha=(1-ms/800)*.78;
  ctx.strokeStyle='#a9eaff';ctx.lineWidth=level===3?2.3:1.3;ctx.beginPath();ctx.ellipse(p.x,p.y,shock,shock*.46,0,0,TAU);ctx.stroke();
  ctx.strokeStyle='#edfaff';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(p.x,p.y,shock-2,(shock-2)*.46,0,0,TAU);ctx.stroke();ctx.restore();
 }
 for(let i=0;i<11+level*5+tier;i++){
  const angle=i*2.399,reach=(8+u*(24+level*7))*(.65+(i%4)*.12);
  const pts=[p];for(let k=1;k<=6;k++){
   const a=angle+Math.sin(k*3.1+i+Math.floor(ms/30))*.13;
   pts.push({x:p.x+Math.cos(a)*reach*k/6,y:p.y+Math.sin(a)*reach*k/6*.60});
  }
  stroke(ctx,pts,tier===2&&i%5===0?'#e1b8ff':'#a3e3ff',i%3?1:1.7,fade);
 }
 // Le corone collassano sul medesimo punto all'ultimo stadio.
 if(level===3&&ms<420)for(let i=0;i<3;i++){
  ctx.save();ctx.globalAlpha=fade*.75;ctx.strokeStyle=i%2?'#8ad9ff':'#e7faff';ctx.lineWidth=.8;
  const r=Math.max(2,32+i*7-ms*.085);ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.54,i*.4,0,TAU);ctx.stroke();ctx.restore();
 }
 if(ms>70)for(let i=0;i<16+level*4;i++){
  const angle=i*2.41,v=18+(i%5)*8,age=ms/1000;
  const q={x:p.x+Math.cos(angle)*age*v,y:p.y+Math.sin(angle)*age*v*.60-age*8};
  stroke(ctx,[q,{x:q.x-Math.cos(angle)*4*fade,y:q.y-Math.sin(angle)*3*fade}],i%3?'#80d1ff':'#ffffff',.8,fade);
 }
}
function ship(ctx,image,p,size,{pose=0,ms=0,enemy=false,light=0}={}){
 ctx.save();ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(p.x,p.y+size*.18,size*.35,size*.10,0,0,TAU);ctx.fill();
 const ry=p.y+(enemy?-1:1)*size*.24;
 glow(ctx,{x:p.x,y:ry},9+Math.sin(ms*.013)*2,'#73bdff',.30);
 glow(ctx,{x:p.x,y:ry+(enemy?-1:1)*(8+Math.sin(ms*.018)*2)},5,'#b4f0ff',.45);
 ctx.translate(p.x,p.y);ctx.rotate(Math.sin(ms*.028)*pose*.025);ctx.filter=`brightness(${1+light})`;
 ctx.drawImage(image,-size/2,-size/2,size,size);ctx.restore();
}
function resources(ctx,f,ms,assets,reducedMotion=false){
 const y=f.who==='A'?615:150,card=assets.cards[f.cardId];
 ctx.save();const released=f.expires?clamp((ms-3350)/250):0;
 ctx.globalAlpha=1-released;ctx.drawImage(card,42-(reducedMotion?0:released*28),y+(reducedMotion?0:released*30),48,72);ctx.restore();
 if(released>.5)label(ctx,'SCARTI',66,y+78,7,'#9fb3c7','center');
 const inCharge=ms<TIMING.charge,justSpent=ms>=TIMING.charge&&ms<TIMING.charge+450;
 const before=f.energyBefore+f.freshEnergy,after=f.energyAfter;
 const count=inCharge?before:after;
 if(count||f.recharge&&justSpent){
  ctx.save();let x=355,dy=y;
 if(f.recharge&&justSpent){const t=reducedMotion?1:(ms-TIMING.charge)/450;ctx.globalAlpha=1-t;x+=t*45;dy+=t*24;}
  ctx.fillStyle='#111c2d';ctx.strokeStyle=f.recharge?'#ffe58c':'#a4b3c5';ctx.lineWidth=f.recharge?1.8:.8;
  ctx.beginPath();ctx.roundRect(x,dy,43,64,5);ctx.fill();ctx.stroke();ctx.drawImage(assets.lightning,x+11,dy+16,22,22);
  label(ctx,'ENERGIA',x+21.5,dy+10,6.5,'#f7e5ae','center');
  label(ctx,`${inCharge?before:after} CARICHE`,x+21.5,dy+56,6.2,'#e7f0ff','center');ctx.restore();
  if(f.recharge&&inCharge){glow(ctx,{x:376,y:y+30},29,'#c6ddff',reducedMotion?.25:.25+Math.sin(ms*.022)*.10);
   const origin=coreOrigin(f);stroke(ctx,[{x:376,y:y+30},{x:410,y:y+38},{x:origin.x,y:origin.y}], '#9bdbff',1,.35*clamp(ms/350));}
 }else{ctx.save();ctx.strokeStyle='#8eacc14a';ctx.setLineDash([3,3]);ctx.strokeRect(355,y,43,64);ctx.restore();label(ctx,'0 ENERGIE',376,y+35,6.5,'#a4b4c6','center');}
 if(f.mode==='blocked'){
  const p={x:355,y:330};ctx.save();ctx.globalAlpha=.9;ctx.fillStyle='#0a2239';ctx.fillRect(p.x,p.y,43,64);
  ctx.drawImage(assets.defense,p.x+7,p.y+13,29,29);ctx.restore();
  if(ms>=TIMING.charge+TIMING.flight){glow(ctx,{x:p.x+21,y:p.y+29},24,'#a1e2ff',Math.exp(-(ms-TIMING.charge-TIMING.flight)/250)*.6);}
  label(ctx,'DIFESA',p.x+21,p.y+58,6.5,'#c9ecff','center');
 }
}
export function drawCorePreview(ctx,f,ms,assets,{last=false,reducedMotion=false}={}){
 ctx.clearRect(0,0,450,800);ctx.drawImage(assets.arena,0,0,450,800);
 const positions={A:{x:225,y:570},B:{x:225,y:263}};
 const before=f.before,defender=f.who==='A'?'B':'A';
 const target=f.targetKind==='escort'?{x:128,y:defender==='B'?335:507}:positions[defender];
 const hitAge=ms-TIMING.charge-TIMING.flight;
 const kick=!reducedMotion&&!f.blocked&&hitAge>=0?(1-Math.exp(-hitAge/12))*Math.exp(-hitAge/180):0;
 const move=(defender==='B'?-1:1)*kick*(7+f.currentStage*3);
 for(const who of ['B','A']){
  const id=before.sides[who].ships[0].id,p={...positions[who]};if(who===defender&&f.targetKind!=='escort')p.y+=move;
  ship(ctx,assets.hulls[who+':'+id],p,130,{enemy:who==='B',ms:reducedMotion?0:ms,pose:who===defender?kick:0,light:who===defender&&!f.blocked&&hitAge>=0?Math.exp(-hitAge/95)*.6:0});
  if(before.sides[who].escorts.length)for(const [i,e]of before.sides[who].escorts.entries()){
   const ep={x:i?322:128,y:who==='B'?335:507};if(who===defender&&e.id===f.targetId)ep.y+=move;
   ship(ctx,assets.hulls[who+':'+e.shipModelId],ep,91,{enemy:who==='B',ms:reducedMotion?0:ms,pose:who===defender&&e.id===f.targetId?kick:0});
  }
 }
 const contact={...target,y:target.y+move};
 resources(ctx,f,ms,assets,reducedMotion);
 if(!reducedMotion)drawCoreFlight(ctx,f,ms-TIMING.charge,coreOrigin(f),target);
 impact(ctx,f,reducedMotion&&hitAge>=0?(hitAge<300?90:TIMING.impact+1):hitAge,contact);
 if(f.broken&&f.stage===2&&ms<600){for(let i=0;i<3;i++)circle(ctx,66,f.who==='A'?652:186,8+i*5,'#91d9ff',.8,(1-ms/600)*.65);}
 const top=ctx.createLinearGradient(0,0,0,138);top.addColorStop(0,'#06101cf7');top.addColorStop(1,'#06101ce8');ctx.fillStyle=top;ctx.fillRect(0,0,450,138);
 label(ctx,'ANTEPRIMA · NON ANCORA NEL GIOCO',225,17,9,'#ffdf9c','center');
 label(ctx,'NUCLEO DI FOLGORE CRESCENTE',225,40,14,'#eef6ff','center');
 const expired=f.expires&&ms>3350;
 label(ctx,expired?'TURNO SUCCESSIVO · DURATA CONCLUSA':`${f.rarity.toUpperCase()}  ·  TURNO ${f.stage} / 3`,225,63,12,'#adcdeb','center');
 const captions=f.blocked?'La Difesa intercetta il colpo':f.mode==='old-only'?'Le sole Energie precedenti non ricaricano':f.broken?(f.stage===3?'Nuova Energia conservata · crescita interrotta':'Ricarica mancata · torna al minimo'):f.recharge?'Nuova Energia: una carica consumata':'Primo colpo · nessuna Energia richiesta';
 label(ctx,captions,225,87,10.5,f.broken?'#ffd5a2':'#d9f3ff','center');
 for(let i=1;i<=3;i++){const x=183+(i-1)*42,active=!expired&&i<=f.currentStage;circle(ctx,x,113,11,active?'#9edfff':'#496079',1.2);label(ctx,String(i),x,117,10,active?'#f3fbff':'#7b90a4','center');}
 ctx.fillStyle='#07111fef';ctx.fillRect(0,708,450,92);
 label(ctx,`1 COLPO · 1 BERSAGLIO · ${f.displayedNominal} HP NOMINALI`,225,729,11,'#e8f6ff','center');
 const status=hitAge>=0?(f.blocked?'BLOCCATO · nessun danno allo scafo':`${f.actualDamage} HP effettivi · protezioni del motore`):f.recharge&&ms<TIMING.charge?'Energia → carica → lancio':f.who==='A'?'Ingresso dal bordo inferiore':'Ingresso dal bordo superiore';
 label(ctx,status,225,751,10.5,f.blocked?'#a9e4ff':'#b9d6ed','center');
 const ending=last&&ms>3180?'Fine durata al successivo turno proprio':f.broken?'La progressione non riparte in questa istanza':'Dati del motore reale · rappresentazione proposta';
 label(ctx,ending,225,775,9.5,'#92a9bd','center');
}
