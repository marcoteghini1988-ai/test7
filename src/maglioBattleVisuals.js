// I colpi visualizzati provengono dal motore: la rarità cambia la finitura,
// mai il numero di danni o di bersagli deciso dalla Carta Arma.
import {projectMachineBerths} from './fleetNext/battlePresentation.js';
import {ALL_WEAPON_BY_ID} from './fleetNext/weaponRarityEvolutions.js';

export const MAGLIO_CARD_ID='weapon-confirmed-metallic-maglio';
export const MAGLIO_VARIANTS=Object.freeze([
 {id:MAGLIO_CARD_ID,rarity:'Comune',folder:'',impactScale:1},
 {id:MAGLIO_CARD_ID+'-rarity-r',rarity:'Rara',folder:'rara/',impactScale:1.1},
 {id:MAGLIO_CARD_ID+'-rarity-e',rarity:'Epica',folder:'epica/',impactScale:1.2},
 {id:MAGLIO_CARD_ID+'-rarity-l',rarity:'Leggendaria',folder:'leggendaria/',impactScale:1.34}
].map(Object.freeze));
export const maglioVariant=id=>MAGLIO_VARIANTS.find(v=>v.id===id)||null;
// Tempo per volo delle carte, lettura del fronte, raffica e reazione dello scafo.
export const MAGLIO_FX_MS=4850;
export const MAGLIO_SHOT_GAP_MS=260;
const RARITY_TIER=Object.freeze({Comune:0,Rara:1,Epica:2,Leggendaria:3});
// Le altre carte mantengono il segnaposto attuale finché fronte, sparo e suono
// non vengono progettati e approvati insieme, per ID di carta e rarità.
const LEGACY_EFFECT=Object.freeze({
 kind:'legacy-pulse',core:'#9deaff',glow:'#8eeaff',secondary:'#ffad48',
 impactCore:'#fff9dc',impactGlow:'#ffab4b',impactSecondary:'#ffad48'
});
const MAGLIO_FINISH=Object.freeze([
 {core:'#d4dee7',glow:'#8da0ac',secondary:'#ffaf5c'},
 {core:'#fce1ba',glow:'#d69c69',secondary:'#ffc085'},
 {core:'#f5fbff',glow:'#9dd6f2',secondary:'#dae7f5'},
 {core:'#ffffff',glow:'#87eaff',secondary:'#e7a8ff'}
]);
export function weaponEffectProfile(id){
 const definition=ALL_WEAPON_BY_ID[id];
 if(!definition)return null;
 const tier=RARITY_TIER[definition.rarita]??0;
 const maglio=!!maglioVariant(id);
 const finish=maglio?MAGLIO_FINISH[tier]:LEGACY_EFFECT;
 return Object.freeze({
  cardId:id,familyId:definition.weaponFamilyId||id,
  rarity:definition.rarita,elementId:definition.elementId,
  pattern:definition.effectSpec?.weaponProfile?.pattern||definition.effectSpec?.damageMode,
  kind:maglio?'gravity-maul':LEGACY_EFFECT.kind,
  approved:maglio,tier:maglio?tier:0,
  trailBands:maglio?1+tier:1,impactRings:maglio?1+tier:1,
  scale:maglio?1+tier*.12:1,impactScale:maglioVariant(id)?.impactScale||1,
  ...finish,
  ...(maglio?{sound:{fire:'maglio_fire_'+['common','rare','epic','legendary'][tier],
   impact:'maglio_impact_'+['common','rare','epic','legendary'][tier]}}:{sound:null})
 });
}
// Centro della porta USB del dispositivo locale, centro del bordo remoto.
// Entrambe le parti usano la stessa coordinata x: nessun colpo nasce di lato.
export function weaponPortalOrigin(who){
 return who==='A'?Object.freeze({x:225,y:812,edge:'bottom-usb'}):
  who==='B'?Object.freeze({x:225,y:-12,edge:'top-opponent'}):null;
}
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
  if(!['A','B'].includes(event?.who))continue;
  if(['weapon-base-shot','weapon-cryo-shot'].includes(event.kind)){
   shots.push({...event,delayMs:shots.length*MAGLIO_SHOT_GAP_MS,
    fires:!event.blocked&&event.actualDamage>0&&!!event.targetKind&&!!event.targetId});
  }else if(['weapon-multi-shot','weapon-designed-shot','weapon-provisional-shot'].includes(event.kind)){
   for(const hit of event.impacts||[])shots.push({...event,
    targetKind:hit.targetKind,targetId:hit.targetId,actualDamage:hit.actualDamage,
    delayMs:shots.length*MAGLIO_SHOT_GAP_MS,
    fires:hit.actualDamage>0&&!!hit.targetKind&&!!hit.targetId});
  }else if(event.kind==='impact'&&event.independentWeaponShot&&event.weaponContributors?.length){
   // Le Armi storiche sommano il danno in un solo impatto: una traiettoria
   // per ogni bersaglio reale, senza inventare proiettili o danni separati.
   for(const hit of event.targets||[])shots.push({
    who:event.who,kind:'weapon-combined-shot',cardId:event.weaponContributors[0],
    contributors:event.weaponContributors,machineSlot:0,
    targetKind:hit.kind,targetId:hit.id,actualDamage:hit.damage,
    delayMs:shots.length*MAGLIO_SHOT_GAP_MS,
    fires:hit.damage>0&&!!hit.kind&&!!hit.id
   });
  }
 }
 return shots;
}
export function maglioResolutionMs(events=[]){
 const shots=fleetWeaponShots(events).filter(shot=>shot.fires);
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
