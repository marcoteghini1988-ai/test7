// Dieci Carte Energia giocabili. Immagini definitive da creare dopo il codice.
// Si acquistano e si inseriscono tra le generiche del mazzo da 40.
// Ogni carta vale UNA carica: la pila è senza limite; i costi delle Speciali restano da 1 a 4.
import {FLEET_ELEMENTS} from './elementalAffinities.js';
export const ENERGY_CAPACITY=Number.POSITIVE_INFINITY; // nessun limite alle Carte Energia nella pila
export const ENERGY_SPECIAL_MAX_COST=4; // massimo costo di una singola abilità elementale, NON capacità della pila
export const ENERGY_COPIES_PER_DECK=4;
export const ENERGY_CARDS=Object.freeze(Object.values(FLEET_ELEMENTS).map((element)=> {
 const elementId=Object.keys(FLEET_ELEMENTS).find(id=>FLEET_ELEMENTS[id]===element);
 const effectText='Aggiungi 1 Carta Energia '+element.name+' alla pila unica, senza limite di accumulo. Resta fino al consumo e solo allora va negli scarti. Alimenta le abilità speciali e le Armi compatibili.';
 return Object.freeze({
  id:'energy-'+elementId,name:'Energia '+element.name,nome:'Energia '+element.name,
  rarita:'Comune',categoria:'Energia',category:'Energia',sottotipo:'Carica elementale',
  kind:'support',playable:true,nativeFace:true,maxCopiesPerDeck:ENERGY_COPIES_PER_DECK,
  elementId,visualKey:element.vfx,visualSymbol:element.symbol,
  effectSpec:Object.freeze({type:'energy',elementId}),
  effetto:effectText,effectProposed:effectText,
  status:'executable-no-final-art'
 });
}));
export const ENERGY_CARD_BY_ID=Object.freeze(Object.fromEntries(ENERGY_CARDS.map(c=>[c.id,c])));
export const ENERGY_CARD_COUNT=ENERGY_CARDS.length;
export const isEnergyCard=id=>Object.hasOwn(ENERGY_CARD_BY_ID,id);
if(ENERGY_CARD_COUNT!==10||new Set(ENERGY_CARDS.map(c=>c.id)).size!==10)
 throw Error('Dieci Carte Energia obbligatorie');
