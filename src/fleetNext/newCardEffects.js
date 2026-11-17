// Motore comune delle nuove 33 carte. Solo regole, nessuna grafica.
// Effetti disponibili con hp-sync-v2; valori provvisori, bilanciamento finale separato.
import {HP_SYNC_RULESET} from './hpSynchronization.js';

const clamp=(n,low,high)=>Math.max(low,Math.min(high,Number(n)||0));
const BY_TIER=Object.freeze({
 command:Object.freeze([15,20,30,40]),
 weapons:Object.freeze([1,1,2,2]),
 generator:Object.freeze([1,1,2,2]),
 bridge:Object.freeze([1,1,2,2])
});
export const TEMP_WEAPON_DURATION=Object.freeze({
 'prog-machine-striker':1,'prog-machine-guard':2
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
  return {effect:previous,replaced:false};
 side.systemCardEffects=side.systemCardEffects.filter(e=>e.system!==s.system||e.operation!==s.operation);
 side.systemCardEffects.push(effect);
 return {effect,replaced:true};
}
export function expireSystemCards(side,ply){
 side.systemCardEffects=(side.systemCardEffects||[]).filter(e=>e.untilPly>ply);
 if(side.systemCardCounters?.ply!==ply)side.systemCardCounters={ply,generatorUsed:0};
}
export function generatorAdjustment(side,ply=0){
 const effect=activeSystemCard(side,'generator','amplify',ply);
 const sabotage=activeSystemCard(side,'generator','disable',ply);
 const uses=Math.max(effect?.tier===4?2:effect?1:0,sabotage?.tier===2||sabotage?.tier===4?2:sabotage?1:0);
 side.systemCardCounters??={ply,generatorUsed:0};
 if(side.systemCardCounters.ply!==ply)side.systemCardCounters={ply,generatorUsed:0};
 if(side.systemCardCounters.generatorUsed>=uses)return 0;
 side.systemCardCounters.generatorUsed++;
 return (effect?.amount||0)-(sabotage?.amount||0);
}
export function arsenalBonus(side,machine,ply=0){
 if(side.ruleset!==HP_SYNC_RULESET)return machine.power||0;
 if(machine.untilPly!=null&&machine.untilPly<=ply)return 0;
 const amplified=activeSystemCard(side,'weapons','amplify',ply);
 const disabled=activeSystemCard(side,'weapons','disable',ply);
 // L'effetto leggendario impedisce l'uso dell'arma fino alla scadenza;
 // Rara ed Epica spengono la prima arma soltanto al primo turno influenzato.
 const first=side.machines?.find(m=>m.hp>0&&!m.destroyed&&m.slot>=0);
 if(first?.id===machine.id&&disabled&&
  (disabled.tier===4||disabled.tier>=2&&
   (ply===disabled.appliedPly+1||ply===disabled.appliedPly+2)))return 0;
 return Math.max(0,(machine.power||0)+(amplified?.amount||0)-(disabled?.amount||0));
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
export function resetFieldWithBlackHole(b){
 const removed={A:[],B:[],terrain:b.terrain?.id||null};
 for(const key of ['A','B']){
  const side=b.sides[key];
  const out=removed[key];
  for(const d of side.defenses||[])if(d.id)out.push(d.id);
  if(side.commander?.id)out.push(side.commander.id);
  for(const m of Object.values(side.modules||{}))if(m?.cardId)out.push(m.cardId);
  for(const m of side.machines||[])if(m.sourceCardId)out.push(m.sourceCardId);
  side.discard??=[];side.discard.push(...out);
  side.defenses=[];side.defenseSlots=[];
  side.commander=null;side.modules={weapon:null,utility:null};side.machines=[];
  side.attackSlots=[null,null,null];side.stagedComboCards=[];
  side.protections=[];side.reactions=[];side.charges=[];side.buffs=[];
  side.systemCardEffects=[];side.synchronizationEffects=[];
  side.auroraVeil=null;
  if(side.lince)side.lince.route=null;
  if(side.prisma)side.prisma.shard=null;
  // Le navicelle, i componenti e i relativi HP non vengono toccati.
 }
 b.terrain={id:null,cardId:null,source:'neutral',expiresPly:null};
 return removed;
}
