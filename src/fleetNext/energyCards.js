// Eclissi Stellare: dieci elementi di Energia in quattro rarità.
// Ogni carta FISICA rimane nell'unica pila (senza limite) fino al consumo
// dell'ultima carica. L'ottenimento delle rarità superiori è da progettare.
import {FLEET_ELEMENTS} from './elementalAffinities.js';
export const ENERGY_CAPACITY=Number.POSITIVE_INFINITY; // capienza della pila illimitata
export const ENERGY_SPECIAL_MAX_COST=4; // costo massimo della singola Speciale, NON capacità
export const ENERGY_COPIES_PER_DECK=4;
export const ENERGY_RARITIES=Object.freeze(['Comune','Rara','Epica','Leggendaria']);
export const ENERGY_CHARGES_BY_RARITY=Object.freeze({Comune:1,Rara:2,Epica:3,Leggendaria:4});
export const ENERGY_RARITY_SUFFIX=Object.freeze({Comune:'',Rara:'-r',Epica:'-e',Leggendaria:'-l'});
export const ENERGY_ELEMENT_COUNT=Object.keys(FLEET_ELEMENTS).length;
export const energyIdForRarity=(elementId,rarity)=>FLEET_ELEMENTS[elementId]&&
 Object.hasOwn(ENERGY_RARITY_SUFFIX,rarity)?'energy-'+elementId+ENERGY_RARITY_SUFFIX[rarity]:null;
export const energyCardDescription=(elementName,charges)=>
 'Aggiungi '+charges+(charges===1?' carica':' cariche')+' Energia '+elementName+
 ' alla pila unica senza limite. La carta resta nella pila fino al consumo dell\'ultima carica; solo allora va negli scarti. Alimenta Speciali e Armi compatibili.';
export const ENERGY_CARDS=Object.freeze(Object.entries(FLEET_ELEMENTS).flatMap(([elementId,element])=>
 ENERGY_RARITIES.map(rarity=>{
  const charges=ENERGY_CHARGES_BY_RARITY[rarity];
  const id=energyIdForRarity(elementId,rarity);
  const effectText=energyCardDescription(element.name,charges);
  return Object.freeze({
   id,name:'Energia '+element.name,nome:'Energia '+element.name,
   rarita:rarity,rarity,charges,energyCharges:charges,
   categoria:'Energia',category:'Energia',sottotipo:'Carica elementale',
   kind:'support',playable:true,nativeFace:true,maxCopiesPerDeck:ENERGY_COPIES_PER_DECK,
   elementId,visualKey:element.vfx,visualSymbol:element.symbol,
   effectSpec:Object.freeze({type:'energy',elementId,charges}),
   effetto:effectText,effectProposed:effectText,
   acquisitionPending:rarity!=='Comune',
   status:'executable-no-final-art'
  });
 }))
);
export const ENERGY_CARD_BY_ID=Object.freeze(Object.fromEntries(ENERGY_CARDS.map(c=>[c.id,c])));
export const ENERGY_BASE_CARDS=Object.freeze(ENERGY_CARDS.filter(c=>c.rarita==='Comune'));
export const ENERGY_CARD_COUNT=ENERGY_CARDS.length;
export const isEnergyCard=id=>Object.hasOwn(ENERGY_CARD_BY_ID,id);
if(ENERGY_ELEMENT_COUNT!==10||ENERGY_CARD_COUNT!==40||
 ENERGY_BASE_CARDS.length!==10||new Set(ENERGY_CARDS.map(c=>c.id)).size!==40||
 ENERGY_CARDS.some(c=>!Number.isInteger(c.charges)||c.charges<1||c.charges>4))
 throw Error('Quaranta Carte Energia, dieci per ogni rarità, obbligatorie');
