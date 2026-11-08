// Eclissi Stellare: quattro eventi originali 16B adattati al duello 30+8.
// Nessun wallet, drop o carta numerica viene creato: i soli danni/cure
// modificano le barriere e le scudiere autentiche. Test e balance da playtest.
import {damageMotherShield,restoreMotherShield} from './vitalDefense.js';

export const LEGACY_BOMB_CARD='tactic-bomb';
export const LEGACY_MALUS_CARD='tactic-malus';
export const LEGACY_GOLD_CARD='tactic-golden';
export const LEGACY_SPECIAL_TYPES=Object.freeze([LEGACY_BOMB_CARD,LEGACY_MALUS_CARD,LEGACY_GOLD_CARD]);
export const QUANTUM_FACES=Object.freeze(['module','malus','heal','dust','ether','damage']);
export const MALUS_CHOICES=Object.freeze([
 Object.freeze({id:'lock_weapon',name:'Disturbo armamenti',help:'−15% al fuoco nativo nemico per un ciclo'}),
 Object.freeze({id:'weak_shield',name:'Scudi compromessi',help:'+10% al colpo nativo sulla barriera nemica per un ciclo'}),
 Object.freeze({id:'boost_jam',name:'Interferenza energetica',help:'−10 Sincronia guadagnata dal nemico in questo ciclo'})
]);
export const LEGACY_DICE_PATTERNS=Object.freeze(['plus','minus','times','divide','pair','trips']);
export const initialLegacyTactics=()=>({dicePatterns:[],diceReady:false,malusCharge:0,
 bomb:null,golden:null,lastDice:null,usedGoldenIds:[]});
const other=key=>key==='A'?'B':'A';
const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));
const su=card=>card?.suit;
const effectShield=(side,amount)=>{
 const result=damageMotherShield(side.defense,amount);
 side.defense=result.defense;
 return result.damage;
};
const repairShield=(side,amount)=>{
 if(side.defense.parts.shieldGenerator.hp<=0)return 0;
 const r=restoreMotherShield(side.defense,amount);
 side.defense=r.defense;
 return r.repaired;
};
export const quantumFace=(seed,round,key)=>QUANTUM_FACES[
 ((seed>>>0)+round*13+(key==='A'?17:41))%QUANTUM_FACES.length];
