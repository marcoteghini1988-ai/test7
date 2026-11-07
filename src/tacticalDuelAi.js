// IA locale ufficiale per la preparazione simultanea nella plancia 3D.
// Non legge la mano, gli ordini impegnati o le firme nascoste del giocatore.
// I dodici boss possiedono piani e priorità derivati dai boss storici.
import {tacticalSignatureOperation} from './tacticalShipSignatures.js';
import {tacticalWeaponTechnology} from './tacticalArmamentBalance.js';
import {nativeBarrierPacket,validateTacticalOrder} from './simultaneousDuelEngine.js';
import {tacticalBossProfile} from './tacticalSpecialPresets.js';
import {selectTacticalEscortForAmmo} from './tacticalEscortVolley.js';

const NORMAL_PRIORITY=['shieldGenerator','weapons','command','engine'];
function findPrecision(ours,enemy,priority){
 const shield=enemy.defense.shield.hp;
 const projected=Math.max(0,shield-nativeBarrierPacket(ours));
 if(projected>45)return {numericIndices:[],vitalId:null,op:null};
 for(const id of priority){
  const part=enemy.defense.parts[id];
  if(!part||part.hp<=0)continue;
  // Un'IA non può usare una firma protetta/non ancora scansionata.
  if(!part.exposed&&!ours.seen.includes(id))continue;
  const sig=part.signature;
  for(let i=0;i<ours.numeric.hand.length;i++)
   for(let j=i+1;j<ours.numeric.hand.length;j++){
    const op=tacticalSignatureOperation(sig,[ours.numeric.hand[i],ours.numeric.hand[j]]);
    if(op)return {numericIndices:[i,j],vitalId:id,op};
   }
  for(let i=0;i<ours.numeric.hand.length;i++)
   for(let j=i+1;j<ours.numeric.hand.length;j++)
    for(let k=j+1;k<ours.numeric.hand.length;k++){
     const op=tacticalSignatureOperation(sig,[ours.numeric.hand[i],ours.numeric.hand[j],ours.numeric.hand[k]]);
     if(op)return {numericIndices:[i,j,k],vitalId:id,op};
    }
 }
 return {numericIndices:[],vitalId:null,op:null};
}
function playable(type,ours,enemy,shot){
 const escorts=ours.escorts.filter(e=>e.hp>0).length;
 const command=ours.defense.parts.command.hp>0,engine=ours.defense.parts.engine.hp>0;
 switch(type){
  case 'fusion-twin':case 'fusion-triad':return escorts>=2&&ours.sync>=100&&command&&engine;
  case 'fusion-barrier':case 'fusion-strike':return escorts>=1&&ours.sync>=100&&command&&engine;
  case 'tactical-cover':return escorts>=1&&command&&ours.defense.shield.hp<=45;
  case 'support-escort-repair':return command&&ours.escorts.some(e=>e.hp>0&&e.hp<e.max);
  case 'support-shield-repair':return ours.defense.parts.shieldGenerator.hp>0&&ours.defense.shield.hp<ours.defense.shield.max;
  case 'support-status-purge':return !!(ours.ionized||ours.corroded||ours.heated);
  case 'tactic-counter':return NORMAL_PRIORITY.some(id=>ours.defense.parts[id].hp>0&&ours.defense.parts[id].exposed);
  case 'tactic-scan':return ours.seen.length<4;
  case 'shot-piercing':case 'tactic-suppress':return enemy.escorts.some(e=>e.hp>0)&&enemy.defense.shield.hp>0;
  case 'shot-corrosion':case 'shot-ion':return enemy.defense.shield.hp>0;
  case 'tactic-numeric-recycle':return shot.numericIndices.length===0;
  case 'tactic-reactive':case 'tactic-impact':return ours.defense.shield.hp>0;
  default:return true;
 }
}
export function planTacticalAi(battle,key='B'){
 if(battle?.phase!=='planning'||!['A','B'].includes(key))return null;
 const ours=battle.sides[key],enemy=battle.sides[key==='B'?'A':'B'];
 const profile=tacticalBossProfile(ours.bossPlanetId);
 const priority=profile?.targets||NORMAL_PRIORITY;
 const focusPreferred=profile?.style==='ionico'||profile?.style==='interferenza'?'ionico':
  profile?.style==='eruzione'?'plasma':enemy.escorts.some(e=>e.hp>0)?'cinetico':'laser';
 const focusWeapon=ours.weapons.find(w=>tacticalWeaponTechnology(w)===focusPreferred)??ours.weapons[0];
 const shot=findPrecision(ours,enemy,priority);
 const threatened=priority.find(id=>ours.defense.parts[id].hp>0&&ours.defense.parts[id].exposed)
   ??priority.find(id=>ours.defense.parts[id].hp>0)??'shieldGenerator';
 const priorities=profile?.types??[
  'tactic-scan','support-shield-repair','fusion-barrier','tactic-counter',
  'tactic-reactive','tactic-impact','tactic-suppress','shot-piercing',
  'tactic-kinetic','tactic-power-shift','shot-ion','tactic-numeric-recycle'
 ];
 // Non usa una speciale solo perché è in mano: deve servire e non contraddire
 // l'altra già impegnata (massimo una fusione, 24 carte reali).
 const chosen=[],types=new Set();
 for(const type of [...(ours.seen.length<4?['tactic-scan']:[]),...priorities,'tactic-numeric-recycle','tactic-kinetic']){
  if(chosen.length>=2)break;
  if(types.has(type)||!playable(type,ours,enemy,shot))continue;
  const index=ours.special.hand.findIndex((c,i)=>c.type===type&&!chosen.includes(i));
  if(index<0)continue;
  if(type.startsWith('fusion-')&&[...types].some(t=>t.startsWith('fusion-')))continue;
  types.add(type);chosen.push(index);
 }
 const exchanges=shot.numericIndices.length?[]:
  chosen.some(i=>ours.special.hand[i].type==='tactic-numeric-recycle')?[0,1]:[0];
 // The opponent may load ONE numeric card into its actual escort armory.
 // It chooses only from its OWN visible hand, never the player's hidden cards.
 const used=new Set([...shot.numericIndices,...exchanges]);
 const defensiveAssignment=[...types].some(type=>type.startsWith('fusion-')||type==='tactical-cover');
 const ammo=defensiveAssignment?null:ours.numeric.hand
  .map((card,i)=>({i,card}))
  .filter(({i,card})=>!used.has(i)&&selectTacticalEscortForAmmo(ours,card))
  .sort((a,b)=>b.card.value-a.card.value||a.i-b.i)[0]?.i??null;
 let result={specialIndices:chosen,counterVitalId:threatened,exchangeIndices:exchanges,
  escortAmmoIndex:ammo,weaponFocusId:focusWeapon?.id??null,...shot};
 while(!validateTacticalOrder(battle,key,result).ok&&result.specialIndices.length){
  result={...result,specialIndices:result.specialIndices.slice(0,-1)};
  if(!result.specialIndices.some(i=>ours.special.hand[i].type==='tactic-numeric-recycle'))
   result.exchangeIndices=result.exchangeIndices.slice(0,1);
 }
 if(!validateTacticalOrder(battle,key,result).ok)
  result={specialIndices:[],numericIndices:[],vitalId:null,op:null,counterVitalId:null,
   weaponFocusId:focusWeapon?.id??null,exchangeIndices:[0]};
 return result;
}
