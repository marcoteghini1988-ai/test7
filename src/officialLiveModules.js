// Bridge Moduli 16F -> duello LIVE. Conserva inventari, livelli, HP e
// definizioni originali; non attiva poteri dai soli equipaggiamenti.
import {TACTICAL_MODULE_CARDS,activateTacticalModuleCards,isModuleCard} from './tacticalEquipmentCards.js';
import {pvpTerrainEffects} from './pvpTerrainCards.js';
import {liveLegacyOnNumericRecycle} from './officialLiveLegacyCards.js';
const DIRECT=new Set([
 'pure_hit','healing','free_swap','refill','execution','module_lock',
 'life_drain','guard','ether_gain','boost_focus','dice_charge',
 'ammo_refill','boost_siphon','shield_and_ether','clear_malus','singularity','prevent_skip',
 'hand_jam','burn'
]);
// Scorpione applica -20% ai colpi numerici NATIVI del prossimo turno,
// senza rompere le firme dei vitali (distruzione diretta). Io/Ophiuchus
// armano la prossima salva reale: il calore rende +3 il colpo seguente.
// prevent_skip neutralizza i disturbi Malus/Modulo del prossimo turno.
export function supportedLiveModule(type){
 return isModuleCard(type)&&DIRECT.has(TACTICAL_MODULE_CARDS[type].effect);
}
export const initialLiveModuleEffects=()=>({A:{guard:0,escortBoost:0,lockUntilTurn:0,debuffShieldUntilTurn:0,precisionUntilTurn:0,precisionFactor:1,burnCharges:0},
 B:{guard:0,escortBoost:0,lockUntilTurn:0,debuffShieldUntilTurn:0,precisionUntilTurn:0,precisionFactor:1,burnCharges:0}});
function report(b,key,message,kind='module',info={}){
 b.lastEvents=[...b.lastEvents.slice(-24),key+': '+message];
 b.history.push({turn:b.turn,by:key,kind,message:key+': '+message,...info});
}
function validRecycles(side,indices,limit){
 return Array.isArray(indices)&&indices.length>0&&indices.length<=limit&&
  new Set(indices).size===indices.length&&
  indices.every(i=>Number.isInteger(i)&&i>=0&&i<side.numeric.hand.length);
}
// Helpers condivisi con la carta Ricambio: pesca dal mazzo AUTENTICO.
// Le carte selezionate vengono scartate, mai duplicate.
export function replaceLiveModuleNumerics(b,key,indices){
 const pile=b.sides[key].numeric;
 const removed=[...indices].sort((a,c)=>c-a).map(index=>pile.hand.splice(index,1)[0]);
 pile.discard.push(...removed);
 liveLegacyOnNumericRecycle(b,key,removed);
 while(pile.hand.length<7){
  if(!pile.deck.length){
   if(!pile.discard.length)break;
   pile.deck=pile.discard.splice(0);
  }
  pile.hand.push(pile.deck.shift());
 }
 report(b,key,'Ricambio Modulo: '+removed.length+' numeriche autentiche sostituite',
  'module_recycle',{count:removed.length});
}
export function playOfficialLiveModule(b,key,type,choice={}){
 if(!supportedLiveModule(type))return {ok:false,reason:'module_pending_migration'};
 const side=b.sides[key],rule=TACTICAL_MODULE_CARDS[type];
 const level=side.equipmentLevels?.[type];
 if(!Number.isInteger(level)||level<1||level>9)
  return {ok:false,reason:'module_unowned'};
 const limit=rule.effect==='free_swap'?1:rule.effect==='refill'?2:0;
 if(limit&&!validRecycles(side,choice.recycleIndices,limit))
  return {ok:false,reason:'recycle_selection_required'};
 if(rule.effect==='ammo_refill'&&!side.escorts.some(e=>e.hp>0))
  return {ok:false,reason:'module_needs_escort'};
 if(rule.effect==='clear_malus'&&!b.liveLegacy.malus[key]&&
  !(b.liveModuleEffects[key].lockUntilTurn>=b.turn))
  return {ok:false,reason:'module_no_debuff'};
 const played={A:key==='A'?[type]:[],B:key==='B'?[type]:[]};
 const logs=[];
 const result=activateTacticalModuleCards(b.sides,played,logs,
  {round:b.round,pvpTerrain:pvpTerrainEffects(b.activeTerrain,b.round)});
 const current=result.activations.find(a=>a.by===key&&a.type===type);
 if(!current)return {ok:false,reason:'module_activation_failed'};
 const own=b.liveModuleEffects[key],foe=b.liveModuleEffects[key==='A'?'B':'A'];
 const effect=result.effects[key],otherEffect=result.effects[key==='A'?'B':'A'];
 if(effect.guard)own.guard+=effect.guard;
 if(effect.escortBoost)own.escortBoost+=effect.escortBoost;
 if(otherEffect.lockWeapon){
  if(foe.debuffShieldUntilTurn>=b.turn)
   report(b,key,'Disturbo armamenti neutralizzato dal Modulo di protezione','module_blocked');
  else foe.lockUntilTurn=b.turn+1;
 }
 if(otherEffect.precisionFactor){
  if(foe.debuffShieldUntilTurn>=b.turn)
   report(b,key,'Disturbo precisione neutralizzato dal Modulo di protezione','module_blocked');
  else {foe.precisionFactor=otherEffect.precisionFactor;foe.precisionUntilTurn=b.turn+1;}
 }
 if(effect.burn)own.burnCharges+=1;
 if(effect.preventMalus){
  b.liveLegacy.malus[key]=null;own.lockUntilTurn=0;
  own.precisionUntilTurn=0;own.precisionFactor=1;
  if(rule.effect==='prevent_skip')own.debuffShieldUntilTurn=b.turn+1;
 }
 if(limit)replaceLiveModuleNumerics(b,key,choice.recycleIndices);
 report(b,key,'Carta Modulo '+rule.name+' L'+level+' · '+rule.effect+
  (current.actual?' · '+current.actual+' effettivi':''),
  'module',{type,effect:rule.effect,level,actual:current.actual});
 return {ok:true,actual:current.actual,effect:rule.effect};
}
