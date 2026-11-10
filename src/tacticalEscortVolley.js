// Reuse the REAL escort armory and its ammunition/suit rules in the official
// 30+8 duel. A numeric card is deliberately loaded into one live escort gun;
// the same card cannot also participate in precision or be exchanged.
// The small 60-HP barrier scale is capped independently from the 42 mother
// weapons, so old escort weapon damage does not cause instant shield deletion.
import {escortArmamentFor,SEME_BY_CARD} from './escortArmory.js';
import {effectiveGunDamage} from './fleetSystems.js';
import {tacticalEscortDamage} from './escortTactics.js';

export const TACTICAL_ESCORT_PACKET_CAP=12;
export const TACTICAL_ESCORT_SCALE_DIVISOR=4;
export function createTacticalEscortArmament(shipId,shipWeapons,slot){
 const mother={id:shipId,weapons:shipWeapons};
 return escortArmamentFor(mother,slot);
}
export function selectTacticalEscortForAmmo(side,card){
 const suit=SEME_BY_CARD[card?.suit];
 if(!suit||!Number.isInteger(card?.value)||card.value<1||card.value>13)
  return null;
 return (side?.escorts||[]).find(escort=>
  escort.hp>0&&escort.weapon?.suits.includes(suit))||null;
}
export function prepareTacticalEscortVolley(side,card,selectedSlot=null){
 const suit=SEME_BY_CARD[card?.suit];
 const escort=selectedSlot==null?selectTacticalEscortForAmmo(side,card):
  (side?.escorts||[]).find(e=>e.slot===selectedSlot&&e.hp>0&&e.weapon?.suits.includes(suit));
 if(!escort)return {ready:false,reason:'no_eligible_escort',cardId:card?.id??null};
 const gun=escort.weapon;
 if(gun.tipo==='Accumulo'){
  const stored=Math.max(0,Math.floor(gun.charge||0));
  const next=stored+card.value;
  const threshold=Math.max(1,Math.floor(gun.threshold||1));
  if(next<threshold){
   gun.charge=next;
   return {ready:false,reason:'charging',escortSlot:escort.slot,charge:next,
    threshold,cardId:card.id,weaponId:gun.sourceWeaponId,escortWeaponId:gun.id};
  }
  gun.charge=next-threshold;
  card={...card,value:threshold};
 }
 const scaled=Math.min(TACTICAL_ESCORT_PACKET_CAP,
  Math.max(1,Math.floor(gun.damage*card.value/TACTICAL_ESCORT_SCALE_DIVISOR)));
 const base=effectiveGunDamage(side.defense,'escort',scaled);
 const tactical=tacticalEscortDamage(gun.role,base,{targetKind:'motherShield'},
  {parentShipId:side.shipId},side.defense);
 return {ready:true,reason:'ready',escortSlot:escort.slot,cardId:card.id,
  escortWeaponId:gun.id,weaponId:gun.sourceWeaponId,weaponName:gun.name,
  bullets:card.value,
  packet:Math.min(TACTICAL_ESCORT_PACKET_CAP,tactical.damage),
  rawDamage:gun.damage*card.value,charge:gun.charge||0};
}
