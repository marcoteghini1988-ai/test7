// Eclissi Stellare — difesa madre/scudiere, modello indipendente dalle vecchie gondole matematiche.
// Valori HP e firme sono parametri di prova: nessuna scelta di bilanciamento viene imposta.
export const VITAL_IDS=Object.freeze(['engine','weapons','shieldGenerator','command']);
export const VITAL_LABELS=Object.freeze({
 engine:'Motore',weapons:'Sistema armi',shieldGenerator:'Generatore scudi',command:'Centralina di comando'
});
export const SHIELD_GATE_PCT=Object.freeze([75,50,25,0]);

function positive(value,name){
 if(!Number.isSafeInteger(value)||value<=0)throw new RangeError(name+' deve essere intero positivo');
 return value;
}
function amount(value){
 return Number.isFinite(value)&&value>0?Math.floor(value):0;
}
function validKey(id){return VITAL_IDS.includes(id);}
function partHpFor(hp,id){return positive(typeof hp==='number'?hp:hp?.[id], 'HP '+id);}
function handValues(cards){
 if(!Array.isArray(cards)||!cards.every(c=>Number.isInteger(c?.value)&&c.value>=1&&c.value<=13&&typeof c.suit==='string'))return null;
 return cards.map(c=>c.value);
}
function operation(op,a,b){
 switch(op){case 'plus':return a+b;case 'minus':return a-b;case 'times':return a*b;case 'divide':return b!==0&&a%b===0?a/b:NaN;default:return NaN;}
}
function permutations(values){
 if(values.length===0)return [[]];
 return values.flatMap((value,index)=>permutations(values.filter((_,i)=>i!==index)).map(rest=>[value,...rest]));
}
function sameSorted(a,b){return a.length===b.length&&a.every((v,i)=>v===b[i]);}
// Firma permanente associata al modello: math (2/3 carte), oppure famiglia poker.
export function matchesVitalSignature(signature,cards){
 if(!signature||!Array.isArray(cards))return false;
 const values=handValues(cards);
 if(!values)return false;
 if(signature.kind==='math'){
  const ops=signature.ops??(signature.op?[signature.op]:[]);
  if(![2,3].includes(values.length)||ops.length!==values.length-1||!Number.isInteger(signature.target))return false;
  return permutations(values).some(order=>{
   let n=order[0];
   for(let i=0;i<ops.length;i++){
    n=operation(ops[i],n,order[i+1]);
    if(!Number.isInteger(n))return false;
   }
   return n===signature.target;
  });
 }
 if(signature.kind!=='poker')return false;
 const n=values.length,counts=[...new Set(values)].map(x=>values.filter(y=>y===x).length).sort((a,b)=>b-a);
 const suits=new Set(cards.map(c=>c.suit));
 const flush=suits.size===1;
 const sorted=[...new Set(values)].sort((a,b)=>a-b);
 const straight=n===5&&sorted.length===5&&(sorted[4]-sorted[0]===4||sameSorted(sorted,[1,10,11,12,13]));
 const pattern=signature.pattern;
 switch(pattern){
  case 'pair':return n===2&&counts[0]===2;
  case 'twoPair':return n===4&&sameSorted(counts,[2,2]);
  case 'trips':return n===3&&counts[0]===3;
  case 'straight':return straight;
  case 'flush':return n===5&&flush;
  case 'fullHouse':return n===5&&sameSorted(counts,[3,2]);
  case 'fourKind':return n===4&&counts[0]===4;
  case 'straightFlush':return straight&&flush;
  case 'royalFlush':return straight&&flush&&sameSorted(sorted,[1,10,11,12,13]);
  default:return false;
 }
}
export function createMotherDefense({shipId,shieldMax=100,partHp=25,signatures={}}={}){
 if(typeof shipId!=='string'||!shipId)throw new TypeError('ID madre richiesto');
 const max=positive(shieldMax,'Scudo');
 return {kind:'mother',shipId,shield:{hp:max,max},
  parts:Object.fromEntries(VITAL_IDS.map(id=>[id,{
   hp:partHpFor(partHp,id),max:partHpFor(partHp,id),exposed:false,signature:signatures[id]??null
  }])),exposureOrder:[]};
}
export function destroyedMotherParts(defense){
 return VITAL_IDS.filter(id=>defense.parts[id].hp===0);
}
export function motherDestroyed(defense){
 return !!defense&&defense.kind==='mother'&&destroyedMotherParts(defense).length===4;
}
export function shieldGateCount(defense){
 if(!defense||defense.kind!=='mother')return 0;
 const pct=defense.shield.hp/defense.shield.max*100;
 return SHIELD_GATE_PCT.filter(gate=>pct<=gate).length;
}
export function remainingExposureSlots(defense){
 const available=Math.max(0,shieldGateCount(defense)-destroyedMotherParts(defense).length);
 return Math.max(0,available-defense.exposureOrder.length);
}
function reconcile(defense){
 const quota=Math.max(0,shieldGateCount(defense)-destroyedMotherParts(defense).length);
 const exposureOrder=defense.exposureOrder.filter(id=>defense.parts[id].hp>0).slice(0,quota);
 const parts=Object.fromEntries(VITAL_IDS.map(id=>[id,{
  ...defense.parts[id],exposed:exposureOrder.includes(id)
 }]));
 return {...defense,parts,exposureOrder};
}
export function damageMotherShield(defense,rawDamage){
 if(defense?.kind!=='mother')throw new TypeError('Richiesta una navicella madre');
 const damage=Math.min(defense.shield.hp,amount(rawDamage));
 const next=reconcile({...defense,shield:{...defense.shield,hp:defense.shield.hp-damage}});
 return {defense:next,damage,newChoices:remainingExposureSlots(next)};
}
export function restoreMotherShield(defense,rawRepair){
 if(defense?.kind!=='mother')throw new TypeError('Richiesta una navicella madre');
 if(defense.parts.shieldGenerator.hp===0)return {defense,repaired:0,blocked:'generator_destroyed'};
 const repaired=Math.min(defense.shield.max-defense.shield.hp,amount(rawRepair));
 const next=reconcile({...defense,shield:{...defense.shield,hp:defense.shield.hp+repaired}});
 return {defense:next,repaired};
}
// Il bersaglio non è scelto in ordine fisso: sceglie chi attacca.
export function exposeMotherPart(defense,id){
 if(defense?.kind!=='mother'||!validKey(id)||!defense.parts[id]||defense.parts[id].hp<=0||
    defense.parts[id].exposed||remainingExposureSlots(defense)===0)return {defense,exposed:false};
 const next=reconcile({...defense,exposureOrder:[...defense.exposureOrder,id]});
 return {defense:next,exposed:next.parts[id].exposed};
}
export function hitMotherPart(defense,id,rawDamage,cards,signatureOverride=null){
 if(defense?.kind!=='mother'||!validKey(id))return {defense,damage:0,reason:'part_missing'};
 const part=defense.parts[id];
 if(!part||part.hp===0)return {defense,damage:0,reason:'destroyed'};
 if(!part.exposed)return {defense,damage:0,reason:'protected'};
 const signature=part.signature??signatureOverride;
 if(!signature)return {defense,damage:0,reason:'signature_undecided'};
 if(!matchesVitalSignature(signature,cards))return {defense,damage:0,reason:'wrong_combination'};
 const damage=Math.min(part.hp,amount(rawDamage));
 const nextPart={...part,hp:part.hp-damage};
 const next=reconcile({...defense,parts:{...defense.parts,[id]:nextPart}});
 return {defense:next,damage,destroyed:damage>0&&nextPart.hp===0,reason:damage?'hit':'no_damage'};
}
export function createEscortDefense({shieldMax=60,signature=null}={}){
 const max=positive(shieldMax,'Scudo scudiera');
 return {kind:'escort',shield:{hp:max,max},destroyed:false,signature};
}
export function damageEscortShield(defense,rawDamage){
 if(defense?.kind!=='escort')throw new TypeError('Richiesta una scudiera');
 const damage=Math.min(defense.shield.hp,amount(rawDamage));
 return {defense:{...defense,shield:{...defense.shield,hp:defense.shield.hp-damage}},damage};
}
export function destroyExposedEscort(defense,cards){
 if(defense?.kind!=='escort'||defense.destroyed||defense.shield.hp>0||
    !matchesVitalSignature(defense.signature,cards))return {defense,destroyed:false};
 return {defense:{...defense,destroyed:true},destroyed:true};
}
