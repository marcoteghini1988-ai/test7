// Eclissi Stellare - Punto 23: mano delle carte speciali indipendente.
// Il catalogo implementa SOLO le due fusioni decise. Altre carte arriveranno
// quando le loro meccaniche saranno definite, senza attribuire effetti ai semi.
import {startFusion} from './fleetManeuvers.js';

export const SPECIAL_HAND_SIZE=5;
export const SPECIAL_CARD_CATALOG=Object.freeze({
 'fusion-barrier':Object.freeze({type:'fusion-barrier',name:'Fusione Barriera',short:'BARRIERA',
   family:'fusion',mode:'barrier',description:'Aggancia una scudiera per proteggere la madre usando il suo scudo.'}),
 'fusion-strike':Object.freeze({type:'fusion-strike',name:'Fusione Assalto',short:'ASSALTO',
   family:'fusion',mode:'strike',description:'Aggancia una scudiera e potenzia il fuoco della madre contro lo scudo avversario.'})
});
const CARD_SEQUENCE=Object.freeze(Array.from({length:24},(_,i)=>({
 id:'special-'+String(i+1).padStart(2,'0'),
 type:i%2?'fusion-strike':'fusion-barrier'
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
export function playSpecialCard(side,handIndex,{escortSlot}={},nowMs=Date.now(),rng=Math.random){
 if(!Array.isArray(side?.specialHand)||!Number.isInteger(handIndex)
  ||handIndex<0||handIndex>=side.specialHand.length)
  return {played:false,reason:'card_missing',side};
 const card=side.specialHand[handIndex],definition=specialCardDefinition(card);
 if(!definition)return {played:false,reason:'unknown_card',side};
 // Each use must possess and consume the SPECIAL card: never activate fusion
 // directly with the numeric hand or a bare MANOVRE button.
 if(definition.family!=='fusion'||!side.maneuvers)
  return {played:false,reason:'ability_unavailable',side};
 const action=startFusion(side.maneuvers,side,escortSlot,definition.mode,nowMs);
 if(!action.started)return {played:false,reason:action.reason,side};
 const hand=[...side.specialHand];
 const [used]=hand.splice(handIndex,1);
 const next=refillSpecialHand({...side,maneuvers:action.state,
  specialHand:hand,specialDiscard:[...side.specialDiscard,used],
  specialUses:(side.specialUses||0)+1},rng);
 return {played:true,reason:'ok',side:next,card:used,definition};
}
