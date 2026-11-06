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
 return Object.fromEntries(VITAL_IDS.map((id,index)=>{
  const op=available[(index+offset)%available.length];
  const math=Object.freeze({kind:'mathGate',op,target:targets[op],
   allowedCardCounts:[...MATH_CHAIN_COUNTS],modelId,prototype:true});
  // Poker is an OPTIONAL second way to trigger a vital hit; never a hard lock.
  const poker=id==='weapons'&&modelId!=='N00'?'pair':
   id==='command'&&/^[EL]/.test(modelId)?'trips':null;
  return [id,poker?Object.freeze({kind:'any',options:Object.freeze([
   math,Object.freeze({kind:'poker',pattern:poker,prototype:true})
  ])}):math];
 }));
}
export function primaryVitalMathGate(signature){
 if(signature?.kind==='mathGate')return signature;
 return signature?.kind==='any'?signature.options?.find(x=>x.kind==='mathGate')??null:null;
}
export function vitalSignatureLabel(signature){
 if(!signature)return 'FIRMA NON DEFINITA';
 if(signature.kind==='any')return signature.options.map(vitalSignatureLabel).join(' O ');
 if(signature.kind==='mathGate'||signature.kind==='math'){
  const op=signature.op??signature.ops?.[0];
  const signs={plus:'+',minus:'−',times:'×',divide:'÷'};
  const counts=signature.allowedCardCounts??[signature.ops?.length+1||2];
  return `FIRMA ${signs[op]??'?'} ${signature.target} · ${counts.join('/')} CARTE`;
 }
 if(signature.kind==='poker')return 'FIRMA POKER: '+String(signature.pattern||'?');
 return 'FIRMA NON RICONOSCIUTA';
}
