// Adattatore delle Carte Speciali storiche al duello LIVE (30 secondi alternati).
// Le carte vengono pescate/consumate dal runtime: qui non si generano carte o valute.
import {damageMotherShield,restoreMotherShield,VITAL_IDS} from './vitalDefense.js';
import {pvpTerrainEffects,pvpTerrainRepairAmount} from './pvpTerrainCards.js';
import {LEGACY_DICE_CARD,LEGACY_BOMB_CARD,LEGACY_GOLD_CARD,LEGACY_MALUS_CARD,
 MALUS_CHOICES,quantumFace,initialLegacyTactics} from './tacticalLegacyEvents.js';
import {SIGNATURE_MUTATION_CARD_ID,prepareSignatureMutation} from './tacticalSignatureMutation.js';
const other=k=>k==='A'?'B':'A';
export const LIVE_LEGACY_TYPES=new Set([
 LEGACY_DICE_CARD,LEGACY_BOMB_CARD,LEGACY_GOLD_CARD,LEGACY_MALUS_CARD,SIGNATURE_MUTATION_CARD_ID
]);
export const createLiveLegacy=()=>({
 pendingBombs:{A:null,B:null},malus:{A:null,B:null},mutations:{A:null,B:null}
});
function report(b,key,message,kind,payload={}){
 b.lastEvents=[...b.lastEvents.slice(-24),key+': '+message];
 b.history.push({turn:b.turn,by:key,kind,message:key+': '+message,...payload});
}
function shieldDamage(b,key,amount){
 const r=damageMotherShield(b.sides[key].defense,amount);
 b.sides[key].defense=r.defense;
 return r.damage;
}
function detonate(b,key,why){
 const side=b.sides[key];
 if(!side.legacy?.bomb)return false;
 side.legacy.bomb=null;
 const damage=shieldDamage(b,key,8);
 report(b,key,'Numero Bomba esploso ('+why+') · '+damage+' danni barriera',
  'bomb_explosion',{damage});
 return true;
}
function disarm(b,key,why){
 const side=b.sides[key];
 if(!side.legacy?.bomb)return false;
 side.legacy.bomb=null;
 report(b,key,'Numero Bomba disinnescato ('+why+')','bomb_disarmed');
 return true;
}
export function liveLegacyOnTurnEnd(b,key){
 const bomb=b.sides[key].legacy?.bomb;
 if(bomb&&b.turn>=bomb.untilTurn)detonate(b,key,'scadenza dopo due turni del bersaglio');
 if(b.liveLegacy.malus[key]&&b.turn>=b.liveLegacy.malus[key].untilTurn)
  b.liveLegacy.malus[key]=null;
}
export function liveLegacyOnTurnStart(b,key){
 const side=b.sides[key];
 side.legacy??=initialLegacyTactics();
 const mutation=b.liveLegacy.mutations[key];
 if(mutation&&b.turn>=mutation.untilTurn){
  side.defense.parts[mutation.vitalId].signature=mutation.originalSignature;
  b.liveLegacy.mutations[key]=null;
  report(b,key,'Firma del vitale ripristinata','signature_restored',{vitalId:mutation.vitalId});
 }
 if(side.legacy.golden&&b.turn>side.legacy.golden.untilTurn)
  side.legacy.golden=null;
 const pending=b.liveLegacy.pendingBombs[key];
 if(pending){
  const card=side.numeric.hand[pending.slot];
  if(card){
   side.legacy.bomb={cardId:card.id,armedTurn:b.turn,untilTurn:b.turn+2,sender:pending.sender};
   report(b,key,'Numero Bomba sullo slot '+(pending.slot+1)+
    ' · disinnescabile con ricambio o formula valida','bomb_armed',{slot:pending.slot});
  }
  b.liveLegacy.pendingBombs[key]=null;
 }
}
export function liveLegacyOnNumericShot(b,key,card){
 const side=b.sides[key],legacy=side.legacy;
 if(legacy?.golden?.cardId===card.id){
  legacy.golden=null;
  report(b,key,'Carta Dorata consumata senza formula valida','golden_expired');
 }
 if(legacy?.bomb?.cardId===card.id)detonate(b,key,'numerica usata per sparare');
}
export function liveLegacyOnNumericDiscard(b,key,cards){
 if(b.sides[key].legacy?.bomb&&cards.some(c=>c.id===b.sides[key].legacy.bomb.cardId))
  detonate(b,key,'combinazione annullata');
 if(b.sides[key].legacy?.golden&&cards.some(c=>c.id===b.sides[key].legacy.golden.cardId))
  b.sides[key].legacy.golden=null;
}
export function liveLegacyOnNumericRecycle(b,key,cards){
 if(b.sides[key].legacy?.bomb&&cards.some(c=>c.id===b.sides[key].legacy.bomb.cardId))
  disarm(b,key,'ricambio numerico');
 if(b.sides[key].legacy?.golden&&cards.some(c=>c.id===b.sides[key].legacy.golden.cardId))
  b.sides[key].legacy.golden=null;
}
export function liveLegacySyncGain(b,key,amount){
 const own=b.sides[key],debuff=b.liveLegacy.malus[key];
 const added=Math.max(0,amount-(debuff?.id==='boost_jam'?10:0));
 own.sync=Math.min(100,own.sync+added);
}
export function liveLegacyOutgoingFactor(b,key){
 return b.liveLegacy.malus[key]?.id==='lock_weapon'?.85:1;
}
export function liveLegacyIncomingFactor(b,key){
 return b.liveLegacy.malus[key]?.id==='weak_shield'?1.10:1;
}
export function liveLegacyOnVitalFormula(b,key,operation,cards){
 const side=b.sides[key],legacy=side.legacy??initialLegacyTactics();
 side.legacy=legacy;
 if(!legacy.diceReady&&!legacy.dicePatterns.includes(operation)){
  legacy.dicePatterns.push(operation);
  if(legacy.dicePatterns.length>=3){
   legacy.diceReady=true;
   report(b,key,'Dado Quantico carico: necessaria la sua carta','dice_ready');
  }
 }
 legacy.malusCharge=Math.min(3,(legacy.malusCharge||0)+1);
 if(legacy.malusCharge===3)report(b,key,'Barra Malus carica: necessaria la sua carta','malus_ready');
 if(legacy.bomb&&cards.some(c=>c.id===legacy.bomb.cardId))
  disarm(b,key,'formula vitale completata');
 const gold=legacy.golden;
 if(gold&&cards.some(c=>c.id===gold.cardId)){
  let amount=0;
  if(gold.suit==='♥'){
   const r=restoreMotherShield(side.defense,
    pvpTerrainRepairAmount(8,pvpTerrainEffects(b.activeTerrain,b.round)));
   amount=r.repaired;side.defense=r.defense;
  }else if(gold.suit==='♦'){
   const prev=side.sync;side.sync=Math.min(100,side.sync+8);amount=side.sync-prev;
  }else if(gold.suit==='♣'){
   const escort=side.defense.parts.command.hp>0?
    side.escorts.find(e=>e.hp>0&&e.hp<e.max):null;
   if(escort){amount=Math.min(8,escort.max-escort.hp);escort.hp+=amount;}
  }else if(gold.suit==='♠')amount=shieldDamage(b,other(key),6);
  legacy.usedGoldenIds.push(gold.cardId);
  legacy.golden=null;
  report(b,key,'Carta Dorata '+gold.suit+' attivata da formula · '+amount,
   'golden',{suit:gold.suit,amount});
 }
 const terrain=pvpTerrainEffects(b.activeTerrain,b.round);
 if(terrain.syncPerCalculation)liveLegacySyncGain(b,key,terrain.syncPerCalculation);
}
export function playLiveLegacyCard(b,key,type,choice={}){
 const side=b.sides[key],foe=b.sides[other(key)],legacy=side.legacy??initialLegacyTactics();
 side.legacy=legacy;
 if(type===LEGACY_GOLD_CARD){
  const index=choice.goldenIndex;
  if(!Number.isInteger(index)||index<0||index>=side.numeric.hand.length||legacy.golden)
   return {ok:false,reason:'golden_unavailable'};
  const card=side.numeric.hand[index];
  legacy.golden={cardId:card.id,suit:card.suit,untilTurn:b.turn+2};
  report(b,key,'Dorata applicata a '+card.value+card.suit+' · bonus solo con firma valida',
   'golden_mark',{cardId:card.id});
  return {ok:true};
 }
 if(type===LEGACY_BOMB_CARD){
  const slot=choice.bombSlot;
  if(!Number.isInteger(slot)||slot<0||slot>=7)
   return {ok:false,reason:'bomb_slot_invalid'};
  b.liveLegacy.pendingBombs[other(key)]={slot,sender:key};
  report(b,key,'Numero Bomba preparato nello slot '+(slot+1)+' della prossima mano nemica',
   'bomb_placed',{slot});
  return {ok:true};
 }
 if(type===LEGACY_MALUS_CARD){
  if(legacy.malusCharge<3||!MALUS_CHOICES.some(x=>x.id===choice.malusChoice))
   return {ok:false,reason:'malus_not_ready'};
  legacy.malusCharge=0;
  b.liveLegacy.malus[other(key)]={id:choice.malusChoice,untilTurn:b.turn+1};
  report(b,key,'Barra Malus attivata: '+choice.malusChoice,'malus',{choice:choice.malusChoice});
  return {ok:true};
 }
 if(type===LEGACY_DICE_CARD){
  if(!legacy.diceReady)return {ok:false,reason:'dice_not_ready'};
  const face=quantumFace(b.seed,b.round,key);
  legacy.diceReady=false;legacy.dicePatterns=[];
  legacy.lastDice={face,round:b.round};
  if(face==='module')side.sync=Math.min(100,side.sync+10);
  else if(face==='malus')foe.legacy.malusCharge=Math.max(0,(foe.legacy.malusCharge||0)-1);
  else if(face==='heal')side.defense=restoreMotherShield(side.defense,
   pvpTerrainRepairAmount(8,pvpTerrainEffects(b.activeTerrain,b.round))).defense;
  else if(face==='ether')side.sync=Math.min(100,side.sync+8);
  else if(face==='damage')shieldDamage(b,other(key),6);
  // Polvere Stellare: animazione soltanto, mai accredito inventato.
  report(b,key,'Dado Quantico '+face+(face==='dust'?' · nessun accredito':''),
   'quantum_dice',{face});
  return {ok:true};
 }
 if(type===SIGNATURE_MUTATION_CARD_ID){
  const id=choice.vitalId;
  if(!VITAL_IDS.includes(id)||b.liveLegacy.mutations[key])
   return {ok:false,reason:'mutation_unavailable'};
  const mutation=prepareSignatureMutation(side.defense,id,b.round);
  if(!mutation.ok)return mutation;
  side.defense.parts[id].signature=mutation.newSignature;
  b.liveLegacy.mutations[key]={vitalId:id,originalSignature:mutation.originalSignature,
   untilTurn:b.turn+2};
  report(b,key,'Firma difensiva di '+id+' mutata per il prossimo turno nemico',
   'signature_mutation',{vitalId:id});
  return {ok:true};
 }
 return {ok:false,reason:'special_pending_migration'};
}
