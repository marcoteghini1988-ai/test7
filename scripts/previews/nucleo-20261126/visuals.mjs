// Renderer di anteprima condiviso da HTML e video; nessuna registrazione live.
import {drawScenicFlight,drawScenicContact,drawScenicPreparation} from './scenic-core.mjs';
import {stroke,glow} from '../20261126/review-visuals.mjs';
const TAU=Math.PI*2,clamp=n=>Math.max(0,Math.min(1,n));
export const TIMING={charge:880,flight:1250,impact:1150,total:4000};
export const coreOrigin=f=>({x:[88,332,170][(f.stage-1+(f.who==='B'?1:0))%3],y:f.who==='A'?835:-35});
const label=(ctx,text,x,y,size=12,color='#e5f3ff',align='left')=>{ctx.fillStyle=color;ctx.font=`600 ${size}px "Eclissi Preview",sans-serif`;ctx.textAlign=align;ctx.fillText(text,x,y);};
function circle(ctx,x,y,r,color,width=1,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();ctx.restore();}
export function drawCoreFlight(ctx,f,elapsed,from,to){
 return drawScenicFlight(ctx,f,elapsed,from,to,TIMING.flight);
}
function impact(ctx,f,ms,p){return drawScenicContact(ctx,f,ms,p,TIMING.impact);}
function ship(ctx,image,p,size,{pose=0,ms=0,enemy=false,light=0}={}){
 ctx.save();ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(p.x,p.y+size*.18,size*.35,size*.10,0,0,TAU);ctx.fill();
 const ry=p.y+(enemy?-1:1)*size*.24;
 glow(ctx,{x:p.x,y:ry},9+Math.sin(ms*.013)*2,'#73bdff',.30);
 glow(ctx,{x:p.x,y:ry+(enemy?-1:1)*(8+Math.sin(ms*.018)*2)},5,'#b4f0ff',.45);
 ctx.translate(p.x,p.y);ctx.rotate(Math.sin(ms*.028)*pose*.068);ctx.scale(1,1-pose*.045);ctx.filter=`brightness(${1+light})`;
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
 const move=(defender==='B'?-1:1)*kick*(9+f.currentStage*3.6);
 for(const who of ['B','A']){
  const id=before.sides[who].ships[0].id,p={...positions[who]};if(who===defender&&f.targetKind!=='escort')p.y+=move;
  const targetMother=who===defender&&f.targetKind!=='escort';
  ship(ctx,assets.hulls[who+':'+id],p,130,{enemy:who==='B',ms:reducedMotion?0:ms,pose:targetMother?kick:0,light:targetMother&&!f.blocked&&hitAge>=0?Math.exp(-hitAge/135)*.85:0});
  if(before.sides[who].escorts.length)for(const [i,e]of before.sides[who].escorts.entries()){
   const ep={x:i?322:128,y:who==='B'?335:507};if(who===defender&&e.id===f.targetId)ep.y+=move;
   ship(ctx,assets.hulls[who+':'+e.shipModelId],ep,91,{enemy:who==='B',ms:reducedMotion?0:ms,pose:who===defender&&e.id===f.targetId?kick:0});
  }
 }
 const contact={...target,y:target.y+move};
 resources(ctx,f,ms,assets,reducedMotion);
 if(!reducedMotion)drawScenicPreparation(ctx,f,ms,coreOrigin(f),TIMING.charge);
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
