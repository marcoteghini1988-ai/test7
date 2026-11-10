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

// Una firma matematica 2/3 si puo' iniziare anche senza tutte le carte
// nella mano attuale, purché esista almeno una SECONDA numerica fisica
// nel proprio mazzo o nella mano. Per non avviare un calcolo cieco,
// privilegiare il candidato con PIU' partner disponibili (senza consultare
// l'ordine delle pescate o informazioni del nemico).
export function findOfficialLiveMathProgress(signature,stored=[],hand=[],deck=[]){
 if(!signature||!Array.isArray(stored)||!Array.isArray(hand)||
  !Array.isArray(deck)||stored.length!==0)return null;
 const options=signature.kind==='any'?signature.options||[]:[signature];
 const gates=options.filter(o=>o?.kind==='mathGate'&&
  (o.allowedCardCounts||[2,3]).includes(2));
 if(!gates.length)return null;
 let best=null,bestPartners=0;
 for(let i=0;i<hand.length;i++){
  const first=hand[i],future=[...hand.filter((_,j)=>j!==i),...deck];
  if(!first||!Number.isInteger(first.value)||!first.suit)continue;
  const partners=future.reduce((count,second)=>
   count+Number(gates.some(g=>tacticalSignatureOperation(g,[first,second])===g.op)),0);
  if(partners>bestPartners){best=i;bestPartners=partners;}
 }
 return best;
}

// Un deposito matematico diventa un vicolo cieco quando nel proprio
// mazzo e mano non esiste più alcuna combinazione 2/3 valida. Non guarda
// le carte nemiche, non inventa pescate e non scarta gli alloggiamenti
// Poker alternativi, che hanno proprie regole di completamento.
export function officialLiveMathDeadEnd(signature,stored=[],hand=[],deck=[]){
 if(!signature||!Array.isArray(stored)||!stored.length||
  !Array.isArray(hand)||!Array.isArray(deck))return false;
 const options=signature.kind==='any'?signature.options||[]:[signature];
 if(options.some(x=>x?.kind==='poker'))return false;
 const gates=options.filter(x=>x?.kind==='mathGate');
 if(!gates.length)return false;
 const pool=[...hand,...deck],cards=[...stored];
 for(const gate of gates){
  const counts=gate.allowedCardCounts||[2,3];
  if(counts.includes(cards.length)&&
    tacticalSignatureOperation(gate,cards))return false;
  if(counts.includes(cards.length+1)&&
    pool.some(c=>tacticalSignatureOperation(gate,[...cards,c])))return false;
  if(counts.includes(cards.length+2)&&cards.length+2<=3){
   for(let i=0;i<pool.length;i++){
    for(let j=i+1;j<pool.length;j++){
     if(tacticalSignatureOperation(gate,[...cards,pool[i],pool[j]]))
      return false;
    }
   }
  }
 }
 return true;
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
 if(!signature||!Array.isArray(stored)||!Array.isArray(hand)||
    !Array.isArray(deck))return null;
 // Anche le firme ufficiali con alternative Matematica/Poker possono
 // essere costruite in più turni; quelle brevi restano privilegiate
 // da findOfficialLiveVitalCompletion prima di chiamare questo helper.
 const alternatives=signature.kind==='any'?
  (signature.options||[]).filter(p=>p.kind==='poker'):[signature];
 let best=null,bestScore=-1;
 for(const pattern of alternatives){
  if(pattern.kind!=='poker')continue;
  const slots=tacticalSignatureSlotCount(pattern);
  if(slots<4||slots>5||stored.length>=slots)continue;
  for(let i=0;i<hand.length;i++){
   const chosen=[...stored,hand[i]];
   const rest=hand.filter((_,j)=>i!==j);
   if(!canCompletePoker(pattern.pattern,chosen,[...rest,...deck]))continue;
   // Favorisce i ranghi/semi già posseduti. Sulle firme con alternativa
   // matematica l'IA avvia il Poker solo se può posare almeno DUE carte
   // compatibili dalla propria mano, per non fermarsi su una carta isolata.
   const score=rest.filter((card,j)=>{
    const remaining=rest.filter((_,k)=>j!==k);
    return canCompletePoker(pattern.pattern,[...chosen,card],[...remaining,...deck]);
   }).length;
   if(signature.kind==='any'&&!stored.length&&score<1)continue;
   if(score>bestScore){best=i;bestScore=score;}
  }
 }
 return best;
}
