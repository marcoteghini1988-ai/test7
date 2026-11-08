// Visual playback is a PURE projection of an already resolved duel cycle.
// The authoritative damage/KO are calculated exclusively by simultaneousDuelEngine.
// Projectile animation NEVER applies damage or creates additional hits.
import {weaponEffect} from './mathWeaponEffects.js';
import {TACTICAL_SPECIALS,TACTICAL_TIMING} from './simultaneousDuelEngine.js';
import {SIGNATURE_MUTATION_CARD_ID} from './tacticalSignatureMutation.js';
import {VITAL_LABELS} from './vitalDefense.js';

export const TACTICAL_STAGES=Object.freeze({
  tactical:1500,gunfire:4500,barrier:5700,precision:7300,finished:TACTICAL_TIMING.resolveMs
});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function tacticalPlaybackStage(elapsedMs){
 if(elapsedMs<TACTICAL_STAGES.tactical)return {id:'tactical',label:'CARTE TATTICHE'};
 if(elapsedMs<TACTICAL_STAGES.gunfire)return {id:'gunfire',label:'ARMI ORIGINALI IN FUOCO'};
 if(elapsedMs<TACTICAL_STAGES.barrier)return {id:'barrier',label:'IMPATTI SULLE BARRIERE'};
 if(elapsedMs<TACTICAL_STAGES.precision)return {id:'precision',label:'ATTACCHI AI SISTEMI VITALI'};
 return {id:'finished',label:'RISULTATO DELLO SCONTRO'};
}
export function tacticalPlaybackElapsed(battle,nowMs){
 return battle?.phase==='resolving'&&Number.isFinite(battle.resolveUntilMs)
  ?clamp(nowMs-(battle.resolveUntilMs-TACTICAL_TIMING.resolveMs),0,TACTICAL_TIMING.resolveMs)
  :TACTICAL_TIMING.resolveMs;
}
export function projectedCombatSides(battle,elapsedMs){
 const snapshots=battle?.history?.at(-1)?.snapshots;
 if(!snapshots||battle?.phase!=='resolving')return battle.sides;
 const snapshot=elapsedMs<1500?snapshots.before:
  elapsedMs<4500?snapshots.prepared:
  elapsedMs<6250?snapshots.afterBarrier:snapshots.afterPrecision;
 return Object.fromEntries(['A','B'].map(key=>[key,{
  ...battle.sides[key],defense:snapshot[key].defense,escorts:snapshot[key].escorts
 }]));
}
const sideLabel=key=>key==='A'?'TUA NAVE':'AVVERSARIO';
const MUTATION_OPERATORS=Object.freeze({plus:'+',minus:'−',times:'×',divide:'÷'});
export function tacticalCombatTimeline(battle){
 const cycle=battle?.history?.at(-1);
 if(!cycle)return [];
 const events=[];
 for(const by of ['A','B']){
  const side=battle.sides[by],order=cycle.orders[by];
  const dice=side.legacy?.lastDice;
  if(dice?.round===cycle.round)events.push({id:'quantum-dice-'+by,
   type:'special',by,atMs:880,durationMs:980,
   label:'DADO QUANTICO · '+dice.face.toUpperCase(),cardType:'quantum-dice'});
  for(const [slot,index] of (order?.specialIndices??[]).entries()){
   // Resolve the original card type from round history, not the refilled current hand.
   const originalType=cycle.playedSpecials?.[by]?.[slot]??null;
   if(originalType){
    const mutation=originalType===SIGNATURE_MUTATION_CARD_ID?cycle.mutations?.[by]:null;
    const label=mutation?.vitalId?
     'FIRMA RISCRITTA · '+(VITAL_LABELS[mutation.vitalId]??mutation.vitalId)+
      ' · '+(MUTATION_OPERATORS[mutation.newSignature?.op]??'?')+' '+mutation.newSignature?.target:
     (TACTICAL_SPECIALS[originalType]?.name??originalType);
    events.push({id:'special-'+by+'-'+slot,type:'special',by,atMs:350+slot*340,
     durationMs:850,label,cardType:originalType});
   }
  }
  const guns=side.weapons||[];
  for(const [wi,weapon] of guns.entries()){
   const fx=weaponEffect(weapon.id);
   // Cadence and animation are inherited from the EXISTING native weapon profile.
   // Actual native barrier packet remains calculated once by the logic engine.
   const burstCount=weapon.kind==='Accumulo'?1:3;
   for(let shot=0;shot<burstCount;shot++){
    const atMs=1890+wi*160+(by==='B'?90:0)+shot*(fx.cadenceMs*3+110);
    const durationMs=Math.max(410,Math.min(900,fx.durationMs));
    if(atMs+durationMs>4400)continue;
    events.push({id:'gun-'+by+'-'+weapon.id+'-'+shot,type:'gun',by,
     weaponId:weapon.id,weaponName:weapon.name,profile:fx.profile,color:fx.color,
     atMs,durationMs,shotIndex:shot,weaponIndex:wi,
     muzzleIndex:weapon.id==='W08'?shot%2:0});
   }
  }
 }
 for(const impact of cycle.impacts??[]){
  if(impact.kind==='escort_barrier'){
   // Only a real escort shot becomes an animation. Recharging a real
   // Accumulo weapon without firing produces no projectile at all.
   const fx=weaponEffect(impact.weaponIds?.[0]??'W01');
   events.push({id:'escort-gun-'+impact.by+'-'+impact.escortSlot,
    type:'escort_gun',by:impact.by,escortSlot:impact.escortSlot,
    weaponId:impact.weaponIds?.[0]??'W01',
    escortWeaponId:impact.escortWeaponId,weaponName:'Scudiera '+(impact.escortSlot+1),
    profile:fx.profile,color:fx.color,
    atMs:3280+(impact.by==='B'?90:0)+impact.escortSlot*160,
    durationMs:Math.max(410,Math.min(900,fx.durationMs))});
   events.push({id:'escort-barrier-'+impact.by+'-'+impact.escortSlot,
    type:'escort_barrier',by:impact.by,
    atMs:5040+(impact.by==='B'?75:0),durationMs:650,
    damage:impact.damage,intercepted:impact.intercepted,
    label:impact.damage>0?'-'+impact.damage+' BARRIERA · SCUDIERA':
     impact.intercepted?'SCUDIERA INTERCETTATA':'SCUDIERA · NESSUN DANNO'});
  }
  if(impact.kind==='barrier'){
   events.push({id:'barrier-'+impact.by,type:'barrier',by:impact.by,
    atMs:4610,durationMs:750,damage:impact.damage,intercepted:impact.intercepted,
    pilotBonus:impact.pilotBonus||0,pilotId:impact.pilotId||null,
    label:impact.damage>0?'-'+impact.damage+' BARRIERA':impact.intercepted?'INTERCETTATO':'NESSUN DANNO'});
  }
  if(impact.kind==='legacy-bomb')events.push({id:'bomb-explosion-'+impact.target,
   type:'barrier',by:impact.by,atMs:5370,durationMs:750,
   damage:impact.damage,intercepted:0,
   label:'💣 BOMBA · -'+impact.damage+' BARRIERA'});
  if(impact.kind==='precision'){
   const reason=impact.reason;
   const label=reason==='hit'?'-'+impact.damage+' '+(VITAL_LABELS[impact.target]??impact.target)+(impact.destroyed?' · KO':''):
    reason==='countered'?'CONTROMISURA ATTIVA':
    reason==='signature_mutated'?'FIRMA CAMBIATA · COLPO ANNULLATO':
    reason==='protected'?'VITALE PROTETTO':
    reason==='invalid_signature'||reason==='invalid_operation'?'COMBINAZIONE NON VALIDA':'NESSUN IMPATTO';
   events.push({id:'precision-'+impact.by,type:'precision',by:impact.by,target:impact.target,
    atMs:5860+(impact.by==='B'?90:0),durationMs:900,damage:impact.damage,
    absorbed:impact.absorbed??0,destroyed:!!impact.destroyed,reason,label});
  }
 }
 events.push({id:'outcome',type:'outcome',by:null,atMs:7370,durationMs:630,
  label:battle.winner?battle.winner==='draw'?'PAREGGIO':sideLabel(battle.winner)+' VINCE':'NUOVO CICLO'});
 return events.sort((a,b)=>a.atMs-b.atMs||a.id.localeCompare(b.id));
}
export function currentTacticalPlayback(battle,nowMs){
 const elapsedMs=tacticalPlaybackElapsed(battle,nowMs);
 const events=tacticalCombatTimeline(battle);
 return {
  elapsedMs,stage:tacticalPlaybackStage(elapsedMs),
  shots:events.filter(e=>['gun','escort_gun'].includes(e.type)&&
   elapsedMs>=e.atMs&&elapsedMs<e.atMs+e.durationMs),
  notices:events.filter(e=>!['gun','escort_gun','outcome'].includes(e.type)&&
   elapsedMs>=e.atMs&&elapsedMs<e.atMs+e.durationMs),
  outcome:events.find(e=>e.type==='outcome'&&elapsedMs>=e.atMs),
  sides:projectedCombatSides(battle,elapsedMs)
 };
}
