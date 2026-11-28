// No visual reconstruction. The two components below are the original
// recovery-era hull damage renderer and destructible motor renderer.
// This adapter feeds them the four ACTUAL vital HP from the 30+8 battle.
import React from 'react';
import {ShipSkin,Engine} from './FleetPhysicalRenderer.jsx';
import {engineVisualState} from './mathFleetGeometry.js';
import {VITAL_IDS,VITAL_LABELS} from './vitalDefense.js';
import {
 VITAL_TO_ORIGINAL_MOTOR,VITAL_MOTOR_SHORT_NAMES,vesselWithPhysicalVitalDamage
} from './officialVitalMotorAdapter.js';

export const physicalVitalCondition=part=>engineVisualState(part);

export default function ShipPhysicalVitals({
 side,vessel,defense,hullRef,selectedVital,onSelectVital,canTarget=false,
 knownVitals=[],impactedVitals=[],registerVitalRef,vitalLabels=VITAL_LABELS,
 vitalShortLabels=VITAL_MOTOR_SHORT_NAMES,allowOwnTarget=false,hideVitalTargets=false
}){
 const physical=vesselWithPhysicalVitalDamage(vessel,defense);
 // These are EXACTLY the four motor coordinates in the source ZIP/code.
 // Four motor overlays remain inside the old 1000x1000 sprite viewport.
 // They never move the hull, arena, decks, scudiere or HUD positions.
 const originalFormation={size:206,engineSize:38,hudWidth:50};
 return <>
  <ShipSkin side={side} vessel={physical} imageRef={hullRef}/>
  {!hideVitalTargets&&<div className="official-original-motor-targets" aria-label="Componenti vitali distruggibili della nave">
   {VITAL_IDS.filter(vital=>defense.parts[VITAL_TO_ORIGINAL_MOTOR[vital]==='times'?'shieldGenerator':vital]?.unlocked!==false).map(vital=>{
    const part=defense.parts[vital];
    const op=VITAL_TO_ORIGINAL_MOTOR[vital];
    const selectable=(side==='enemy'||allowOwnTarget)&&canTarget&&part.hp>0;
    const state=part.hp<=0?'distrutto':part.exposed?'esposto':
     knownVitals.includes(vital)?'scansionato':'protetto';
    return <Engine key={vital} side={side} op={op} vessel={physical}
     target={null} selected={(side==='enemy'||allowOwnTarget)&&selectedVital===vital}
     onSelect={()=>selectable&&onSelectVital?.(vital)}
     enabled={selectable} available={true}
     engineRef={node=>registerVitalRef?.(vital,node)}
     hit={impactedVitals.includes(vital)}
     formation={originalFormation}
     vitalLabel={vitalShortLabels[vital]}
     vitalName={vitalLabels[vital]+' · '+state}
    />;
   })}
  </div>}
 </>;
}
