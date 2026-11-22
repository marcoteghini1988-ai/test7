// Quattro dispositivi ricavati dalle carte ufficiali; nessun calcolo di danni nel renderer.
import {projectMachineBerths} from './fleetNext/battlePresentation.js';

export const MAGLIO_CARD_ID='weapon-confirmed-metallic-maglio';
export const MAGLIO_VARIANTS=Object.freeze([
 {id:MAGLIO_CARD_ID,rarity:'Comune',folder:'',playerHead:[50,17],enemyHead:[50,73],impactScale:1},
 {id:MAGLIO_CARD_ID+'-rarity-r',rarity:'Rara',folder:'rara/',playerHead:[50,17],enemyHead:[50,73],impactScale:1.08},
 {id:MAGLIO_CARD_ID+'-rarity-e',rarity:'Epica',folder:'epica/',playerHead:[50,17],enemyHead:[50,73],impactScale:1.16},
 {id:MAGLIO_CARD_ID+'-rarity-l',rarity:'Leggendaria',folder:'leggendaria/',playerHead:[50,17],enemyHead:[50,62],impactScale:1.24}
].map(Object.freeze));
export const maglioVariant=id=>MAGLIO_VARIANTS.find(v=>v.id===id)||null;
export const MAGLIO_FX_MS=2200;
export const MAGLIO_SHOT_GAP_MS=260;
export function maglioModelPath(id){
 const variant=maglioVariant(id);
 return variant?'/assets/fleet-weapons/maglio/models/'+(variant.folder.slice(0,-1)||'comune')+'.glb':null;
}
export function maglioArtwork(id,side){
 const variant=maglioVariant(id);
 return variant?'/assets/fleet-weapons/maglio/'+variant.folder+
  (side==='enemy'?'enemy':'player')+'.webp':null;
}
export function maglioShots(events=[]){
 return events.filter(e=>e?.kind==='weapon-base-shot'&&maglioVariant(e.cardId)&&
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
