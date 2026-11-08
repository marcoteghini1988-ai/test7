// Difesa tattica: cambia la formula di un vitale gia' esposto SOLO per
// il ciclo corrente. Non modifica le firme canoniche delle 17 navicelle.
import {VITAL_IDS} from './vitalDefense.js';

export const SIGNATURE_MUTATION_CARD_ID='tactic-signature-mutation';
export const SIGNATURE_MUTATION_DURATION_CYCLES=1;
const ALTERNATIVES=Object.freeze([
 Object.freeze({kind:'mathGate',op:'plus',target:9,allowedCardCounts:Object.freeze([2,3])}), // 4 + 5
 Object.freeze({kind:'mathGate',op:'minus',target:3,allowedCardCounts:Object.freeze([2,3])}), // 5 - 2
 Object.freeze({kind:'mathGate',op:'times',target:12,allowedCardCounts:Object.freeze([2,3])}), // 3 x 4
 Object.freeze({kind:'mathGate',op:'divide',target:2,allowedCardCounts:Object.freeze([2,3])}) // 6 / 3
]);

const originalOperations=signature=>{
 const all=signature?.kind==='any'?signature.options:[signature];
 return new Set(all?.map(s=>s?.kind==='poker'?s.pattern:s?.op).filter(Boolean)||[]);
};

// Deterministico: stesso round, modello e vitale producono la stessa firma.
// Non legge mai mano o ordine avversario, ne' genera numeriche.
export function signatureMutationFor(signature,shipId,vitalId,round){
 if(!signature||!VITAL_IDS.includes(vitalId)||typeof shipId!=='string'||
    !Number.isInteger(round)||round<1)return null;
 const old=originalOperations(signature);
 const candidates=ALTERNATIVES.filter(s=>!old.has(s.op));
 if(!candidates.length)return null;
 const salt=[...shipId].reduce((acc,ch)=>acc+ch.charCodeAt(0),0);
 return candidates[(salt+round+VITAL_IDS.indexOf(vitalId))%candidates.length];
}

export function prepareSignatureMutation(defense,vitalId,round){
 const part=defense?.parts?.[vitalId];
 if(!VITAL_IDS.includes(vitalId)||!part||!part.exposed||part.hp<=0||!part.signature)
  return {ok:false,reason:'mutation_unavailable'};
 const newSignature=signatureMutationFor(part.signature,defense.shipId,vitalId,round);
 if(!newSignature)return {ok:false,reason:'mutation_unavailable'};
 return {ok:true,vitalId,originalSignature:part.signature,newSignature,
  durationCycles:SIGNATURE_MUTATION_DURATION_CYCLES};
}
