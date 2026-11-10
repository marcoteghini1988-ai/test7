// Firme matematiche del duello simultaneo ufficiale: un profilo pubblico e stabile per
// ciascuna delle 17 madri. Sono fisse per MODELLO, non estratte a ogni scontro.
// Le firme Poker da 4/5 carte sono alternative tattiche sugli Epici/Leggendari.
// Le matematiche 2/3 carte restano possibili: nessuna campagna viene bloccata.
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {VITAL_IDS,matchesVitalSignature} from './vitalDefense.js';

// [motore, armi, generatore, centralina]. Tutti i target hanno una soluzione
// con 2 numeriche 1..13. Il Poker è un'alternativa, non un blocco obbligatorio.
// La coppia di C01/R04 preserva il test di battaglia già approvato.
const M=(op,target)=>Object.freeze({kind:'mathGate',op,target,allowedCardCounts:Object.freeze([2,3])});
const P=pattern=>Object.freeze({kind:'poker',pattern});
const A=(op,target,...patterns)=>Object.freeze({kind:'any',options:Object.freeze([
 M(op,target),...patterns.map(P)
])});
const PUBLIC_SIGNATURES=Object.freeze({
 N00:[M('plus',9),M('minus',3),M('times',12),P('pair')],
 C01:[M('times',12),M('minus',3),M('plus',9),P('pair')],
 C02:[M('plus',11),M('divide',2),M('times',12),A('minus',4,'pair')],
 C03:[M('minus',5),M('times',15),M('plus',13),A('divide',2,'pair')],
 C04:[M('times',10),M('plus',11),M('minus',6),A('times',8,'pair')],
 R01:[M('divide',3),M('times',18),M('plus',15),A('minus',4,'pair')],
 R02:[M('times',20),M('divide',2),M('minus',5),A('plus',11,'pair')],
 R03:[M('plus',12),M('minus',7),M('times',24),A('divide',3,'pair')],
 R04:[M('times',18),M('minus',3),M('plus',9),P('pair')],
 E01:[M('times',24),M('plus',13),M('divide',2),A('minus',5,'trips','twoPair')],
 E02:[M('minus',8),M('times',18),M('plus',17),A('divide',3,'pair','fourKind')],
 E03:[M('times',15),M('minus',6),M('plus',16),A('times',12,'trips','fullHouse')],
 E04:[M('plus',18),M('divide',3),M('times',21),A('minus',7,'pair','straight')],
 L01:[M('times',30),M('plus',19),M('minus',9),A('times',24,'trips','fullHouse')],
 L02:[M('divide',4),M('times',35),M('plus',21),A('minus',8,'trips','fourKind')],
 L03:[M('times',36),M('minus',10),M('divide',3),A('plus',18,'pair','flush')],
 L04:[M('plus',22),M('times',42),M('minus',11),A('divide',4,'trips','royalFlush')]
});
const keys=new Set(PHASE1_CATALOG.ships.map(s=>s.id));
if(keys.size!==17||Object.keys(PUBLIC_SIGNATURES).length!==keys.size||
 Object.keys(PUBLIC_SIGNATURES).some(id=>!keys.has(id)))
 throw new Error('Le firme tattiche devono coprire esattamente le 17 navicelle.');
export const TACTICAL_SHIP_SIGNATURES=Object.freeze(Object.fromEntries(
 Object.entries(PUBLIC_SIGNATURES).map(([shipId,profiles])=>[
  shipId,Object.freeze(Object.fromEntries(VITAL_IDS.map((id,i)=>[id,profiles[i]])))
 ])
));
export function tacticalShipSignatures(shipId){
 const signatures=TACTICAL_SHIP_SIGNATURES[shipId];
 if(!signatures)throw new Error('Firme tattiche: navicella inesistente '+shipId);
 return signatures;
}
function matchesOption(signature,operation,cards){
 if(signature.kind==='any')return signature.options.some(s=>matchesOption(s,operation,cards));
 const expected=signature.kind==='poker'?signature.pattern:signature.op;
 return expected===operation&&matchesVitalSignature(signature,cards);
}
export function tacticalSignatureMatches(signature,operation,cards){
 return !!signature&&matchesOption(signature,operation,cards);
}
export function tacticalSignatureOperation(signature,cards){
 if(!signature)return null;
 const options=signature.kind==='any'?signature.options:[signature];
 for(const option of options){
  const op=option.kind==='poker'?option.pattern:option.op;
  if(tacticalSignatureMatches(option,op,cards))return op;
 }
 return null;
}

// Numero di alloggiamenti REALI da mostrare nel pannello del bersaglio.
// Per 'any' si mostrano anche le alternative Poker lunghe, senza inventare carte.
export const POKER_SIGNATURE_COUNTS=Object.freeze({
 pair:2,trips:3,twoPair:4,fourKind:4,straight:5,flush:5,
 fullHouse:5,straightFlush:5,royalFlush:5
});
export function tacticalSignatureSlotCount(signature){
 if(!signature)return 3;
 if(signature.kind==='any')return Math.max(2,...signature.options.map(tacticalSignatureSlotCount));
 if(signature.kind==='poker')return POKER_SIGNATURE_COUNTS[signature.pattern]??3;
 if(signature.kind==='mathGate')return Math.max(2,...(signature.allowedCardCounts||[2,3]));
 if(signature.kind==='math')return (signature.ops||[]).length+1;
 return 3;
}
const POKER_NAMES=Object.freeze({pair:'COPPIA',trips:'TRIS',twoPair:'DOPPIA COPPIA',
 fourKind:'POKER',straight:'SCALA',flush:'COLORE',fullHouse:'FULL',
 straightFlush:'SCALA COLORE',royalFlush:'SCALA REALE'});
const MATH_NAMES=Object.freeze({plus:'SOMMA',minus:'DIFFERENZA',times:'PRODOTTO',divide:'DIVISIONE'});
export function tacticalSignatureLabel(signature){
 if(!signature)return 'FIRMA SCONOSCIUTA';
 if(signature.kind==='any')return signature.options.map(tacticalSignatureLabel).join(' O ');
 if(signature.kind==='poker')return POKER_NAMES[signature.pattern]||'COMBINAZIONE POKER';
 if(signature.kind==='mathGate')return (MATH_NAMES[signature.op]||'CALCOLO')+' = '+signature.target;
 return 'FIRMA MATEMATICA';
}
