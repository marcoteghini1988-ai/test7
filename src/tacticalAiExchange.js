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

// Se una Carta Ricambio autentica consente DUE scarti, valutiamo entrambi
// gli indici con la medesima informazione pubblica. Mai eliminare prima una
// carta promettente scegliendo banalmente lo slot accanto al primo scarto.
export function chooseTacticalAiExchangeIndices(hand,visibleTargets=[],fallbackIndex=0,count=1){
 if(!Array.isArray(hand)||hand.length===0)return [];
 const size=hand.length;
 const fallback=Number.isInteger(fallbackIndex)?((fallbackIndex%size)+size)%size:0;
 const wanted=Number.isInteger(count)?Math.min(Math.max(count,0),size):1;
 if(wanted===0)return [];
 if(!Array.isArray(visibleTargets)||!visibleTargets.some(t=>t?.signature))
  return Array.from({length:wanted},(_,i)=>(fallback+i)%size);
 const held=new Set(hand.map(card=>card?.id));
 const choices=hand.map((card,index)=>{
  let score=0;
  for(const target of visibleTargets){
   if(!target?.signature||!(target.hp>0))continue;
   // Preferire il completamento di un vitale già lesionato: un colpo
   // base a 2 carte può chiuderlo solo quando restano 6 HP o meno.
   const weight=target.hp<=6?3:1;
   for(const theoretical of THEORETICAL_NUMERIC_CARDS){
    if(held.has(theoretical.id))continue;
    if(tacticalSignatureOperation(target.signature,[card,theoretical]))score+=weight;
   }
  }
  return {index,score};
 });
 choices.sort((a,b)=>a.score-b.score||
  ((a.index-fallback+size)%size)-((b.index-fallback+size)%size));
 return choices.slice(0,wanted).map(item=>item.index);
}
// Anche una numerica caricata nella scudiera viene scartata e ripescata.
// Quando il generatore avversario e' KO, questo e' un modo reale di
// ciclare il mazzo (non un ricambio gratis), ma non bisogna sacrificare
// una carta con alte chance di completare la firma dell'ultimo vitale.
export function rankTacticalAiNumericCardsForCycling(hand,visibleTargets=[],fallbackIndex=0){
 const size=Array.isArray(hand)?hand.length:0;
 if(!size)return [];
 const fallback=Number.isInteger(fallbackIndex)?((fallbackIndex%size)+size)%size:0;
 const all=chooseTacticalAiExchangeIndices(hand,visibleTargets,fallback,size);
 return all;
}
export function chooseTacticalAiExchangeIndex(hand,visibleTargets=[],fallbackIndex=0){
 return chooseTacticalAiExchangeIndices(hand,visibleTargets,fallbackIndex,1)[0]??0;
}
