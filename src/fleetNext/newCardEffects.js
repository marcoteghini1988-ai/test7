// Motore comune delle nuove 33 carte. Solo regole, nessuna grafica.
// Effetti disponibili con hp-sync-v2; valori provvisori, bilanciamento finale separato.
import {HP_SYNC_RULESET,activeSynchronizationPenalty} from './hpSynchronization.js';
import {cancelAllDismantle} from './dismantleEffects.js';
import {arsenalTierRate,hasBalancedMother} from './confirmedCardBalance.js';
import {supportWeaponCardBoost} from './supportAbilities.js';

const clamp=(n,low,high)=>Math.max(low,Math.min(high,Number(n)||0));
const BY_TIER=Object.freeze({
 command:Object.freeze([15,20,30,40]),
 weapons:Object.freeze([1,1,2,2]),
 generator:Object.freeze([1,1,2,2]),
 bridge:Object.freeze([1,1,2,2])
});
export const TEMP_WEAPON_DURATION=Object.freeze({
 'weapon-memory-plasma':1,
  'weapon-sequence-1':2,'weapon-sequence-2':2,'weapon-sequence-3':1,
 });
export function activeSystemCard(side,system,operation,ply=0){
 return (side?.systemCardEffects||[]).filter(c=>c.system===system&&
  c.operation===operation&&c.untilPly>ply)
  .sort((a,b)=>b.tier-a.tier||b.untilPly-a.untilPly)[0]||null;
}
export function systemCardStrength(side,system,ply=0){
 const up=activeSystemCard(side,system,'amplify',ply);
 const down=activeSystemCard(side,system,'disable',ply);
 return (up?.amount||0)-(down?.amount||0);
}
export function applySystemCard(side,def,ply,who='A'){
 if(side.ruleset!==HP_SYNC_RULESET)throw Error('Richiesta modalità HP');
 const s=def.effectSpec;
 if(!BY_TIER[s.system])throw Error('Sistema non riconosciuto');
 if(!['disable','amplify'].includes(s.operation))throw Error('Operazione non valida');
 const tier=clamp(s.tier||1,1,4);
 const amount=BY_TIER[s.system][tier-1];
 const effect={
  id:def.id,system:s.system,operation:s.operation,
  tier,amount,appliedPly:ply,untilPly:ply+2*s.turns,
  owner:who,turns:s.turns
 };
 side.systemCardEffects??=[];
 // Una seconda carta dello stesso tipo e sistema sostituisce la precedente
 // solo se è più forte o se, a parità, scade dopo.
 const previous=activeSystemCard(side,s.system,s.operation,ply);
 if(previous&&(previous.tier>tier||previous.tier===tier&&previous.untilPly>=effect.untilPly))
  return {effect:previous,replaced:false,discardedPlayedCard:true};
 side.systemCardEffects=side.systemCardEffects.filter(e=>e.system!==s.system||e.operation!==s.operation);
 side.systemCardEffects.push(effect);
 return {effect,replaced:true,replacedEffect:previous||null};
}
export function expireSystemCards(side,ply){
 const expired=(side.systemCardEffects||[]).filter(e=>e.untilPly<=ply);
 side.systemCardEffects=(side.systemCardEffects||[]).filter(e=>e.untilPly>ply);
 if(side.systemCardCounters?.ply!==ply)side.systemCardCounters={ply,generatorUsed:0,commandGuardUsed:0,planciaRestrictedUsed:0,planciaSplitUsed:0};
 return expired;
}
export function generatorAdjustment(side,ply=0){
 const effect=activeSystemCard(side,'generator','amplify',ply);
 const sabotage=activeSystemCard(side,'generator','disable',ply);
 const uses=Math.max(effect?.tier===4?2:effect?1:0,sabotage?.tier===2||sabotage?.tier===4?2:sabotage?1:0);
 side.systemCardCounters??={ply,generatorUsed:0,commandGuardUsed:0,planciaRestrictedUsed:0,planciaSplitUsed:0};
 if(side.systemCardCounters.ply!==ply)side.systemCardCounters={ply,generatorUsed:0,commandGuardUsed:0,planciaRestrictedUsed:0,planciaSplitUsed:0};
 if(side.systemCardCounters.generatorUsed>=uses)return 0;
 side.systemCardCounters.generatorUsed++;
 return (effect?.amount||0)-(sabotage?.amount||0);
}
// La carica legge esclusivamente gli scarti del proprietario. Le carte in mano,
// quelle appena giocate e gli scarti nemici non contribuiscono.
export function discardWeaponCharge(side,machine,roleForCard){
 if(machine?.damageMode!=='discard-attacks')return null;
 const discard=Array.isArray(side?.discard)?side.discard:[];
 const attackCards=discard.reduce((n,id)=>n+(roleForCard(id)==='attack'?1:0),0);
 const energyMatched=discard.includes('energy-'+machine.weaponElementId);
 const multiplier=energyMatched?machine.energyMultiplier:1;
 const rawDamage=machine.baseDamage+attackCards*machine.perDiscardAttack;
 return {attackCards,energyMatched,multiplier,rawDamage,damage:rawDamage*multiplier,
  elementId:machine.weaponElementId};
}
// Solo il passaggio nel proprio turno immediatamente successivo conserva la catena.
export function sequenceUpgradeTarget(side,def,ply=0){
 const stage=def?.effectSpec?.damageMode==='sequence'?def.effectSpec.sequenceStage:0;
 if(stage!==2&&stage!==3)return null;
 return (side?.machines||[]).find(m=>m.damageMode==='sequence'&&m.sequenceStage===stage-1&&
  m.sequenceEligible===true&&m.sequenceEnteredPly===ply-2&&m.untilPly>ply&&
  m.hp>0&&!m.destroyed&&m.slot>=0&&m.slot<2)||null;
}
export function supportWeaponCharge(side,machine,roleForCard){
 const old=discardWeaponCharge(side,machine,roleForCard);
 if(old)return {...old,mode:'discard-attacks'};
 if(machine?.damageMode==='escort-count'){
  const slots=new Set((side?.escorts||[]).filter(e=>e.hp>0&&!e.destroyed&&!e.reserve&&
   Number.isInteger(e.slot)&&e.slot>=0&&e.slot<2).map(e=>e.slot));
  return {mode:'escort-count',supportCount:slots.size,
   damage:(machine.baseDamage||0)+slots.size*(machine.perEscort||0),
   elementId:machine.weaponElementId};
 }
 if(machine?.damageMode==='sequence'){
  const stage=machine.sequenceStage||1;
  const chained=stage>=2&&machine.sequenceEligible===true;
  return {mode:'sequence',stage,chained,damage:chained?machine.chainDamage:machine.soloDamage,
   elementId:machine.weaponElementId};
 }
 return null;
}
export function arsenalBonus(side,machine,ply=0,overridePower=null){
 if(side.ruleset!==HP_SYNC_RULESET)return machine.power||0;
 if(machine.untilPly!=null&&machine.untilPly<=ply)return 0;
 const amplified=activeSystemCard(side,'weapons','amplify',ply);
 const disabled=activeSystemCard(side,'weapons','disable',ply);
 // L'effetto leggendario impedisce l'uso dell'arma fino alla scadenza;
 // Rara ed Epica spengono la prima arma soltanto al primo turno influenzato.
 const first=side.machines?.find(m=>m.hp>0&&!m.destroyed&&m.slot>=0);
 if(first?.id===machine.id&&disabled&&
  (disabled.tier===4||disabled.tier>=2&&
   (ply===disabled.appliedPly||ply===disabled.appliedPly+1)))return 0;
 const base=overridePower??machine.power??0;
 // Le armi confermate hanno danni in decine/centinaia di HP:
 // il modificatore dell'Arsenale agisce in percentuale solo nelle partite con rarita'.
 if(hasBalancedMother(side?.ships?.[0])&&
  ['discard-attacks','sequence','escort-count','base-shot','polarity-shot'].includes(machine.damageMode)){
  const boost=supportWeaponCardBoost(side,base,ply);
  const multiplier=1+arsenalTierRate(amplified?.tier)-arsenalTierRate(disabled?.tier);
  return Math.max(0,Math.round(boost*multiplier));
 }
 return Math.max(0,base+(amplified?.amount||0)-(disabled?.amount||0));
}
// Le versioni Epica e Leggendaria interrompono i bonus sincronizzati
// solo al primo turno del bersaglio. La Centralina Leggendaria alleata
// neutralizza una sospensione, senza aumentare il numero di attivazioni.
export function commandPassiveSuspensions(side,ply=0){
 const sabotage=activeSystemCard(side,'command','disable',ply);
 if(!sabotage||sabotage.tier<3||ply!==sabotage.appliedPly+1)return 0;
 const prevention=activeSystemCard(side,'command','amplify',ply);
 const suspended=sabotage.tier===4?2:1;
 return Math.max(0,suspended-(prevention?.tier===4?1:0));
}
export function supportDamageGuard(side,ply=0){
 const buff=activeSystemCard(side,'command','amplify',ply);
 const sabotage=activeSystemCard(side,'command','disable',ply);
 if(!buff||buff.amount<=(sabotage?.amount||0))return 0;
 return buff.tier>=3?2:1;
}
export function planciaRestriction(side,ply=0){
 const sabotage=activeSystemCard(side,'bridge','disable',ply);
 const amplify=activeSystemCard(side,'bridge','amplify',ply);
 return sabotage&&(!amplify||sabotage.tier>amplify.tier)?
  {limit:1,groups:sabotage.tier>=3?2:1}:null;
}
export function planciaSplitAvailable(side,ply=0){
 const buff=activeSystemCard(side,'bridge','amplify',ply);
 const sabotage=activeSystemCard(side,'bridge','disable',ply);
 return !!buff&&(!sabotage||buff.tier>=sabotage.tier);
}
export function planciaSplitCount(side,ply=0){
 return planciaSplitAvailable(side,ply)?activeSystemCard(side,'bridge','amplify',ply).tier>=3?2:1:0;
}

