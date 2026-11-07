// Strategic consequences of damaging a REAL ship vital in the simultaneous duel.
// Presentation uses the same thresholds as fleetSystems and the same HP as
// vitalDefense. These descriptions are NOT powers, cards or artificial effects.
import {VITAL_IDS,VITAL_LABELS} from './vitalDefense.js';
import {systemState} from './fleetSystems.js';

export const TACTICAL_VITAL_EFFECTS=Object.freeze({
 engine:Object.freeze({
  damaged:'Potenza delle armi native −10%.',
  destroyed:'Potenza delle armi native −25%; nuove fusioni bloccate.'
 }),
 weapons:Object.freeze({
  damaged:'Potenza delle armi native −20%.',
  destroyed:'Potenza delle armi native −50%.'
 }),
 shieldGenerator:Object.freeze({
  damaged:'Riparazioni della barriera dimezzate (−50%).',
  destroyed:'Barriera collassata; riparazioni disattivate.'
 }),
 command:Object.freeze({
  damaged:'Intercettazione delle scudiere ridotta del 15%, anche in copertura e fusione.',
  destroyed:'Scudiere senza intercettazione; coperture, riparazioni scudiere e nuove fusioni bloccate.'
 })
});
export function tacticalVitalTransition(before,after,id){
 if(!VITAL_IDS.includes(id))return null;
 const oldState=systemState(before,id),newState=systemState(after,id);
 if(newState===oldState||!['damaged','destroyed'].includes(newState))return null;
 const name=VITAL_LABELS[id],description=TACTICAL_VITAL_EFFECTS[id][newState];
 return {id,state:newState,name,description,
  label:name+' '+(newState==='destroyed'?'DISTRUTTO':'DANNEGGIATO')+': '+description};
}
