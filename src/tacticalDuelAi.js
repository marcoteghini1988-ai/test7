// IA locale ufficiale per la preparazione simultanea nella plancia 3D.
// Non legge la mano, gli ordini impegnati o le firme nascoste del giocatore.
// I dodici boss possiedono piani e priorità derivati dai boss storici.
import {tacticalSignatureOperation} from './tacticalShipSignatures.js';
import {tacticalWeaponTechnology} from './tacticalArmamentBalance.js';
import {nativeBarrierPacket,validateTacticalOrder} from './simultaneousDuelEngine.js';
import {tacticalBossProfile} from './tacticalSpecialPresets.js';
import {selectTacticalEscortForAmmo} from './tacticalEscortVolley.js';
import {isPvpTerrain,pvpTerrainAtRound} from './pvpTerrainCards.js';
import {SIGNATURE_MUTATION_CARD_ID} from './tacticalSignatureMutation.js';
import {VULNERABILITY_RIFT_CARD_ID} from './tacticalVulnerabilityRift.js';
import {visibleTacticalSignature} from './tacticalIntelVisibility.js';
import {isModuleCard} from './tacticalEquipmentCards.js';
import {isBossCharacterCard,bossCharacterDefinition,bossCharacterActive} from './bossCharacterCards.js';
import {LEGACY_DICE_CARD,LEGACY_BOMB_CARD,LEGACY_MALUS_CARD,LEGACY_GOLD_CARD,MALUS_CHOICES}
 from './tacticalLegacyEvents.js';

