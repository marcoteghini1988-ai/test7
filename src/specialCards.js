// Eclissi Stellare - punti 22B/25: mano speciale separata. Le carte attivano le abilità;
// nessun potere deriva automaticamente dai semi delle carte numeriche.
import {startFusion,activateTacticalCover} from './fleetManeuvers.js';
import {armShotEffect,armedShotEffects,SHOT_RULES} from './strategicShots.js';

export const SPECIAL_HAND_SIZE=5;
export const SPECIAL_CARD_CATALOG=Object.freeze({
 'fusion-barrier':Object.freeze({type:'fusion-barrier',name:'Fusione Barriera',short:'BARRIERA',
   family:'fusion',mode:'barrier',description:'Aggancia una scudiera per proteggere la madre usando il suo scudo.'}),
 'fusion-strike':Object.freeze({type:'fusion-strike',name:'Fusione Assalto',short:'ASSALTO',
   family:'fusion',mode:'strike',description:'Aggancia una scudiera e potenzia il fuoco della madre contro lo scudo avversario.'}),
 'tactical-cover':Object.freeze({type:'tactical-cover',name:'Copertura Tattica',short:'COPERTURA',
   family:'defense',description:'La prima scudiera protegge la madre dal prossimo colpo consumando il proprio scudo.'}),
 'shot-piercing':Object.freeze({type:'shot-piercing',name:'Colpo Perforante',short:'PERFORANTE',
   family:'volley',description:'Il prossimo tiro allo scudo madre aggira parte della scorta, MAI le firme dei vitali.'}),
 'shot-ion':Object.freeze({type:'shot-ion',name:'Impulso Ionico',short:'IONICO',
   family:'volley',description:'Un colpo effettivo allo scudo madre riduce per poco tempo le intercettazioni automatiche nemiche.'}),
 'shot-corrosion':Object.freeze({type:'shot-corrosion',name:'Corrosione',short:'CORROSIONE',
   family:'volley',description:'Un colpo allo scudo madre lo indebolisce per il colpo successivo; non perfora i vitali.'})
});
export const SPECIAL_DECK_SIZE=24;
export const SPECIAL_DEFAULT_TYPES=Object.freeze(Array.from({length:SPECIAL_DECK_SIZE},(_,i)=>
 ['fusion-barrier','fusion-strike','tactical-cover','shot-piercing','shot-ion','shot-corrosion'][i%6]));
export function makeSpecialInstances(typeList=SPECIAL_DEFAULT_TYPES){
 if(!Array.isArray(typeList)||typeList.length!==SPECIAL_DECK_SIZE||
    typeList.some(type=>!Object.hasOwn(SPECIAL_CARD_CATALOG,type)))
  throw new Error('Mazzo speciale non valido');
 const copies={};
 for(const type of typeList){
  copies[type]=(copies[type]||0)+1;
  if(copies[type]>6)throw new Error('Troppe copie di una speciale');
 }
 return typeList.map((type,i)=>({id:'special-'+String(i+1).padStart(2,'0'),type}));
}
function sample01(rng){
 const value=Number(rng());
 return Number.isFinite(value)?Math.min(.999999999999,Math.max(0,value)):0;
}
function shuffled(cards,rng){
 const result=[...cards];
 for(let i=result.length-1;i>0;i--){
  const j=Math.floor(sample01(rng)*(i+1));
  [result[i],result[j]]=[result[j],result[i]];
 }
 return result;
}
// Una carta speciale usata viene sostituita immediatamente, anche se si
// sono già utilizzate altre speciali nella stessa azione di combattimento.
export function refillSpecialHand(side,rng=Math.random){
 let hand=[...(side.specialHand||[])];
 let deck=[...(side.specialDeck||[])],discard=[...(side.specialDiscard||[])];
 while(hand.length<SPECIAL_HAND_SIZE&&(deck.length||discard.length)){
  if(!deck.length){deck=shuffled(discard,rng);discard=[];}
  hand.push(deck.pop());
 }
 return {...side,specialHand:hand,specialDeck:deck,specialDiscard:discard};
}
export function initializeSpecialDeck(side,rng=Math.random,loadout=null){
 if(side.specialHand&&side.specialDeck&&side.specialDiscard)return side;
 const cards=makeSpecialInstances(loadout??SPECIAL_DEFAULT_TYPES);
 return refillSpecialHand({...side,specialHand:[],
  specialDeck:shuffled(cards,rng),specialDiscard:[],specialUses:0},rng);
}
export function specialCardDefinition(card){
 return card?SPECIAL_CARD_CATALOG[card.type]??null:null;
}
export function findFusionCardIndex(side,mode){
 return (side.specialHand||[]).findIndex(card=>specialCardDefinition(card)?.mode===mode);
}
export function findVolleyCardIndex(side,preferredTypes=['shot-piercing','shot-ion','shot-corrosion']){
 const next=armedShotEffects(side);
 return (side?.specialHand||[]).findIndex(card=>preferredTypes.includes(card?.type)&&!next.includes(card?.type));
}
export function findCoverCardIndex(side){
 return (side.specialHand||[]).findIndex(card=>card?.type==='tactical-cover');
}
export function specialCardReadiness(side,handIndex,escortSlot,nowMs=Date.now()){
 if(!Array.isArray(side?.specialHand)||!Number.isInteger(handIndex)
  ||handIndex<0||handIndex>=side.specialHand.length)
  return {ready:false,reason:'card_missing'};
 const definition=specialCardDefinition(side.specialHand[handIndex]);
 if(!definition)return {ready:false,reason:'unknown_card'};
 if(!side.maneuvers)return {ready:false,reason:'ability_unavailable',definition};
 let action;
 if(definition.family==='fusion')action=startFusion(side.maneuvers,side,escortSlot,definition.mode,nowMs);
 else if(definition.family==='defense')action=activateTacticalCover(side.maneuvers,side,escortSlot,nowMs);
 else if(definition.family==='volley'){
  const armed=armShotEffect(side,definition.type);
  return {ready:armed.armed,reason:armed.reason,definition,armedSide:armed.side};
 }else return {ready:false,reason:'ability_unavailable',definition};
 return {ready:!!(action.started||action.activated),reason:action.reason,state:action.state,definition};
}
export function playSpecialCard(side,handIndex,{escortSlot}={},nowMs=Date.now(),rng=Math.random){
 const ready=specialCardReadiness(side,handIndex,escortSlot,nowMs);
 if(!ready.ready)return {played:false,reason:ready.reason,side};
 const hand=[...side.specialHand];
 const [used]=hand.splice(handIndex,1);
 const next=refillSpecialHand({...side,...(ready.armedSide?{armedVolleyEffects:ready.armedSide.armedVolleyEffects}:{maneuvers:ready.state}),
  specialHand:hand,specialDiscard:[...side.specialDiscard,used],
  specialUses:(side.specialUses||0)+1},rng);
 return {played:true,reason:'ok',side:next,card:used,definition:ready.definition};
}
