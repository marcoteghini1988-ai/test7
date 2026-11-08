// Le firme dei vitali NON possono essere suggerite dalla UI se il giocatore
// non le ha ancora scoperte con Scansione o con esposizione reale alla barriera.
// Anche con Carta Faglia in mano, il dato non cambia visibilita'.
import {VITAL_IDS} from './vitalDefense.js';
import {tacticalSignatureOperation} from './tacticalShipSignatures.js';

export function visibleTacticalSignature(attacker,defender,vitalId){
 if(!VITAL_IDS.includes(vitalId))return null;
 const part=defender?.defense?.parts?.[vitalId];
 if(!part||part.hp<=0||!part.signature)return null;
 const seen=Array.isArray(attacker?.seen)&&attacker.seen.includes(vitalId);
 return part.exposed||seen?part.signature:null;
}
export function suggestedTacticalOperation(attacker,defender,vitalId,cards){
 const signature=visibleTacticalSignature(attacker,defender,vitalId);
 return signature&&Array.isArray(cards)&&cards.length>=2?
  tacticalSignatureOperation(signature,cards):null;
}
