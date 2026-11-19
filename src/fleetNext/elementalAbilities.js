// Una e una sola abilità elementale per ognuna delle 12 madri ufficiali.
// L'abilità è una proprietà della madre, NON una undicesima carta esclusiva.
// Le Energie si ottengono solo dalle Carte Energia realmente giocate.
import {activeFleetElements,FLEET_ELEMENTS,elementalRelation} from './elementalAffinities.js';
import {ENERGY_SPECIAL_MAX_COST,ENERGY_CARD_BY_ID} from './energyCards.js';

const RAW_ABILITIES=[
 [
  "N00",
  "Blackout Ionico",
  "effect",
  "disable",
  2,
  1
 ],
 [
  "C01",
  "Lancia Solare",
  "attack",
  "salvo",
  3,
  1
 ],
 [
  "C02",
  "Scudo Prismatico",
  "effect",
  "guard",
  1,
  1
 ],
 [
  "C03",
  "Eco del Vuoto",
  "effect",
  "jam",
  2,
  1
 ],
 [
  "R01",
  "Martello Binario",
  "attack",
  "salvo",
  3,
  2
 ],
 [
  "R02",
  "Sovraccarico Manta",
  "effect",
  "disable",
  3,
  1
 ],
 [
  "R04",
  "Morso Abissale",
  "attack",
  "salvo",
  3,
  2
 ],
 [
  "E01",
  "Nebbia Gelida",
  "effect",
  "jam",
  2,
  2
 ],
 [
  "E02",
  "Tempesta a Catena",
  "attack",
  "salvo",
  3,
  2
 ],
 [
  "L01",
  "Giudizio Radiante",
  "attack",
  "salvo",
  3,
  2
 ],
 [
  "L03",
  "Impatto Ossidiana",
  "attack",
  "salvo",
  4,
  2
 ],
 [
  "L04",
  "Custodia Astrale",
  "effect",
  "heal",
  4,
  3
 ]
];
export const ELEMENTAL_ABILITIES=Object.freeze(Object.fromEntries(
 RAW_ABILITIES.map(([shipId,name,kind,mode,cost,power])=>[shipId,Object.freeze({
  shipId,name,kind,mode,cost,power,
  description:kind==='attack'?
   'Sostituisce l’attacco normale con un colpo elementale potenziato.':
   mode==='guard'?'Riduce la potenza del prossimo attacco avversario.':
   mode==='jam'?'Indebolisce il prossimo attacco avversario.':
   mode==='heal'?'Ripara gli HP della nave madre senza superare il massimo.':
   'Disattiva una scudiera nemica per il prossimo turno avversario.'
 })])
));
export const elementalAbility=shipId=>ELEMENTAL_ABILITIES[shipId]||null;
export function totalElementalEnergy(side){
 return Object.values(side?.elementalCharges||{}).reduce((n,v)=>n+Math.max(0,Math.floor(Number(v)||0)),0);
}
export const chargedElementalEnergy=(side,element)=>Math.max(0,Math.floor(Number(side?.elementalCharges?.[element])||0));
export function canChargeElementalEnergy(side,element){
 return !!side?.ships?.[0]&&activeFleetElements(side.ships[0].id,side.ships[0].level).includes(element);
}
// Le Carte Energia sono oggetti fisici nella pila condivisa del giocatore:
// rimangono fuori dagli scarti finché la relativa carica non viene consumata.
// Le eventuali cariche virtuali già prodotte dalle passive mantengono i vecchi
// conteggi senza generare carte inesistenti nella pila o negli scarti.
// Una carta Comune resta nella pila come ID storico (per i salvataggi vecchi);
// una Rara/Epica/Leggendaria resta un solo oggetto fisico da 2/3/4 cariche.
// Consumi parziali non scartano la carta: solo l'ultima carica la scarta.
export function chargeElementalEnergy(side,element,cardId='energy-'+element){
 if(!canChargeElementalEnergy(side,element))return false;
 const definition=ENERGY_CARD_BY_ID[cardId];
 if(!definition||definition.elementId!==element)return false;
 const charges=definition.charges;
 side.elementalCharges??={};
 side.energyPile??=[];
 side.elementalCharges[element]=chargedElementalEnergy(side,element)+charges;
 side.energyPile.push(charges===1?cardId:{id:cardId,elementId:element,remaining:charges});
 return true;
}
export function spendElementalEnergy(side,element,cost){
 if(!Number.isInteger(cost)||cost<1||
  chargedElementalEnergy(side,element)<cost)return false;
 side.elementalCharges[element]-=cost;
 if(side.elementalCharges[element]===0)delete side.elementalCharges[element];
 const pile=side.energyPile||[];
 let left=cost;
 for(let i=0;i<pile.length&&left>0;){
  const entry=pile[i],id=typeof entry==='string'?entry:entry?.id;
  const definition=ENERGY_CARD_BY_ID[id];
  if(!definition||definition.elementId!==element){i++;continue;}
  const remaining=typeof entry==='string'?1:Math.max(0,Math.floor(Number(entry.remaining)||0));
  if(!remaining){i++;continue;}
  const used=Math.min(left,remaining);
  left-=used;
  if(used===remaining){
   pile.splice(i,1);
   (side.discard??=[]).push(id);
  }else{
   entry.remaining=remaining-used;
   i++;
  }
 }
 // Può restare un residuo di cariche virtuali generate dalle passive:
 // non esiste una carta fisica da scartare per quelle cariche.
 return true;
}
export function elementalAbilityReadiness(side,element,extraCards=0){
 const mother=side?.ships?.[0],ability=elementalAbility(mother?.id);
 if(!mother||!ability)return 'Abilità elementale non disponibile';
 if(!activeFleetElements(mother.id,mother.level).includes(element))
  return 'Questo elemento non è ancora sbloccato sulla navicella';
 if(chargedElementalEnergy(side,element)+extraCards<ability.cost)
  return 'Energia insufficiente: servono '+ability.cost+' carte '+FLEET_ELEMENTS[element].name;
 return '';
}
export function elementalSpecialStrength(ability,attackerElement,defenderElement,mother=null){
 const relation=elementalRelation(attackerElement,defenderElement);
 const base=Math.max(1,Math.min(3,ability?.power||1));
 // Le vecchie fixture HP senza una carta-rarita conservano i valori precedenti.
 if(!Number.isFinite(mother?.defensePercent))
  return Object.freeze({relation,power:base});
 const attack=Math.max(1,Math.round(Number(mother.attackPower)||1));
 const cost=Math.max(1,Math.min(4,Number(ability.cost)||1));
 let power=base;
 if(ability.kind==='attack'){
  // Il costo in Energia paga un potenziamento proporzionale, mai un secondo sparo.
  power=Math.round(attack*(0.22+0.06*cost+0.08*base));
 }else if(ability.mode==='heal'){
  // Cura calibrata sugli HP attuali della nave, non sui vecchi 42 HP.
  power=Math.round(mother.maxHp*Math.min(.22,.12+.01*cost+.01*base));
 }else if(ability.mode==='guard'||ability.mode==='jam'){
  power=Math.round(attack*(.16+.04*cost+.04*base));
 }
 // La relazione elementale verra applicata una sola volta al colpo effettivo.
 return Object.freeze({relation,power:Math.max(base,power)});
}
if(Object.keys(ELEMENTAL_ABILITIES).length!==12||
 Object.values(ELEMENTAL_ABILITIES).some(a=>!['attack','effect'].includes(a.kind)||
 !['salvo','guard','jam','heal','disable'].includes(a.mode)||a.kind==='attack'!==(a.mode==='salvo')||
 !Number.isInteger(a.cost)||a.cost<1||a.cost>ENERGY_SPECIAL_MAX_COST||
 !Number.isInteger(a.power)||a.power<1||a.power>3))
 throw Error('Abilità elementali incomplete o senza costo valido');
