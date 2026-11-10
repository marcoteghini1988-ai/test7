// Abilita' offensive dei piloti nel LIVE. I vitali si distruggono
// mediante firma completata: una percentuale NON modifica quell'esplosione.
// Le formule autentiche possono invece armare un bonus per una successiva
// salva nativa autentica contro la barriera. Altre condizioni riguardano
// direttamente il colpo nativo con una vera carta numerica e speciali giocate.
import {commanderAbilityStatus,commanderAttackFactor} from './commanderAbilities.js';
import {tacticalSignatureOperation} from './tacticalShipSignatures.js';

export const LIVE_FORMULA_PILOT_TRIGGERS=Object.freeze([
 'plus','minus','times','divide','three_vital','alternate_vital',
 'mixed_triple','new_vital','alternate_operation','complex_triple',
 'red_pair','black_pair'
]);
export const LIVE_NATIVE_PILOT_TRIGGERS=Object.freeze([
 'corroded_enemy','ion_shot','recycled_shot','critical_shield','damaged_vital',
 'strained_shield','special_attack','double_special','double_status',
 'third_mother_hit','enemy_last_vital'
]);
const formulaTriggers=new Set(LIVE_FORMULA_PILOT_TRIGGERS);
const nativeTriggers=new Set(LIVE_NATIVE_PILOT_TRIGGERS);
const ratio=def=>def?.shield?.max>0?def.shield.hp/def.shield.max:1;
const ko=def=>Object.values(def?.parts||{}).filter(p=>p.hp<=0).length;
const damaged=def=>Object.values(def?.parts||{}).some(p=>p.hp<p.max);
const asLegacy=side=>({...side,fleet:[{defense:side.defense}],
 escorts:(side.escorts||[]).map(e=>({...e,defense:{destroyed:e.hp<=0}})),
 strategicStatuses:{ionizedUntil:side.ionized?1:0,
  corrodedUntil:side.corroded?1:0}});

// Da richiamare soltanto DOPO un impatto vitale realmente validato ma PRIMA
// dell'aggiornamento della memoria dell'ultimo vitale/operazione.
export function liveCommanderArmFormula(attacker,defender,{vitalId,op,cards,damage}={}){
 const ability=commanderAbilityStatus(attacker);
 if(!(damage>0)||!ability||ability.role!=='Attacco'||
   !formulaTriggers.has(ability.trigger)||!vitalId||
   tacticalSignatureOperation(defender?.defense?.parts?.[vitalId]?.signature,cards)!==op)
  return false;
 const factor=commanderAttackFactor(asLegacy(attacker),asLegacy(defender),
  {cards,op,vitalId,nowMs:0});
 if(!(factor>1))return false;
 attacker.commander.liveFormulaBonus={
  percentage:Math.round((factor-1)*100),trigger:ability.trigger,vitalId};
 return true;
}

function nativeCondition(ability,attacker,defender,shot={}){
 const c=attacker.commander||{},queue=shot.queued||{};
 const codes=Array.isArray(queue.offensiveTypes)?new Set(queue.offensiveTypes):new Set();
 switch(ability.trigger){
  case 'corroded_enemy':return defender.corroded===true;
  case 'ion_shot':return queue.ion===true&&codes.has('shot-ion');
  case 'recycled_shot':return (attacker.numeric?.recycleEvents||0)>(c.seenRecycle||0);
  case 'critical_shield':return ratio(attacker.defense)<=.35;
  case 'damaged_vital':return damaged(attacker.defense);
  case 'strained_shield':return ratio(attacker.defense)<=.60;
  case 'special_attack':return (queue.piercing===true&&codes.has('shot-piercing'))||
    (queue.corrosion===true&&codes.has('shot-corrosion'));
  case 'double_special':return codes.size>=2;
  case 'double_status':return defender.ionized===true&&defender.corroded===true;
  case 'third_mother_hit':return (c.successfulMotherHits||0)>0&&
    c.successfulMotherHits%3===2;
  case 'enemy_last_vital':return ko(defender.defense)===3;
  default:return false;
 }
}

// Lo stato "charging" dell'arma non chiama questa funzione, quindi neppure
// un'arma Accumulo puo' consumare il bonus senza lanciare un vero proiettile.
export function liveCommanderNativeBonus(attacker,defender,packet,shot={}){
 const inactive={damage:packet,active:false,percentage:0,extra:0,remainder:0};
 const ability=commanderAbilityStatus(attacker);
 if(!ability||ability.role!=='Attacco'||!Number.isSafeInteger(packet)||
   packet<=0)return inactive;
 const prepared=attacker.commander.liveFormulaBonus;
 const fromFormula=formulaTriggers.has(ability.trigger)&&
  prepared?.trigger===ability.trigger&&prepared.percentage>0;
 const fromNative=nativeTriggers.has(ability.trigger)&&
  nativeCondition(ability,attacker,defender,shot);
 if(!fromFormula&&!fromNative)return inactive;
 const percentage=fromFormula?prepared.percentage:ability.value;
 const saved=attacker.commander.bonusRemainder;
 const remainder=Number.isInteger(saved)&&saved>=0&&saved<100?saved:0;
 const points=packet*percentage+remainder;
 const extra=Math.floor(points/100);
 return {damage:packet+extra,active:true,percentage,extra,
  remainder:points%100,trigger:ability.trigger,fromFormula};
}
export function liveCommanderAfterNativeShot(attacker,damage,bonus){
 if(!(damage>0)||!bonus?.active)return false;
 attacker.commander.bonusRemainder=bonus.remainder;
 if(bonus.fromFormula)attacker.commander.liveFormulaBonus=null;
 if(bonus.trigger==='recycled_shot')
  attacker.commander.seenRecycle=attacker.numeric?.recycleEvents||0;
 return true;
}
