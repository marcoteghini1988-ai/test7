// Eclissi Stellare — modello di bilanciamento del Generatore, versione candidata.
// Nuova idea approvata: niente colpo base gratuito della madre.
// La barra si tocca una sola volta per PRENOTARE. A fine turno legge le
// Carte Energia fisiche ancora disponibili: >=4 potenzia automaticamente
// il colpo prenotato, >=2 esegue quello rapido, meno di 2 non spara.
// Le cariche energetiche delle rarita' superiori servono alle Carte Arma,
// ma una carta fisica conta SEMPRE una sola volta per la soglia del Generatore.
// L'arma puo' spendere Energia PRIMA che il Generatore scelga la soglia.
// Nessuna Carte Personaggio e' coinvolta nel bilanciamento qui.
import {ENERGY_CARD_BY_ID} from './energyCards.js';

// V0: potenze e raffreddamenti DA COLLAUDARE contro madri, supporti e Armi.
// Non inserire negli asset grafici fino alla conclusione dei test.
const profile=(quick,heavy,heavyCooldown=2)=>Object.freeze({
 quick:Object.freeze({physicalCards:2,maxHpPercent:quick,coolingOwnTurns:1}),
 heavy:Object.freeze({physicalCards:4,maxHpPercent:heavy,coolingOwnTurns:heavyCooldown})
});
export const MOTHER_GENERATOR_PROFILES=Object.freeze({
 N00:profile(15,30), // versatile
 C01:profile(18,35,3), // assalto: meno HP, attacco potente
 C02:profile(16,32), // precisione
 C03:profile(15,30), // disturbo
 R01:profile(18,35,3), // pressione
 R02:profile(13,27), // resistenza
 R04:profile(13,28), // contrattacco
 E01:profile(13,28), // controllo
 E02:profile(19,36,3), // assalto veloce
 L01:profile(16,32), // tattica
 L03:profile(12,26), // corazza
 L04:profile(15,30) // equilibrio
});
export const GENERATOR_ATTACK_THRESHOLDS=Object.freeze({quick:2,heavy:4});
export const GENERATOR_BALANCE_STATUS='TEST_ONLY_PENDING_ENGINE_INTEGRATION';

const physicalEntry=entry=>{
 const id=typeof entry==='string'?entry:entry?.id;
 const def=ENERGY_CARD_BY_ID[id];
 const remaining=typeof entry==='string'?1:Math.max(0,Math.floor(Number(entry?.remaining)||0));
 return def&&remaining>0?{id,elementId:def.elementId,remaining,charges:def.charges}:null;
};
export function physicalGeneratorEnergy(side){
 return (side?.energyPile||[]).map(physicalEntry).filter(Boolean);
}
export function generatorCardCount(side){
 return physicalGeneratorEnergy(side).length;
}
export function generatorCoolingOwnTurns(side){
 const current=Math.max(0,Math.floor(Number(side?.turnCount)||0));
 const readyAt=Math.max(0,Math.floor(Number(side?.generatorReadyAtTurn)||0));
 return Math.max(0,readyAt-current);
}
export function generatorAttackPreview(side,reserved=false){
 const mother=side?.ships?.[0],profile=MOTHER_GENERATOR_PROFILES[mother?.id];
 if(!mother||!profile)return Object.freeze({ready:false,reason:'unknown-mother'});
 const cooling=generatorCoolingOwnTurns(side);
 const physicalCards=generatorCardCount(side);
 const tier=physicalCards>=4?'heavy':physicalCards>=2?'quick':null;
 if(cooling>0)return Object.freeze({ready:false,reason:'cooling',cooling,physicalCards,tier:null});
 if(!tier)return Object.freeze({ready:false,reason:'charging',cooling:0,physicalCards,tier:null});
 if(!reserved)return Object.freeze({ready:false,reason:'not-reserved',cooling:0,physicalCards,tier});
 const chosen=profile[tier];
 return Object.freeze({ready:true,reason:'reserved',cooling:0,physicalCards,tier,
  physicalCardsCost:chosen.physicalCards,
  coolingOwnTurns:chosen.coolingOwnTurns,
  // La potenza e' un numero di HP nominali proprio della nave, da stampare
  // SOLO dopo il bilanciamento. Il ruolo e' dato dal profilo della madre.
  nominalDamage:Math.max(1,Math.round(mother.maxHp*chosen.maxHpPercent/100))});
}
// Il Generatore sceglie il minor consumo di cariche disponibili per non
// sacrificare carte di rarita' alta quando le Comuni bastano. Il risultato
// e' deterministico: nessun menu e nessun ulteriore clic.
export function spendGeneratorPhysicalCards(side,count){
 if(!side||!Number.isInteger(count)||count<2||
  generatorCardCount(side)<count)return null;
 const source=side.energyPile||[];
 const sorted=source.map((entry,index)=>({index,parsed:physicalEntry(entry)}))
  .filter(e=>e.parsed).sort((a,b)=>
   a.parsed.remaining-b.parsed.remaining||a.index-b.index);
 const selected=sorted.slice(0,count);
 const removed=selected.map(e=>e.parsed.id);
 side.elementalCharges??={};side.discard??=[];
 for(const e of [...selected].sort((a,b)=>b.index-a.index)){
  const {parsed,index}=e;
  const before=Math.max(0,Number(side.elementalCharges[parsed.elementId])||0);
  const after=Math.max(0,before-parsed.remaining);
  if(after)side.elementalCharges[parsed.elementId]=after;
  else delete side.elementalCharges[parsed.elementId];
  source.splice(index,1);
 }
 side.discard.push(...removed);
 return Object.freeze({count:removed.length,spentIds:Object.freeze(removed)});
}
export function commitGeneratorFiring(side,preview){
 if(!side||preview?.ready!==true||!['quick','heavy'].includes(preview.tier))
  return null;
 // Ricontrolla la soglia al rilascio dopo le Carte Arma: niente attacco
 // gratuito con Carte Energia gia' consumate.
 const actual=generatorAttackPreview(side,true);
 if(!actual.ready)return null;
 const spent=spendGeneratorPhysicalCards(side,actual.physicalCardsCost);
 if(!spent)return null;
 side.generatorReadyAtTurn=(side.turnCount||0)+actual.coolingOwnTurns+1;
 return Object.freeze({...actual,spent});
}