export function commandPenalty(side,ply=0){
 const legacy=activeSynchronizationPenalty(side,ply);
 const sabotage=activeSystemCard(side,'command','disable',ply)?.amount||0;
 const amplification=activeSystemCard(side,'command','amplify',ply)?.amount||0;
 return clamp(Math.max(legacy,sabotage)-amplification,0,100);
}
function counters(side,ply){
 if(!side.systemCardCounters||side.systemCardCounters.ply!==ply)
  side.systemCardCounters={ply,generatorUsed:0,commandGuardUsed:0,planciaRestrictedUsed:0,planciaSplitUsed:0};
 return side.systemCardCounters;
}
export function consumeCommandGuard(side,ply=0){
 const c=counters(side,ply);
 if(c.commandGuardUsed>=1)return 0;
 const amount=supportDamageGuard(side,ply);
 if(amount)c.commandGuardUsed++;
 return amount;
}
export function consumePlanciaRestriction(side,ply=0){
 const effect=planciaRestriction(side,ply);
 if(!effect)return false;
 const c=counters(side,ply);
 if(c.planciaRestrictedUsed>=effect.groups)return false;
 c.planciaRestrictedUsed++;
 return true;
}
export function consumePlanciaSplit(side,ply=0){
 const count=planciaSplitCount(side,ply);
 if(!count)return false;
 const c=counters(side,ply);
 if(c.planciaSplitUsed>=count)return false;
 c.planciaSplitUsed++;
 return true;
}
export function expireTemporaryWeapons(side,ply=0){
 if(side.ruleset!==HP_SYNC_RULESET)return [];
 const removed=(side.machines||[]).filter(m=>m.untilPly!=null&&m.untilPly<=ply);
 for(const m of removed)if(m.sourceCardId&&!m.cardDiscarded)side.discard.push(m.sourceCardId);
 side.machines=(side.machines||[]).filter(m=>!removed.includes(m));
 return removed;
}
export function resetFieldWithBlackHole(b){
 const removed={A:[],B:[],terrain:b.terrain?.id||null};
 let terrain=b.terrain;
 while(terrain?.id){
  if(terrain.cardId&&['A','B'].includes(terrain.owner))removed[terrain.owner].push(terrain.cardId);
  terrain=terrain.underlying||null;
 }
 for(const key of ['A','B']){
  const side=b.sides[key];
  const out=removed[key];
  for(const d of side.defenses||[])if(d.id)out.push(d.id);
  if(side.commander?.id)out.push(side.commander.id);
  for(const m of Object.values(side.modules||{}))if(m?.cardId)out.push(m.cardId);
  for(const m of side.machines||[])if(m.sourceCardId&&!m.cardDiscarded)out.push(m.sourceCardId);
  // Un attacco preparato è una carta fisicamente sul tavolo: Buco Nero
  // la scarta prima che possa essere rilasciata nel turno successivo.
  if(side.falco?.pending?.cardId)out.push(side.falco.pending.cardId);
  if(side.obsidian?.pending?.cardId)out.push(side.obsidian.pending.cardId);
  const dismantled=cancelAllDismantle(side,b.ply);
  for(const m of dismantled.held)if(m.cardId)out.push(m.cardId);
  for(const effect of dismantled.cancelled){
   const owner=['A','B'].includes(effect.owner)?effect.owner:key;
   removed[owner].push(effect.id);
  }
  for(const effect of side.systemCardEffects||[]){
   const owner=['A','B'].includes(effect.owner)?effect.owner:key;
   removed[owner].push(effect.id);
  }
  side.discard??=[];
  // Gli effetti lanciati dall'avversario restano di proprietà dell'avversario.
  // Le carte sono trasferite negli scarti dei rispettivi proprietari al termine del reset.
  side.defenses=[];side.defenseSlots=[];
  side.commander=null;side.modules={weapon:null,utility:null};side.machines=[];
  side.attackSlots=[null,null,null];side.stagedComboCards=[];
  side.protections=[];side.reactions=[];side.charges=[];side.buffs=[];
  side.systemCardEffects=[];side.synchronizationEffects=[];
  side.systemCardCounters=null;
  side.auroraVeil=null;
  if(side.falco)side.falco.pending=null;
  if(side.obsidian)side.obsidian.pending=null;
  if(side.lince)side.lince.route=null;
  if(side.prisma)side.prisma.shard=null;
  // Le navicelle, i componenti e i relativi HP non vengono toccati.
 }
 for(const key of ['A','B'])b.sides[key].discard.push(...removed[key]);
 b.terrain={id:null,cardId:null,source:'neutral',expiresPly:null};
 return removed;
}
