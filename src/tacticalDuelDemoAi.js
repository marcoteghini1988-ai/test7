// IA dimostrativa locale: usa esclusivamente la propria mano, gli HP visibili
// dell'avversario e le firme del rulebook prototipale. Mai la mano o gli ordini segreti di A.
import {VITAL_IDS} from './vitalDefense.js';
import {tacticalSignatureOperation} from './tacticalShipSignatures.js';
import {nativeBarrierPacket,validateTacticalOrder} from './simultaneousDuelEngine.js';

const PRIORITY=['shieldGenerator','weapons','command','engine'];
function pickPrecision(ours,enemy){
 const shield=enemy.defense.shield.hp;
 const projected=Math.max(0,shield-nativeBarrierPacket(ours));
 if(projected>45)return {numericIndices:[],vitalId:null,op:null};
 for(const id of PRIORITY){
  const p=enemy.defense.parts[id];
  if(p.hp<=0)continue;
  const sig=p.signature;
  for(let i=0;i<ours.numeric.hand.length;i++)
   for(let j=i+1;j<ours.numeric.hand.length;j++){
    const cards=[ours.numeric.hand[i],ours.numeric.hand[j]];
    const op=tacticalSignatureOperation(sig,cards);
    if(op)return {numericIndices:[i,j],vitalId:id,op};
   }
  // The same real 7-card hand may offer only a three-card formula.
  for(let i=0;i<ours.numeric.hand.length;i++)
   for(let j=i+1;j<ours.numeric.hand.length;j++)
    for(let k=j+1;k<ours.numeric.hand.length;k++){
     const cards=[ours.numeric.hand[i],ours.numeric.hand[j],ours.numeric.hand[k]];
     const op=tacticalSignatureOperation(sig,cards);
     if(op)return {numericIndices:[i,j,k],vitalId:id,op};
    }
 }
 return {numericIndices:[],vitalId:null,op:null};
}
export function planTacticalDemoAi(battle,key='B'){
 if(battle?.phase!=='planning'||!['A','B'].includes(key))return null;
 const ours=battle.sides[key],enemy=battle.sides[key==='B'?'A':'B'];
 const target=pickPrecision(ours,enemy);
 const ownShield=ours.defense.shield.hp;
 const desired=[];
 if(ours.seen.length<4)desired.push('tactic-scan');
 if(ownShield<=40&&ours.defense.parts.shieldGenerator.hp>0)desired.push('support-shield-repair');
 if(ours.sync>=100&&ours.escorts.some(e=>e.hp>0))desired.push('fusion-barrier');
 if(ownShield<=45)desired.push('tactic-counter','tactic-reactive','tactic-impact');
 if(enemy.escorts.some(e=>e.hp>0))desired.push('tactic-suppress','shot-piercing');
 desired.push('tactic-kinetic','tactic-power-shift','tactic-scan','tactic-impact','shot-ion','tactic-numeric-recycle');
 const indexes=[],seen=new Set();
 for(const type of desired){
  if(indexes.length>=2)break;
  if(seen.has(type))continue;
  const idx=ours.special.hand.findIndex((c,i)=>c.type===type&&!indexes.includes(i));
  if(idx<0)continue;
  seen.add(type);indexes.push(idx);
 }
 // Defence must target OUR exposed/threatened vital, not the enemy vital we're attacking.
 const counterVitalId=PRIORITY.find(id=>ours.defense.parts[id].hp>0&&ours.defense.parts[id].exposed)
  ??PRIORITY.find(id=>ours.defense.parts[id].hp>0)??'shieldGenerator';
 let order={specialIndices:indexes,counterVitalId,exchangeIndices:[],...target};
 while(!validateTacticalOrder(battle,key,order).ok&&order.specialIndices.length)
  order={...order,specialIndices:order.specialIndices.slice(0,-1)};
 if(!validateTacticalOrder(battle,key,order).ok)
  order={specialIndices:[],numericIndices:[],vitalId:null,op:null,counterVitalId:null,exchangeIndices:[]};
 return order;
}
