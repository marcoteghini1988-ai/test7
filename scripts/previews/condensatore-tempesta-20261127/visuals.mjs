import {stormFramePlan,stormHullPose,STORM_TIMING} from '../../../src/stormCapacitorSpec.js';
import {drawStormCloud,drawStormContact,drawStormContributor,stormGlow} from '../../../src/stormCapacitorRenderer.js';
const TAU=Math.PI*2,other=who=>who==='A'?'B':'A';
const motherPos=who=>({x:225,y:who==='A'?546:234});
const escortPos=(who,index)=>({x:index?325:125,y:who==='A'?474:316});
const label=(ctx,text,x,y,size=10,color='#e4f4ff')=>{ctx.font=`600 ${size}px "Eclissi Preview",sans-serif`;ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,x,y);};
export const modeNames={fed:'Alimentazione regolare','skip-middle':'Turno 2 senza nuova Energia',missing:'Nessuna Energia nuova','old-only':'Solo Energie vecchie',disabled:'Arma disabilitata',defense:'Difesa bloccante'};
export function stormFormation(side,who){
 return [{unit:side.ships[0],mother:true,i:0,position:motherPos(who)},
  ...side.escorts.map((unit,i)=>({unit,mother:false,i,position:escortPos(who,i)}))]
  .filter(row=>row.mother||row.unit.hp>0&&!row.unit.destroyed);
}
export function drawStormReview(ctx,s,ms,assets,{reducedMotion=false}={}){
 const index=Math.min(s.frames.length-1,Math.floor(Math.max(0,ms)/STORM_TIMING.turnMs)),frame=s.frames[index],age=ms-index*STORM_TIMING.turnMs,
  plan=stormFramePlan(frame,s.rarity,s.who),positions={};
 ctx.clearRect(0,0,450,800);ctx.drawImage(assets.arena,0,0,450,800);
 for(const who of ['B','A']){
  const side=frame.initial.sides[who];
  for(const {unit,mother,i,position:p}of stormFormation(side,who)){
   const hits=plan.hits.filter(h=>h.who!==who&&(mother?h.targetKind!=='escort':h.targetId===unit.id));
   const pose=hits.map(h=>stormHullPose(h,age-h.impactAt,reducedMotion)).reduce((a,v)=>({dx:a.dx+v.dx,dy:a.dy+v.dy,roll:a.roll+v.roll,light:a.light+v.light}),{dx:0,dy:0,roll:0,light:0});
   const q={x:p.x+pose.dx,y:p.y+pose.dy};positions[who+':'+(mother?'mother':unit.id)]=q;
   const size=mother?137:87,img=assets.hulls[who+':'+(mother?unit.id:unit.shipModelId)];
   ctx.save();ctx.fillStyle='#0009';ctx.beginPath();ctx.ellipse(q.x,q.y+size*.25,size*.35,size*.08,0,0,TAU);ctx.fill();
   ctx.translate(q.x,q.y);ctx.rotate(pose.roll);ctx.filter=`brightness(${1+pose.light})`;ctx.drawImage(img,-size/2,-size/2,size,size);ctx.restore();
   const lost=hits.filter(h=>age>=h.impactAt).reduce((n,h)=>n+h.actualDamage,0),hp=Math.max(0,unit.hp-lost),width=mother?94:62;
   ctx.fillStyle='#071522dd';ctx.fillRect(p.x-width/2,p.y+size*.4,width,5);ctx.fillStyle=who==='A'?'#6fd5da':'#e99aaf';ctx.fillRect(p.x-width/2,p.y+size*.4,width*hp/unit.maxHp,5);
   label(ctx,`${hp} / ${unit.maxHp}`,p.x,p.y+size*.4+16,8);
   if(who===s.who&&plan.hits.length&&plan.supportIds.includes(unit.id))drawStormContributor(ctx,p,age-plan.supportAt-i*80,{support:true});
  }
 }
 const ep={x:381,y:s.who==='A'?623:155},paid=plan.energySpent>0,spent=paid&&age>=plan.energyAt;
 const showEnergy=frame.fresh||frame.initial.sides[s.who].energyPile.length||paid;
 if(showEnergy){
  const fade=spent&&age>850?Math.max(.16,1-(age-850)/500):1;
  ctx.save();ctx.globalAlpha=fade;ctx.fillStyle='#181b22';ctx.fillRect(ep.x-25,ep.y-37,50,74);ctx.strokeStyle='#dfb44c';ctx.lineWidth=1.6;ctx.strokeRect(ep.x-25,ep.y-37,50,74);
  if(assets.energy)ctx.drawImage(assets.energy,ep.x-17,ep.y-29,34,34);
  label(ctx,'LIGHTNING',ep.x,ep.y+11,6.5,'#fff0ba');label(ctx,'ENERGY',ep.x,ep.y+20,7,'#fff0ba');label(ctx,spent?'0 CHARGES':'1 CHARGE',ep.x,ep.y+31,6.2,'#f7d88c');ctx.restore();
  if(paid)drawStormContributor(ctx,ep,age-plan.energyAt);
  if(spent&&age>850&&age<1450&&!reducedMotion){const k=(age-850)/600;ctx.save();ctx.globalAlpha=(1-k)*.7;
   ctx.fillStyle='#cfb66a';ctx.fillRect(ep.x+(24-ep.x)*k-12,ep.y+(681-ep.y)*k-18,24,36);ctx.restore();}
 }
 for(const h of plan.hits){
  const defender=other(s.who),base=h.targetKind==='escort'?escortPos(defender,frame.initial.sides[defender].escorts.findIndex(e=>e.id===h.targetId)):motherPos(defender),
   p=positions[defender+':'+(h.targetKind==='escort'?h.targetId:'mother')]||base;
  drawStormCloud(ctx,h,age-h.launchAt,base,{reduced:reducedMotion});
  drawStormContact(ctx,h,age-h.impactAt,p,{reduced:reducedMotion});
  if(h.blocked){const dp={x:382,y:defender==='B'?333:473};ctx.fillStyle='#092b43';ctx.fillRect(dp.x-20,dp.y-28,40,56);
   if(assets.defense)ctx.drawImage(assets.defense,dp.x-17,dp.y-17,34,34);
   if(age>=h.impactAt&&age<h.impactAt+500)stormGlow(ctx,dp,28,'#8be1ff',Math.exp(-(age-h.impactAt)/170)*.7);
   label(ctx,'DEFENSE',dp.x,dp.y+39,7,'#b4e9ff');}
 }
 if(assets.cards[s.cardId])ctx.drawImage(assets.cards[s.cardId],23,s.who==='A'?615:137,54,81);
 if(s.expiration?.discarded&&index===2&&age>4150){label(ctx,'DURATA TERMINATA: ARMA NEGLI SCARTI',225,690,8.4,'#e4cfaa');}
 ctx.fillStyle='#06101ff5';ctx.fillRect(0,0,450,107);label(ctx,'STELLAR STORM CAPACITOR',225,26,15.5);
 label(ctx,s.rarity.toUpperCase()+` · TURNO ${frame.stage} / 3 · `+s.supportCount+' SUPPORTI',225,49,9.5,'#bbd8ef');
 const h=plan.hits[0],phase=h?(age<260?'Nuova Energia giocata':age<1100?'Energia spesa e supporti contribuenti':age<h.impactAt?'Una nube elettrica in volo':h.blocked?'La Difesa intercetta la nube':'Scarica concentrata sullo scafo'):
  plan.disabled?'Arma disabilitata: nessuna nube':'Nessuna Energia nuova: questo turno non spara';
 label(ctx,phase,225,76,10,'#ecd6a0');
 ctx.fillStyle='#06101ff5';ctx.fillRect(0,708,450,92);const reached=plan.hits.filter(h=>age>=h.impactAt),damage=reached.reduce((n,h)=>n+h.actualDamage,0);
 label(ctx,`${reached.length} CONTATTI · ${damage} HP EFFETTIVI · ${plan.energySpent} CARICA SPESA`,225,731,10.5);
 label(ctx,modeNames[s.mode],225,753,10,'#c6e0f6');
 label(ctx,'Studio dell’effetto · eventi del motore · non in partita',225,778,8.2,'#9db7ce');
}
