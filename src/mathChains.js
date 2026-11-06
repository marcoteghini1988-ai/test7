// Point 28: chained arithmetic uses exactly two or three NUMERIC cards.
// An operation is repeated left-to-right; permutations are tried for '-' and '/'.
// Arithmetic cannot become a replacement for the separate special-card hand.
export const MATH_CHAIN_OPERATORS=Object.freeze(['plus','minus','times','divide']);
export const MATH_CHAIN_COUNTS=Object.freeze([2,3]);
export const MATH_CHAIN_SIGNS=Object.freeze({plus:'+',minus:'−',times:'×',divide:'÷'});
const calculate=(op,a,b)=>{
 switch(op){
  case 'plus':return a+b;
  case 'minus':return a-b;
  case 'times':return a*b;
  case 'divide':return b!==0&&a%b===0?a/b:NaN;
  default:return NaN;
 }
};
const validValues=values=>Array.isArray(values)&&MATH_CHAIN_COUNTS.includes(values.length)&&
 values.every(v=>Number.isInteger(v)&&v>=1&&v<=13);
function orders(values){
 const out=[];
 function walk(indices,rest){
  if(!rest.length){out.push(indices.map(i=>values[i]));return;}
  for(const i of rest)walk([...indices,i],rest.filter(j=>j!==i));
 }
 walk([],values.map((_,i)=>i));
 return out;
}
export function evaluateMathChain(op,values,target){
 if(!MATH_CHAIN_OPERATORS.includes(op)||!validValues(values)||!Number.isInteger(target))return null;
 for(const order of orders(values)){
  let result=order[0],good=true;
  for(const value of order.slice(1)){
   result=calculate(op,result,value);
   // Exact integers; for three-card chains, each intermediate must be positive.
   if(!Number.isSafeInteger(result)||values.length===3&&result<=0){good=false;break;}
  }
  if(good&&result===target)return {valid:true,op,target,order,result,count:values.length};
 }
 return null;
}
export function inspectMathChain(op,values,target){
 const match=evaluateMathChain(op,values,target);
 if(match)return match;
 if(!MATH_CHAIN_OPERATORS.includes(op)||!validValues(values)||!Number.isInteger(target))
  return {valid:false,op,target,reason:'invalid_cards',count:values?.length??0};
 let best=null;
 for(const order of orders(values)){
  let result=order[0],good=true;
  for(const value of order.slice(1)){
   result=calculate(op,result,value);
   if(!Number.isSafeInteger(result)||values.length===3&&result<=0){good=false;break;}
  }
  if(!good)continue;
  const distance=Math.abs(result-target);
  if(!best||distance<best.distance)best={order,result,distance};
 }
 return best?{valid:false,op,target,order:best.order,result:best.result,
  count:values.length,reason:'target_mismatch'}:
  {valid:false,op,target,count:values.length,reason:'invalid_intermediate'};
}
export function mathChainText(match,display=value=>String(value)){
 if(!match?.order?.length)return '';
 const sign=MATH_CHAIN_SIGNS[match.op]||'?';
 return match.order.map(display).join(' '+sign+' ')+' = '+match.result;
}
