// Adapter ONLY: four current vital systems reuse the four physical motor points
// calibrated for every hull/view in the recovery-era battle. No new geometry.
import {enginePoint,engineSurface} from './mathFleetGeometry.js';

export const VITAL_TO_ORIGINAL_MOTOR=Object.freeze({
 engine:'plus',
 weapons:'minus',
 shieldGenerator:'times',
 command:'divide'
});
export const VITAL_MOTOR_SHORT_NAMES=Object.freeze({
 engine:'MOT',weapons:'ARMI',shieldGenerator:'GEN',command:'CMD'
});
export const ORIGINAL_MOTOR_VITALS=Object.freeze(Object.keys(VITAL_TO_ORIGINAL_MOTOR));

export function vesselWithPhysicalVitalDamage(vessel,defense){
 if(!vessel?.id||!defense?.parts)
  throw new Error('Navicella o quattro vitali non disponibili');
 const engines={...vessel.engines};
 for(const vital of ORIGINAL_MOTOR_VITALS){
  const part=defense.parts[vital],op=VITAL_TO_ORIGINAL_MOTOR[vital];
  if(!part||!Number.isFinite(part.hp)||!Number.isFinite(part.max)||part.max<=0)
   throw new Error('Vitale non valido: '+vital);
  engines[op]={...(engines[op]||{}),hp:part.hp,max:part.max};
 }
 // Keep the original vessel, artwork, gun hardpoints and evolution unchanged.
 // Only the HP shown by the original motor renderer are projected from
 // the AUTHORITATIVE vital defense. Never write damage back to old engines.
 return {...vessel,engines};
}

export function originalPhysicalVitalLocation(side,shipId,vital){
 const op=VITAL_TO_ORIGINAL_MOTOR[vital];
 if(!op)throw new Error('Vitale non valido: '+vital);
 return {op,point:enginePoint(side,shipId,op),surface:engineSurface(side,shipId,op)};
}
