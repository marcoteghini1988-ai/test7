// Eclissi Stellare - punti 22B/25: mano speciale separata. Le carte attivano le abilità;
// nessun potere deriva automaticamente dai semi delle carte numeriche.
import {startFusion,activateTacticalCover} from './fleetManeuvers.js';

export const SPECIAL_HAND_SIZE=5;
export const SPECIAL_CARD_CATALOG=Object.freeze({
 'fusion-barrier':Object.freeze({type:'fusion-barrier',name:'Fusione Barriera',short:'BARRIERA',
   family:'fusion',mode:'barrier',description:'Aggancia una scudiera per proteggere la madre usando il suo scudo.'}),
 'fusion-strike':Object.freeze({type:'fusion-strike',name:'Fusione Assalto',short:'ASSALTO',
   family:'fusion',mode:'strike',description:'Aggancia una scudiera e potenzia il fuoco della madre contro lo scudo avversario.'}),
 'tactical-cover':Object.freeze({type:'tactical-cover',name:'Copertura Tattica',short:'COPERTURA',
   family:'defense',description:'La prima scudiera protegge la madre dal prossimo colpo consumando il proprio scudo.'})
});
const CARD_SEQUENCE=Object.freeze(Array.from({length:24},(_,i)=>({
 id:'special-'+String(i+1).padStart(2,'0'),
 type:['fusion-barrier','fusion-strike','tactical-cover'][i%3]
})));
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
export function initializeSpecialDeck(side,rng=Math.random){
 if(side.specialHand&&side.specialDeck&&side.specialDiscard)return side;
 return refillSpecialHand({...side,specialHand:[],
  specialDeck:shuffled(CARD_SEQUENCE.map(card=>({...card})),rng),specialDiscard:[],specialUses:0},rng);
}
export function specialCardDefinition(card){
 return card?SPECIAL_CARD_CATALOG[card.type]??null:null;
}
export function findFusionCardIndex(side,mode){
 return (side.specialHand||[]).findIndex(card=>specialCardDefinition(card)?.mode===mode);
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
 else return {ready:false,reason:'ability_unavailable',definition};
 return {ready:!!(action.started||action.activated),reason:action.reason,state:action.state,definition};
}
export function playSpecialCard(side,handIndex,{escortSlot}={},nowMs=Date.now(),rng=Math.random){
 const ready=specialCardReadiness(side,handIndex,escortSlot,nowMs);
 if(!ready.ready)return {played:false,reason:ready.reason,side};
 const hand=[...side.specialHand];
 const [used]=hand.splice(handIndex,1);
 const next=refillSpecialHand({...side,maneuvers:ready.state,
  specialHand:hand,specialDiscard:[...side.specialDiscard,used],
  specialUses:(side.specialUses||0)+1},rng);
 return {played:true,reason:'ok',side:next,card:used,definition:ready.definition};
}
