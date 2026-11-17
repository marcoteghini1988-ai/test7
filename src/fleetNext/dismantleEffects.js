// Smontaggio temporaneo: stato operativo separato dai salvataggi della nave.
 // Non riduce HP, non distrugge pezzi e non modifica progressione permanente.
 import {getShipProgression} from './progression.js';
 const NAMES={weapons:'Arsenale',generator:'Generatore',bridge:'Plancia',
  command:'Centralina',armor:'Corazza',fusion:'Sistema di fusione'};
 const SLOTS=['weapon','utility'];
 const isLive=x=>!!x&&x.hp>0&&!x.destroyed;
 const profile=side=>({
  current:getShipProgression(side.ships[0].id,side.ships[0].level),
  base:getShipProgression(side.ships[0].id,1)
 });
 const activeEffects=(side,ply)=>(side.dismantleEffects||[]).filter(e=>e.untilPly>ply);
 const blockedKeys=(side,ply)=>new Set(activeEffects(side,ply).flatMap(e=>e.targets||[]));
 const gradeAt=(base,index)=>index<2?(base.escortGrades[index]||0):
  (base.reserveGrades[index-2]||0);
 export function dismantleCandidates(side,ply=0,{includeBlocked=false}={}){
  if(!side?.ships?.[0])return [];
  const {current,base}=profile(side);
  if(!current||!base)return [];
  const blocked=blockedKeys(side,ply),result=[];
  const add=(key,label)=>{if((includeBlocked||!blocked.has(key))&&!result.some(x=>x.key===key))
   result.push({key,label});};
  // Oggetti realmente montati: vengono custoditi con ID e integrità identici.
  for(const slot of SLOTS){
   const m=side.modules?.[slot]||side.heldModules?.[slot];
   if(isLive(m))add('module:'+slot,'Modulo '+(m.name||slot));
  }
  // Prima i sistemi nuovi, poi i potenziamenti di quelli originali.
  for(const id of ['command','bridge','weapons','generator']){
   if(!current.vitalIds.includes(id))continue;
   const added=!base.vitalIds.includes(id);
   const upgraded=(current.integrityByPart[id]||0)>(base.integrityByPart[id]||0)||
    id==='weapons'&&current.attackPower>base.attackPower;
   if(added||upgraded)add('part:'+id,NAMES[id]+(added?' aggiunta':' potenziato'));
  }
  // Potenziamenti della corazza (modificano davvero il danno ricevuto).
  if(current.defensePower>base.defensePower)add('armor',NAMES.armor+' potenziata');
  for(const e of [...(side.escorts||[]),...(side.reserveEscorts||[])]){
   if(!isLive(e)||e.sourceIndices?.length!==1)continue;
   const index=e.sourceIndices[0],permanent=e.permanentGrade||e.grade||1;
   if(permanent>gradeAt(base,index))
    add('escort:'+index,'Supporto '+(index+1)+(gradeAt(base,index)?' potenziato':' aggiunto'));
  }
  if(current.fusionLimit>base.fusionLimit||(side.escorts||[]).some(e=>e.fused&&isLive(e)))
   add('fusion','Configurazione di fusione');
  return result;
 }
 export function syncDismantleSide(side,ply=0){
  if(!side?.ships?.[0])return;
  side.modules??={weapon:null,utility:null};
  side.heldModules??={};
  const mother=side.ships[0],{current,base}=profile(side);
  if(!current||!base)return;
  const effects=activeEffects(side,ply),blocked=blockedKeys(side,ply);
  const baseMode=effects.some(e=>e.mode==='base');
  mother.operationalLevel=baseMode?1:mother.level;
  mother.attackPower=blocked.has('part:weapons')?base.attackPower:current.attackPower;
  mother.weaponRating=Math.max(0,mother.attackPower-1);
  mother.defensePower=blocked.has('armor')?base.defensePower:current.defensePower;
  mother.dismantledUpgrades=[...blocked];
  for(const p of mother.parts){
   const affected=blocked.has('part:'+p.id);
   // Se si rimuove un singolo componente, anche la sua funzione si spegne.
   // Lo smontaggio Leggendario lascia sempre accesi i sistemi innati al L1.
   const direct=effects.some(e=>e.mode==='components'&&e.targets.includes('part:'+p.id));
   p.dismantled=affected&&(direct||!base.vitalIds.includes(p.id));
   p.upgradeSuspended=affected&&base.vitalIds.includes(p.id);
  }
  for(const slot of SLOTS){
   if(blocked.has('module:'+slot)){
    if(side.modules[slot]&&!side.heldModules[slot]){
     side.heldModules[slot]=side.modules[slot];side.modules[slot]=null;
    }
   }else if(side.heldModules[slot]){
    if(!side.modules[slot])side.modules[slot]=side.heldModules[slot];
    else side.discard.push(side.heldModules[slot].cardId);
    delete side.heldModules[slot];
   }
  }
  for(const e of [...(side.escorts||[]),...(side.reserveEscorts||[])]){
   e.permanentGrade??=e.grade||1;
   const sources=e.sourceIndices||[];
   const suppressFusion=e.fused&&blocked.has('fusion');
   const affected=sources.length===1&&blocked.has('escort:'+sources[0]);
   const baseGrade=sources.length===1?gradeAt(base,sources[0]):0;
   const forcedAbsent=effects.some(effect=>effect.mode==='components'&&
    sources.length===1&&effect.targets.includes('escort:'+sources[0]));
   e.dismantled=!!suppressFusion||!!affected&&(forcedAbsent||baseGrade===0);
   e.grade=affected&&!e.dismantled?Math.min(e.permanentGrade,baseGrade):e.permanentGrade;
  }
  side.fusionLimit=blocked.has('fusion')?0:current.fusionLimit;
 }
 export function applyDismantleCard(side,def,ply,owner='A',selected=[]){
  const s=def.effectSpec;
  const all=dismantleCandidates(side,ply,{includeBlocked:s.mode==='base'});
  const keys=all.map(c=>c.key);
  if(!keys.length)return {ok:false,reason:'La navicella non ha componenti aggiunti o potenziati disponibili'};
  let chosen;
  if(s.mode==='base')chosen=keys;
  else if(Array.isArray(selected)&&selected.length){
   if(selected.length>s.count||new Set(selected).size!==selected.length||
    selected.some(key=>!keys.includes(key)))
    return {ok:false,reason:'Componente da smontare non valido o già smontato'};
   chosen=[...selected];
  }else chosen=keys.slice(0,s.count);
  const effect={id:def.id,owner,mode:s.mode,targets:chosen,appliedPly:ply,
   untilPly:ply+2*s.turns,turns:s.turns};
  side.dismantleEffects??=[];
  side.dismantleEffects.push(effect);
  syncDismantleSide(side,ply);
  return {ok:true,effect,targets:chosen};
 }
 export function expireDismantleEffects(side,ply=0){
  const expired=(side.dismantleEffects||[]).filter(e=>e.untilPly<=ply);
  side.dismantleEffects=activeEffects(side,ply);
  syncDismantleSide(side,ply);
  return expired;
 }
 export function cancelAllDismantle(side,ply=0){
  const cancelled=[...(side.dismantleEffects||[])];
  // L'azzeramento del campo deve scartare anche i moduli rimossi
  // temporaneamente; non rimontarli al termine dello smontaggio.
  const held=Object.values(side.heldModules||{}).filter(Boolean);
  side.heldModules={};
  side.dismantleEffects=[];
  syncDismantleSide(side,ply);
  return {cancelled,held};
 }
 export function dismantleActive(side,ply=0){
  return activeEffects(side,ply).map(e=>({id:e.id,targets:[...e.targets],
   remainingTurns:Math.max(1,Math.ceil((e.untilPly-ply)/2))}));
 }