export function validateLegacyTactics(battle,key,order,types){
 const side=battle.sides[key],t=side.legacy??initialLegacyTactics();
 if(order.quantumRoll===true&&!t.diceReady)return {ok:false,reason:'dice_not_ready'};
 if(order.quantumRoll!=null&&typeof order.quantumRoll!=='boolean')
  return {ok:false,reason:'dice_not_ready'};
 if(types.includes(LEGACY_MALUS_CARD)){
  if(t.malusCharge<3||!MALUS_CHOICES.some(x=>x.id===order.malusChoice))
   return {ok:false,reason:'malus_not_ready'};
 }else if(order.malusChoice!=null)return {ok:false,reason:'malus_not_ready'};
 if(types.includes(LEGACY_BOMB_CARD)){
  if(!Number.isInteger(order.bombSlot)||order.bombSlot<0||order.bombSlot>=7)
   return {ok:false,reason:'bomb_slot_invalid'};
 }else if(order.bombSlot!=null)return {ok:false,reason:'bomb_slot_invalid'};
 if(types.includes(LEGACY_GOLD_CARD)){
  const i=order.goldenIndex;
  if(!Number.isInteger(i)||i<0||i>=side.numeric.hand.length||t.golden)
   return {ok:false,reason:'golden_unavailable'};
 }else if(order.goldenIndex!=null)return {ok:false,reason:'golden_unavailable'};
 return {ok:true};
}
export function prepareLegacyTactics(sides,orders,playedTypes,round,seed,log){
 const effects={A:{debuff:null,bombSlot:null},B:{debuff:null,bombSlot:null}};
 // Simultaneous: no action can read the other player's sealed order or hand.
 for(const key of ['A','B']){
  const side=sides[key],t=side.legacy??initialLegacyTactics();
  side.legacy=t;
  if(orders[key].quantumRoll&&t.diceReady){
   const face=quantumFace(seed,round,key);
   t.diceReady=false;t.dicePatterns=[];t.lastDice={face,round};
   if(face==='module')side.sync=Math.min(100,side.sync+10);
   if(face==='malus'){
    const enemy=sides[other(key)];enemy.legacy??=initialLegacyTactics();
    enemy.legacy.malusCharge=Math.max(0,enemy.legacy.malusCharge-1);
   }
   if(face==='heal')repairShield(side,8);
   if(face==='ether')side.sync=Math.min(100,side.sync+8);
   // Dust only: tactical animation, never a pretend wallet credit.
   if(face==='damage')effectShield(sides[other(key)],6);
   log.push(key+': Dado Quantico '+face+(face==='dust'?' · Polvere solo visiva, nessun accredito':''));
  }
  if(playedTypes[key].includes(LEGACY_MALUS_CARD)){
   t.malusCharge=0;
   effects[other(key)].debuff=orders[key].malusChoice;
   log.push(key+': Barra Malus consumata · '+orders[key].malusChoice);
  }
  if(playedTypes[key].includes(LEGACY_BOMB_CARD)){
   effects[key].bombSlot=orders[key].bombSlot;
   log.push(key+': Numero Bomba · bersaglio uno slot numerico nemico dopo il ripescaggio');
  }
  if(playedTypes[key].includes(LEGACY_GOLD_CARD)){
   const card=side.numeric.hand[orders[key].goldenIndex];
   t.golden={cardId:card.id,suit:card.suit,untilRound:round+1};
   log.push(key+': Carta Dorata · '+card.value+card.suit+' trasformata per massimo due cicli');
  }
 }
 return effects;
}
export function resolveLegacyTactics(sides,orders,playedTypes,valid,hitCounts,effects,round,log,impacts=[]){
 for(const key of ['A','B']){
  const side=sides[key],t=side.legacy??initialLegacyTactics(),order=orders[key];
  if(valid[key]&&!t.diceReady){
   if(!t.dicePatterns.includes(order.op))t.dicePatterns.push(order.op);
   if(t.dicePatterns.length>=3){t.diceReady=true;log.push(key+': Dado Quantico caricato · 3 formule diverse');}
  }
  if(hitCounts[key]>0){
   t.malusCharge=Math.min(3,t.malusCharge+1);
   if(t.malusCharge===3)log.push(key+': Barra Malus carica · serve una Carta Malus autentica');
  }
  const spent=order.numericIndices.map(i=>side.numeric.hand[i]?.id);
  const swapped=order.exchangeIndices.map(i=>side.numeric.hand[i]?.id);
  const escort=order.escortAmmoIndex==null?null:side.numeric.hand[order.escortAmmoIndex]?.id;
  const bomb=t.bomb;
  if(bomb&&round>=bomb.armedRound){
   let reason=null;
   if(swapped.includes(bomb.cardId))reason='disinnescata con ricambio';
   else if(spent.includes(bomb.cardId))reason=valid[key]?'disinnescata con formula valida':'detonata per formula errata';
   else if(escort===bomb.cardId)reason='detonata durante il caricamento scudiera';
   else if(round>=bomb.untilRound)reason='esplosa per scadenza';
   if(reason){
    if(reason.startsWith('detonata')||reason.startsWith('esplosa')){
     const damage=effectShield(side,8);
     impacts.push({kind:'legacy-bomb',by:other(key),target:key,damage,reason});
    }
    log.push(key+': Numero Bomba '+reason);
    t.bomb=null;
   }
  }
  const gold=t.golden;
  if(gold){
   const used=spent.includes(gold.cardId),gone=swapped.includes(gold.cardId)||escort===gold.cardId;
   if(used&&valid[key]&&!t.usedGoldenIds.includes(gold.cardId)){
    let amount=0;
    if(gold.suit==='♥')amount=repairShield(side,8);
    else if(gold.suit==='♦') {amount=8;side.sync=clamp(side.sync+8,0,100);}
    else if(gold.suit==='♣'){
     const escort=side.escorts.find(e=>e.hp>0&&e.hp<e.max);
     if(escort&&side.defense.parts.command.hp>0){amount=Math.min(8,escort.max-escort.hp);escort.hp+=amount;}
    }else if(gold.suit==='♠')amount=effectShield(sides[other(key)],6);
    t.usedGoldenIds.push(gold.cardId);
    log.push(key+': Carta Dorata '+gold.suit+' attivata da un vero calcolo · '+amount+
      (gold.suit==='♦'?' Sincronia':gold.suit==='♣'?' scudiera':gold.suit==='♥'?' barriera riparata':' danni barriera'));
    t.golden=null;
   }else if(used||gone||round>=gold.untilRound){
    t.golden=null;
    log.push(key+': Carta Dorata scaduta o consumata senza bonus');
   }
  }
 }
 // The bomb is armed only in the refilled hand, never retroactively.
 // Caller applies these placements AFTER authentic numeric draws.
}
export function armLegacyBombs(sides,effects,round,log){
 for(const key of ['A','B']){
  const plan=effects[key]?.bombSlot;
  if(plan==null)continue;
  const receiver=sides[other(key)],t=receiver.legacy??initialLegacyTactics();
  const card=receiver.numeric.hand[plan];
  if(!card)continue;
  // Only one mark per side. New marks replace, never accumulate, HP is real.
  t.bomb={cardId:card.id,armedRound:round+1,untilRound:round+2,sender:key};
  receiver.legacy=t;
  log.push(other(key)+': bomba visibile su '+card.value+card.suit+
   ' · puoi disinnescare con ricambio o formula valida, scade nel ciclo '+(round+2));
 }
}