const NORMAL_PRIORITY=['shieldGenerator','weapons','command','engine'];
function findPrecision(ours,enemy,priority){
 const shield=enemy.defense.shield.hp;
 const projected=Math.max(0,shield-nativeBarrierPacket(ours));
 const hasRift=!ours.riftUsed&&ours.special.hand.some(c=>c.type===VULNERABILITY_RIFT_CARD_ID);
 if(projected>45&&!hasRift)return {numericIndices:[],vitalId:null,op:null};
 for(const id of priority){
  const part=enemy.defense.parts[id];
  if(!part||part.hp<=0)continue;
  // Una firma sconosciuta non si puo' consultare, nemmeno con Faglia in mano.
  const sig=visibleTacticalSignature(ours,enemy,id);
  if(!sig)continue;
  // Conserva numeriche quando bastano 6 HP, ma se il vitale ha 7/8 HP
  // una formula a 3 carte (8 HP) conclude il KO nel ciclo attuale.
  // Nessuna ricerca su firme nascoste: sig proviene solo dalla visibilita'.
  let pair=null,triplet=null;
  for(let i=0;i<ours.numeric.hand.length;i++)
   for(let j=i+1;j<ours.numeric.hand.length;j++){
    const op=tacticalSignatureOperation(sig,[ours.numeric.hand[i],ours.numeric.hand[j]]);
    if(op&&!pair)pair={numericIndices:[i,j],vitalId:id,op};
   }
  if(!pair||part.hp>6&&part.hp<=8)
   for(let i=0;i<ours.numeric.hand.length;i++)
    for(let j=i+1;j<ours.numeric.hand.length;j++)
     for(let k=j+1;k<ours.numeric.hand.length;k++){
      const op=tacticalSignatureOperation(sig,[ours.numeric.hand[i],ours.numeric.hand[j],ours.numeric.hand[k]]);
      if(op&&!triplet)triplet={numericIndices:[i,j,k],vitalId:id,op};
     }
  if(part.hp>6&&part.hp<=8&&triplet)return triplet;
  if(pair)return pair;
  if(triplet)return triplet;
 }
 return {numericIndices:[],vitalId:null,op:null};
}
function playable(type,ours,enemy,shot,round){
 if(isBossCharacterCard(type)){
  if(bossCharacterActive(ours,round))return false;
  const effect=bossCharacterDefinition(type)?.effect;
  switch(effect){
   case 'armor':return ours.defense.shield.hp>0;
   case 'assault':case 'corrosion':return enemy.defense.shield.hp>0;
   case 'counter':return ours.defense.parts&&Object.values(ours.defense.parts).some(p=>p.hp>0&&p.exposed)&&ours.special.hand.some(c=>c.type==='tactic-counter');
   case 'ionGuard':return !!ours.ionized;
   case 'escortGuard':return ours.escorts.some(e=>e.hp>0)&&ours.defense.shield.hp>0;
   case 'shadow':return ours.defense.shield.hp>0&&
    ours.defense.shield.hp*100<=ours.defense.shield.max*35&&enemy.defense.shield.hp>0;
   case 'regeneration':return ours.defense.parts.shieldGenerator.hp>0&&
    ours.defense.shield.hp<ours.defense.shield.max;
   case 'sync':case 'precision':return shot.numericIndices.length>=2;
   case 'harmonic':return ours.escorts.some(e=>e.hp>0)&&enemy.defense.shield.hp>0;
   case 'magma':return !!enemy.corroded&&enemy.defense.shield.hp>0;
   default:return false;
  }
 }

 const escorts=ours.escorts.filter(e=>e.hp>0).length;
 const command=ours.defense.parts.command.hp>0,engine=ours.defense.parts.engine.hp>0;
 switch(type){
  case 'fusion-twin':case 'fusion-triad':return escorts>=2&&ours.sync>=100&&command&&engine;
  case 'fusion-barrier':case 'fusion-strike':return escorts>=1&&ours.sync>=100&&command&&engine;
  case 'tactical-cover':return escorts>=1&&command&&ours.defense.shield.hp<=45;
  case 'support-escort-repair':return command&&ours.escorts.some(e=>e.hp>0&&e.hp<e.max);
  case 'support-shield-repair':return ours.defense.parts.shieldGenerator.hp>0&&ours.defense.shield.hp<ours.defense.shield.max;
  case 'support-status-purge':return !!(ours.ionized||ours.corroded||ours.heated);
  case LEGACY_DICE_CARD:return ours.legacy?.diceReady===true;
  case LEGACY_MALUS_CARD:return (ours.legacy?.malusCharge??0)>=3;
  case LEGACY_GOLD_CARD:return !ours.legacy?.golden&&ours.numeric.hand.length>0;
  case LEGACY_BOMB_CARD:return enemy.numeric.hand.length>0;
  case VULNERABILITY_RIFT_CARD_ID:return !ours.riftUsed&&
   shot.numericIndices.length>=2&&enemy.defense.parts[shot.vitalId]?.hp>0&&
   !enemy.defense.parts[shot.vitalId]?.exposed;
  case 'tactic-counter':return NORMAL_PRIORITY.some(id=>ours.defense.parts[id].hp>0&&ours.defense.parts[id].exposed);
  case SIGNATURE_MUTATION_CARD_ID:return NORMAL_PRIORITY.some(id=>ours.defense.parts[id].hp>0&&ours.defense.parts[id].exposed);
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
 // La scelta del bersaglio di esposizione non legge firme nascoste.
 // La soglia e' verificata dal motore dopo il vero impatto nativo.
 const exposureTarget=priority.find(id=>enemy.defense.parts[id]?.hp>0&&
  !enemy.defense.parts[id].exposed)??shot.vitalId??null;
 const threatened=priority.find(id=>ours.defense.parts[id].hp>0&&ours.defense.parts[id].exposed)
   ??priority.find(id=>ours.defense.parts[id].hp>0)??'shieldGenerator';
 const mutationVitalId=priority.find(id=>ours.defense.parts[id].hp>0&&ours.defense.parts[id].exposed)??null;
 const priorities=profile?.types??[
  'tactic-scan','support-shield-repair','fusion-barrier','tactic-counter',
  'tactic-reactive','tactic-impact','tactic-suppress','shot-piercing',
  'tactic-kinetic','tactic-power-shift','shot-ion','tactic-numeric-recycle'
 ];
 // Non usa una speciale solo perché è in mano: deve servire e non contraddire
 // l'altra già impegnata (massimo una fusione, 24 carte reali).
 const chosen=[],types=new Set();
 const terrains=battle.mode==='pvp'&&!pvpTerrainAtRound(battle.activeTerrain,battle.round)?
  ours.special.hand.map(c=>c.type).filter(isPvpTerrain):[];
 const modules=ours.special.hand.map(c=>c.type).filter(type=>
  isModuleCard(type)&&!!ours.equipmentLevels?.[type]);
 const bossCharacters=ours.special.hand.map(c=>c.type).filter(isBossCharacterCard);
 for(const type of [...(shot.numericIndices.length>=2&&
  !enemy.defense.parts[shot.vitalId]?.exposed?[VULNERABILITY_RIFT_CARD_ID]:[]),
  ...bossCharacters,
  ...(ours.legacy?.diceReady?[LEGACY_DICE_CARD]:[]),
  ...((ours.legacy?.malusCharge??0)>=3?[LEGACY_MALUS_CARD]:[]),
  ...(mutationVitalId?[SIGNATURE_MUTATION_CARD_ID]:[]),...(ours.seen.length<4?['tactic-scan']:[]),
  ...terrains,...modules,LEGACY_BOMB_CARD,LEGACY_GOLD_CARD,...priorities,'tactic-numeric-recycle','tactic-kinetic']){
  if(chosen.length>=2)break;
  if(types.has(type)||!playable(type,ours,enemy,shot,battle.round))continue;
  if(isBossCharacterCard(type)&&[...types].some(isBossCharacterCard))continue;
  const index=ours.special.hand.findIndex((c,i)=>c.type===type&&!chosen.includes(i));
  if(index<0)continue;
  if(type.startsWith('fusion-')&&[...types].some(t=>t.startsWith('fusion-')))continue;
  if(isModuleCard(type)&&[...types].some(isModuleCard))continue;
  types.add(type);chosen.push(index);
 }
 // Anti-stallo: senza formula non continuare a rimpiazzare sempre
 // lo slot 0 lasciando sei numeriche bloccate per tutta la battaglia.
 // Ruota uno slot reale a ogni ciclo; con la Carta Ricambio vera ne ruota due.
 const handSize=ours.numeric.hand.length;
 const replaceIndex=handSize?((battle.round-1)%handSize):0;
 const nextIndex=handSize?(replaceIndex+1)%handSize:0;
 let exchanges=shot.numericIndices.length?[]:
  chosen.some(i=>ours.special.hand[i].type==='tactic-numeric-recycle')?
   (handSize>1?[replaceIndex,nextIndex]:[replaceIndex]):[replaceIndex];
 const bombIndex=ours.numeric.hand.findIndex(c=>c.id===ours.legacy?.bomb?.cardId);
 if(bombIndex>=0&&!shot.numericIndices.includes(bombIndex)){
  exchanges=[bombIndex];
 }
 // The opponent may load ONE numeric card into its actual escort armory.
 // It chooses only from its OWN visible hand, never the player's hidden cards.
 const used=new Set([...shot.numericIndices,...exchanges]);
 const defensiveAssignment=[...types].some(type=>type.startsWith('fusion-')||type==='tactical-cover');
 const ammo=defensiveAssignment?null:ours.numeric.hand
  .map((card,i)=>({i,card}))
  .filter(({i,card})=>!used.has(i)&&selectTacticalEscortForAmmo(ours,card))
  .sort((a,b)=>b.card.value-a.card.value||a.i-b.i)[0]?.i??null;
 let result={specialIndices:chosen,counterVitalId:threatened,mutationVitalId,
  quantumRoll:false,
  malusChoice:types.has(LEGACY_MALUS_CARD)?MALUS_CHOICES[0].id:null,
  bombSlot:types.has(LEGACY_BOMB_CARD)?3:null,
  goldenIndex:types.has(LEGACY_GOLD_CARD)?(shot.numericIndices[0]??0):null,
  exchangeIndices:exchanges,
  escortAmmoIndex:ammo,weaponFocusId:focusWeapon?.id??null,exposureTarget,...shot};
 while(!validateTacticalOrder(battle,key,result).ok&&result.specialIndices.length){
  result={...result,specialIndices:result.specialIndices.slice(0,-1)};
  const remaining=result.specialIndices.map(i=>ours.special.hand[i].type);
  if(!remaining.includes(LEGACY_BOMB_CARD))result.bombSlot=null;
  if(!remaining.includes(LEGACY_MALUS_CARD))result.malusChoice=null;
  if(!remaining.includes(LEGACY_GOLD_CARD))result.goldenIndex=null;
  if(!result.specialIndices.some(i=>ours.special.hand[i].type==='tactic-numeric-recycle'))
   result.exchangeIndices=result.exchangeIndices.slice(0,1);
 }
 if(!validateTacticalOrder(battle,key,result).ok)
  result={specialIndices:[],numericIndices:[],vitalId:null,exposureTarget,op:null,
   quantumRoll:false,counterVitalId:null,
   weaponFocusId:focusWeapon?.id??null,exchangeIndices:[0]};
 return result;
}
