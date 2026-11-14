// Visual event contract for the OFFICIAL 3D fleet battle. Does not modify gameplay.
// Every rendered shot/card originates from the round resolver, never a mock attack.
import {SPECIAL_CARD_CATALOG} from './specialCards.js';
import {fleetCardEffect} from './fleetCardEngine.js';
import {fleetWeaponOfRound} from './fleetBattleVisuals.js';

export function planFleetRoundFx(before,events){
 if(!before||!Array.isArray(events))return [];
 return events.filter(e=>e?.who==='A'||e?.who==='B').map((hit,index)=>{
  const side=hit.who==='A'?'player':'enemy';
  const targetSide=hit.who==='A'?'enemy':'player';
  const ship=before.sides[hit.who]?.ships?.[0];
  const shot=hit.fireCount>0&&ship?
   fleetWeaponOfRound(ship.id,hit.round||before.round):null;
  const impact=hit.escortDamage>0?
   (hit.escortDestroyed?'escort-destroyed':'escort'):
   hit.damage>0?(hit.destroyed?'destroyed':'fracture'):
   hit.fireCount>0?'blocked':'none';
  const cards=(hit.played||[]).filter(type=>SPECIAL_CARD_CATALOG[type]).map((type,i)=>({
   type,name:SPECIAL_CARD_CATALOG[type].name||type,
   family:SPECIAL_CARD_CATALOG[type].family,
   kind:fleetCardEffect(type).kind,
   side,index:i
  }));
  return {side,targetSide,round:hit.round,shot,
   partId:hit.partId,escortSlot:hit.escortDamage>0?hit.escortSlot:null,
   strength:hit.strength,damage:hit.damage,escortDamage:hit.escortDamage,
   fireCount:hit.fireCount,impact,partName:hit.partName,cards,sequence:index};
 });
}
