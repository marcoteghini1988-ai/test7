// Point 28: fixed battle-start signature profiles for the 17 ship families.
// This is a PROVISIONAL math rulebook, not the final balancing catalogue.
// A signature is chosen only from operators both sides actually have installed;
// all four parts accept either 2 or 3 numerical cards to avoid hard locks.
import {VITAL_IDS} from './vitalDefense.js';
import {MATH_CHAIN_OPERATORS,MATH_CHAIN_COUNTS} from './mathChains.js';
const modelOffset=id=>[...String(id)].reduce((sum,c)=>sum+c.charCodeAt(0),0);
export function prototypeModelSignatures(modelId,targets,availableOperators=[]){
 const available=MATH_CHAIN_OPERATORS.filter(op=>availableOperators.includes(op)&&
  Number.isInteger(targets?.[op])&&targets[op]>0);
 if(!available.length)return Object.fromEntries(VITAL_IDS.map(id=>[id,null]));
 const offset=modelOffset(modelId)%available.length;
 return Object.fromEntries(VITAL_IDS.map((id,index)=>[id,Object.freeze({
  kind:'mathGate',op:available[(index+offset)%available.length],
  target:targets[available[(index+offset)%available.length]],
  allowedCardCounts:[...MATH_CHAIN_COUNTS],modelId,prototype:true
 })]));
}
export function vitalSignatureLabel(signature){
 if(!signature)return 'FIRMA NON DEFINITA';
 if(signature.kind==='mathGate'||signature.kind==='math'){
  const op=signature.op??signature.ops?.[0];
  const signs={plus:'+',minus:'−',times:'×',divide:'÷'};
  const counts=signature.allowedCardCounts??[signature.ops?.length+1||2];
  return `FIRMA ${signs[op]??'?'} ${signature.target} · ${counts.join('/')} CARTE`;
 }
 if(signature.kind==='poker')return 'FIRMA POKER: '+String(signature.pattern||'?');
 return 'FIRMA NON RICONOSCIUTA';
}
