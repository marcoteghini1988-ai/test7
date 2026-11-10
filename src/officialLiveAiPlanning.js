// Pianificatore puro: l'IA usa soltanto carte proprie realmente in mano
// e firme pubbliche. Non consulta mano avversaria, trappole o firma mutata.
import {tacticalSignatureOperation,tacticalSignatureSlotCount}
 from './tacticalShipSignatures.js';

// Restituisce gli indici di una combinazione interamente verificabile usando
// la mano attuale e le carte gia' depositate, senza duplicazioni. La stessa
// carta potra' essere giocata soltanto rispettando il limite LIVE di 3 per turno.
export function findOfficialLiveVitalCompletion(signature,stored=[],hand=[]){
 if(!signature||!Array.isArray(stored)||!Array.isArray(hand))return null;
 const slots=tacticalSignatureSlotCount(signature);
 const available=slots-stored.length;
 if(available<=0||!hand.length)return null;
 const max=Math.min(available,hand.length);
 // Una soluzione corta prevale su una lunga: evita carte sprecate.
 // Per somme, prodotti e poker l'ordine non conta; per differenza e divisione
 // la regola originale verifica gia' le permutazioni delle carte stesse.
 for(let wanted=1;wanted<=max;wanted++){
  const selected=[];
  function pick(start){
   if(selected.length===wanted){
    return tacticalSignatureOperation(signature,[
     ...stored,...selected.map(index=>hand[index])])?[...selected]:null;
   }
   for(let i=start;i<=hand.length-(wanted-selected.length);i++){
    selected.push(i);
    const result=pick(i+1);
    selected.pop();
    if(result)return result;
   }
   return null;
  }
  const answer=pick(0);
  if(answer)return answer;
 }
 return null;
}
