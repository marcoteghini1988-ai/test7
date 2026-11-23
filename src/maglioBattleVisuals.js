// Fronti ufficiali e colpi del motore; la plancia non carica modelli delle Carte Arma.
import {projectMachineBerths} from './fleetNext/battlePresentation.js';

export const MAGLIO_CARD_ID='weapon-confirmed-metallic-maglio';
export const MAGLIO_VARIANTS=Object.freeze([
 {id:MAGLIO_CARD_ID,rarity:'Comune',folder:'',playerHead:[50,17],enemyHead:[50,73],impactScale:1},
 {id:MAGLIO_CARD_ID+'-rarity-r',rarity:'Rara',folder:'rara/',playerHead:[50,17],enemyHead:[50,73],impactScale:1.08},
 {id:MAGLIO_CARD_ID+'-rarity-e',rarity:'Epica',folder:'epica/',playerHead:[50,17],enemyHead:[50,73],impactScale:1.16},
 {id:MAGLIO_CARD_ID+'-rarity-l',rarity:'Leggendaria',folder:'leggendaria/',playerHead:[50,17],enemyHead:[50,62],impactScale:1.24}
].map(Object.freeze));
export const maglioVariant=id=>MAGLIO_VARIANTS.find(v=>v.id===id)||null;
// Tempo per volo delle carte, lettura del fronte, raffica e reazione dello scafo.
export const MAGLIO_FX_MS=4850;
export const MAGLIO_SHOT_GAP_MS=260;
export const maglioHammerCount=id=>({Comune:2,Rara:3,Epica:5,Leggendaria:7})[maglioVariant(id)?.rarity]||0;
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
// Le altre Carte Arma usano lo stesso ingresso dal bordo, con impulsi energetici.
// Ogni bersaglio e ogni danno vengono dagli eventi del motore, mai dal renderer.
export function fleetWeaponShots(events=[]){
 const shots=[];
 for(const event of events){
  if(!['A','B'].includes(event?.who)||!event?.cardId)continue;
  if(['weapon-base-shot','weapon-cryo-shot'].includes(event.kind)){
   shots.push({...event,delayMs:shots.length*MAGLIO_SHOT_GAP_MS,
    fires:!event.blocked&&event.actualDamage>0&&!!event.targetKind&&!!event.targetId});
  }else if(['weapon-multi-shot','weapon-designed-shot'].includes(event.kind)){
   for(const hit of event.impacts||[])shots.push({...event,
    targetKind:hit.targetKind,targetId:hit.targetId,actualDamage:hit.actualDamage,
    delayMs:shots.length*MAGLIO_SHOT_GAP_MS,
    fires:hit.actualDamage>0&&!!hit.targetKind&&!!hit.targetId});
  }
 }
 return shots;
}
export function maglioResolutionMs(events=[]){
 const shots=fleetWeaponShots(events);
 return shots.length?MAGLIO_FX_MS+(shots.length-1)*MAGLIO_SHOT_GAP_MS:0;
}
// Durante gli effetti la plancia conserva gli HP precedenti. Lo snapshot
// del Maglio risolto mantiene il nome nello slot anche sul lato IA.
export function maglioPresentationBerths(unit,chosenCards,ply,shots=[],resolvedUnit){
 const berths=projectMachineBerths(unit,chosenCards,ply);
 for(const shot of shots){
  if(!maglioVariant(shot.cardId))continue;
  const machine=resolvedUnit?.machines?.find(m=>m.id===shot.machineId);
  berths[shot.machineSlot]={...(machine||berths[shot.machineSlot]),
   id:shot.machineId,sourceCardId:shot.cardId,name:'Maglio Ferrogravitazionale',
   pending:false,maglioShot:shot};
 }
 return berths;
}
