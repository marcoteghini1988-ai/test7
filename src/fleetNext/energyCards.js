// Dieci Carte Energia giocabili. Immagini definitive da creare dopo il codice.
// Si acquistano e si inseriscono tra le generiche del mazzo da 40.
// Ogni carta vale UNA carica: le abilità richiedono da 1 a 4 carte accumulate.
import {FLEET_ELEMENTS} from './elementalAffinities.js';
export const ENERGY_CAPACITY=4;
export const ENERGY_COPIES_PER_DECK=4;
export const ENERGY_CARDS=Object.freeze(Object.values(FLEET_ELEMENTS).map((element)=> {
 const elementId=Object.keys(FLEET_ELEMENTS).find(id=>FLEET_ELEMENTS[id]===element);
 const effectText='Accumula 1 Energia '+element.name+' (massimo 4 cariche totali). Alimenta l’abilità speciale della navicella.';
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
