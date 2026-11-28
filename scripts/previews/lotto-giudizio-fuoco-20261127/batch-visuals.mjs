import {batchFramePlan,batchHullPose,batchTurnMs} from './batch-spec.mjs';
import {drawMagmaFlight,drawPlasmaFlight,drawFireContact,drawBurnTick} from './fire-renderer.mjs';
import {drawJudgmentFlight,drawJudgmentContact,judgmentGlow} from './judgment-renderer.mjs';
const TAU=Math.PI*2,other=who=>who==='A'?'B':'A';
const motherPos=who=>({x:225,y:who==='A'?546:234});
const escortPos=(who,i)=>({x:i?325:125,y:who==='A'?474:316});
const label=(ctx,text,x,y,size=10,color='#e4f4ff')=>{ctx.font=`600 ${size}px "Eclissi Preview",sans-serif`;ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,x,y);};
export const modeNames={normal:'Risoluzione ordinaria',defense:'Contatto con la Difesa',disabled:'Arma disabilitata'};
export function drawBatchReview(ctx,s,ms,assets,{reducedMotion=false}={}){
 const index=Math.min(s.frames.length-1,Math.floor(Math.max(0,ms)/batchTurnMs(s))),frame=s.frames[index],age=ms-index*batchTurnMs(s),
  plan=batchFramePlan(frame,s),positions={};
 ctx.clearRect(0,0,450,800);ctx.drawImage(assets.arena,0,0,450,800);
 for(const who of ['B','A']){
  const side=(frame.presentationInitial||frame.initial).sides[who],rows=[{unit:side.ships[0],mother:true,i:0,p:motherPos(who)},
   ...side.escorts.map((unit,i)=>({unit,mother:false,i,p:escortPos(who,i)}))].filter(r=>r.mother||r.unit.hp>0&&!r.unit.destroyed);
  for(const {unit,mother,p}of rows){
   const hits=plan.hits.filter(h=>h.who!==who&&(mother?h.targetKind!=='escort':h.targetId===unit.id));
   const pose=hits.map(h=>batchHullPose(h,age-h.impactAt,reducedMotion)).reduce((a,v)=>({dx:a.dx+v.dx,dy:a.dy+v.dy,roll:a.roll+v.roll,light:a.light+v.light}),{dx:0,dy:0,roll:0,light:0});
   const q={x:p.x+pose.dx,y:p.y+pose.dy};positions[who+':'+(mother?'mother':unit.id)]=q;
   const size=mother?137:87,img=assets.hulls[who+':'+(mother?unit.id:unit.shipModelId)];
   ctx.save();ctx.fillStyle='#0009';ctx.beginPath();ctx.ellipse(q.x,q.y+size*.25,size*.35,size*.08,0,0,TAU);ctx.fill();
   ctx.translate(q.x,q.y);ctx.rotate(pose.roll);ctx.filter=`brightness(${1+pose.light})`;ctx.drawImage(img,-size/2,-size/2,size,size);ctx.restore();
   const loss=hits.filter(h=>age>=h.impactAt).reduce((n,h)=>n+h.actualDamage,0)+(mother?plan.burns.filter(b=>b.who===who&&age>=b.at).reduce((n,b)=>n+b.actualDamage,0):0),hp=Math.max(0,unit.hp-loss),width=mother?94:62;
   ctx.fillStyle='#071522dd';ctx.fillRect(p.x-width/2,p.y+size*.4,width,5);ctx.fillStyle=who==='A'?'#6fd5da':'#e99aaf';ctx.fillRect(p.x-width/2,p.y+size*.4,width*hp/unit.maxHp,5);
   label(ctx,`${hp} / ${unit.maxHp}`,p.x,p.y+size*.4+16,8);
  }
 }
 for(const h of plan.hits){
  const defender=other(s.who),base=h.targetKind==='escort'?escortPos(defender,frame.initial.sides[defender].escorts.findIndex(e=>e.id===h.targetId)):motherPos(defender),
   p=positions[defender+':'+(h.targetKind==='escort'?h.targetId:'mother')]||base;
  if(s.kind==='judgment'){drawJudgmentFlight(ctx,h,age-h.launchAt,base,{reduced:reducedMotion});drawJudgmentContact(ctx,h,age-h.impactAt,p,{reduced:reducedMotion});}
  else{(s.kind==='mortar'?drawMagmaFlight:drawPlasmaFlight)(ctx,h,age-h.launchAt,base,{reduced:reducedMotion,texture:assets.magma});drawFireContact(ctx,h,age-h.impactAt,p,{reduced:reducedMotion});}
  if(h.blocked){const dp={x:382,y:defender==='B'?333:473};ctx.fillStyle='#092b43';ctx.fillRect(dp.x-20,dp.y-28,40,56);
   if(assets.defense)ctx.drawImage(assets.defense,dp.x-17,dp.y-17,34,34);
   if(age>=h.impactAt&&age<h.impactAt+500)judgmentGlow(ctx,dp,28,'#8be1ff',Math.exp(-(age-h.impactAt)/170)*.7);
   label(ctx,'DEFENSE',dp.x,dp.y+39,7,'#b4e9ff');}
 }
 for(const burn of plan.burns)drawBurnTick(ctx,motherPos(burn.who),age-burn.at,s.rarity==='Leggendaria'?3:2,{reduced:reducedMotion});
 if(s.kind==='mortar'&&s.charges){const x=382,y=s.who==='A'?640:158,remaining=age>plan.energyAt?Math.max(0,frame.energyAfter.length):frame.energyBefore.length;
  if(assets.energy)ctx.drawImage(assets.energy,x-16,y-23,32,32);label(ctx,remaining+' CARICHE FUOCO',x,y+25,6.8,'#ffd59b');
  if(plan.energySpent&&Math.abs(age-plan.energyAt)<300)judgmentGlow(ctx,{x,y},24,'#ffac46',Math.max(0,1-Math.abs(age-plan.energyAt)/300)*.4);}
 if(assets.cards[s.cardId]&&(s.kind!=='incinerator'||frame.stage<=2))ctx.drawImage(assets.cards[s.cardId],s.slot?86:23,s.who==='A'?615:137,54,81);
 if(s.expiration?.discarded&&index===2&&age>3700)label(ctx,'DURATA TERMINATA: ARMA NEGLI SCARTI',225,690,8.4,'#e4cfaa');
 ctx.fillStyle='#06101ff5';ctx.fillRect(0,0,450,107);label(ctx,({judgment:'QUERVALDISSIO CANNON',mortar:'MAGMATIC MORTAR',incinerator:'SVARQUENDICA TURBINE'}[s.kind]),225,26,14);
 label(ctx,`${s.rarity.toUpperCase()} · TURNO ${frame.stage} · LATO ${s.who} · SLOT ${s.slot+1}`,225,49,9.5,'#bbd8ef');
 const h=plan.hits[0],judgmentPhase=plan.disabled?'Arma disabilitata: nessun colpo':plan.noRepeat?'Nessun altro attacco nei turni 2 e 3':
  h?(age<h.launchAt?'Un solo attacco nel turno di posa':age<h.impactAt-350?'Tre anelli elettrici in rotazione':age<h.impactAt?'Gli anelli si allineano sul bersaglio':h.blocked?'La Difesa disperde la scarica':'Una scarica concentrata sullo scafo'):'Nessun attacco';
 const phase=s.kind==='judgment'?judgmentPhase:plan.disabled?'Arma disabilitata: nessun attacco':plan.hits.length?s.kind==='mortar'?`${plan.hits.length} sfere · ${plan.energySpent} cariche Fuoco spese`:'Un getto di plasma rotante, un solo colpo':plan.burns.length?'Bruciatura residua: nessun nuovo attacco':'Nessun nuovo attacco';
 label(ctx,phase,225,76,10,'#ecd6a0');
 ctx.fillStyle='#06101ff5';ctx.fillRect(0,708,450,92);const reached=plan.hits.filter(h=>age>=h.impactAt),damage=reached.reduce((n,h)=>n+h.actualDamage,0);
 label(ctx,`${reached.length} CONTATTI · ${damage} HP DIRETTI · ${plan.energySpent} ENERGIE SPESE`,225,731,9.3);
 label(ctx,(s.kind==='judgment'?'20% HP massimi prima dei modificatori':s.kind==='mortar'?'Un colpo base + massimo due extra a pagamento':'Due colpi; Bruciatura dal primo impatto riuscito'),225,753,10,'#c6e0f6');
 label(ctx,'Studio dell’effetto · eventi del motore · non in partita',225,778,8.2,'#9db7ce');
}
