// Presentazione del Maglio Comune approvato; nessun calcolo di danni nel renderer.
import {projectMachineBerths} from './fleetNext/battlePresentation.js';

export const MAGLIO_CARD_ID='weapon-confirmed-metallic-maglio';
export const MAGLIO_FX_MS=2200;
export const MAGLIO_SHOT_GAP_MS=260;
export function maglioArtwork(id,side){
 return id===MAGLIO_CARD_ID?'/assets/fleet-weapons/maglio/'+
  (side==='enemy'?'enemy':'player')+'.webp':null;
}
export function maglioShots(events=[]){
 return events.filter(e=>e?.kind==='weapon-base-shot'&&e.cardId===MAGLIO_CARD_ID&&
  ['A','B'].includes(e.who)&&[0,1].includes(e.machineSlot)).map((e,index)=>({
   ...e,delayMs:index*MAGLIO_SHOT_GAP_MS,
   fires:!e.blocked&&e.actualDamage>0&&!!e.targetKind&&!!e.targetId
  }));
}
export function maglioResolutionMs(events=[]){
 const shots=maglioShots(events);
 return shots.length?MAGLIO_FX_MS+(shots.length-1)*MAGLIO_SHOT_GAP_MS:0;
}
// Durante gli effetti la plancia conserva gli HP precedenti. Lo snapshot del
// dispositivo risolto ne permette la comparsa anche sul lato IA (senza mano visibile).
export function maglioPresentationBerths(unit,chosenCards,ply,shots=[],resolvedUnit){
 const berths=projectMachineBerths(unit,chosenCards,ply);
 for(const shot of shots){
  const machine=resolvedUnit?.machines?.find(m=>m.id===shot.machineId);
  berths[shot.machineSlot]={...(machine||berths[shot.machineSlot]),
   id:shot.machineId,sourceCardId:shot.cardId,name:'Maglio Ferrogravitazionale',
   pending:false,maglioShot:shot};
 }
 return berths;
}
