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

// Pianificazione prudente per firme Poker LUNGHE (4–5 numeriche).
// La previsione usa soltanto il contenuto del proprio mazzo rimasto e le
// carte gia' depositate: non legge le mani avversarie e non anticipa
// l'ordine di pesca. Tutte le condizioni sono necessarie, non garanzie.
const SUITS=['♠','♥','♦','♣'];
const ROYAL=[1,10,11,12,13];
const straightTemplates=()=>{
 const sequences=Array.from({length:9},(_,i)=>Array.from({length:5},(_,j)=>i+j+1));
 sequences.push(ROYAL);
 return sequences;
};
function coversRanks(stored,pool,requirements){
 const target=new Map(requirements.map(([v,n])=>[v,n]));
 if(stored.some(c=>!target.has(c?.value)))return false;
 return [...target.entries()].every(([value,needed])=>{
  const have=stored.filter(c=>c.value===value).length;
  return have<=needed&&have+pool.filter(c=>c.value===value).length>=needed;
 });
}
function coversStraight(stored,pool,values,suit=null){
 if(stored.some(c=>!values.includes(c?.value)||(suit&&c.suit!==suit)))return false;
 if(new Set(stored.map(c=>c.value)).size!==stored.length)return false;
 return values.every(value=>
  stored.some(c=>c.value===value)||
  pool.some(c=>c?.value===value&&(!suit||c.suit===suit)));
}
function canCompletePoker(pattern,stored,pool){
 if(!stored.length||stored.some(c=>!Number.isInteger(c?.value)||!c.suit))return false;
 const ranks=Array.from({length:13},(_,i)=>i+1);
 if(pattern==='fourKind')
  return ranks.some(value=>coversRanks(stored,pool,[[value,4]]));
 if(pattern==='twoPair')
  return ranks.some((a,i)=>ranks.slice(i+1).some(b=>
   coversRanks(stored,pool,[[a,2],[b,2]])));
 if(pattern==='fullHouse')
  return ranks.some(a=>ranks.some(b=>a!==b&&
   coversRanks(stored,pool,[[a,3],[b,2]])));
 if(pattern==='flush')
  return SUITS.some(suit=>stored.every(c=>c.suit===suit)&&
   stored.length+pool.filter(c=>c.suit===suit).length>=5);
 if(pattern==='straight')
  return straightTemplates().some(values=>coversStraight(stored,pool,values));
 if(pattern==='straightFlush')
  return SUITS.some(suit=>straightTemplates().some(values=>
   coversStraight(stored,pool,values,suit)));
 if(pattern==='royalFlush')
  return SUITS.some(suit=>coversStraight(stored,pool,ROYAL,suit));
 return false;
}
export function findOfficialLiveVitalProgress(signature,stored=[],hand=[],deck=[]){
 if(signature?.kind!=='poker'||!Array.isArray(stored)||
    !Array.isArray(hand)||!Array.isArray(deck))return null;
 const slots=tacticalSignatureSlotCount(signature);
 if(slots<4||slots>5||stored.length>=slots)return null;
 let best=null,bestScore=-1;
 for(let i=0;i<hand.length;i++){
  const chosen=[...stored,hand[i]];
  const rest=hand.filter((_,j)=>i!==j);
  if(!canCompletePoker(signature.pattern,chosen,[...rest,...deck]))continue;
  // Favorisce la combinazione che puo' assorbire piu' carte GIA' in mano;
  // la disponibilita' delle altre nel mazzo non garantisce una pesca precisa.
  const score=rest.filter((card,j)=>{
   const remaining=rest.filter((_,k)=>j!==k);
   return canCompletePoker(signature.pattern,[...chosen,card],[...remaining,...deck]);
  }).length;
  if(score>bestScore){best=i;bestScore=score;}
 }
 return best;
}
