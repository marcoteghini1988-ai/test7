// Ricambio numerico dell'IA: valuta soltanto carte in mano e FIRME GIA'
// VISIBILI. Le 52 combinazioni teoriche del mazzo numerico sono note a
// entrambi i giocatori, ma non si legge l'ordine del mazzo, il pescato futuro,
// la mano avversaria o qualsiasi firma nascosta.
// Senza informazioni restano il ricambio a rotazione e le regole approvate.
import {tacticalSignatureOperation} from './tacticalShipSignatures.js';

const SUITS=Object.freeze(['♣','♦','♥','♠']);
const THEORETICAL_NUMERIC_CARDS=Object.freeze(SUITS.flatMap(suit=>
 Array.from({length:13},(_,i)=>Object.freeze({
  id:suit+(i+1),suit,value:i+1
 }))));

export function chooseTacticalAiExchangeIndex(hand,visibleTargets=[],fallbackIndex=0){
 if(!Array.isArray(hand)||hand.length===0)return 0;
 const fallback=Number.isInteger(fallbackIndex)?
  ((fallbackIndex%hand.length)+hand.length)%hand.length:0;
 if(!Array.isArray(visibleTargets)||!visibleTargets.some(t=>t?.signature))return fallback;
 const held=new Set(hand.map(card=>card?.id));
 // Per un singolo ricambio naturale valutiamo quante carte teoriche ancora
 // non in mano potrebbero COMPLETARE una coppia valida con la carta tenuta.
 // Il peso e' solo tattico (KO raggiungibile con un colpo = priorita maggiore).
 const choices=hand.map((card,index)=>{
  let score=0;
  for(const target of visibleTargets){
   if(!target?.signature||!(target.hp>0))continue;
   const weight=target.hp<=6?3:1;
   for(const theoretical of THEORETICAL_NUMERIC_CARDS){
    if(held.has(theoretical.id))continue;
    if(tacticalSignatureOperation(target.signature,[card,theoretical]))score+=weight;
   }
  }
  return {index,score};
 });
 const minimum=Math.min(...choices.map(item=>item.score));
 // A parita' di opportunita' ruota comunque gli slot (mai fisso 0).
 return choices.filter(item=>item.score===minimum)
  .sort((a,b)=>((a.index-fallback+hand.length)%hand.length)-
   ((b.index-fallback+hand.length)%hand.length))[0].index;
}
