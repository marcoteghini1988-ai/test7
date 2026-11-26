// I colpi visualizzati provengono dal motore: la rarità cambia la finitura,
// mai il numero di danni o di bersagli deciso dalla Carta Arma.
import {projectMachineBerths} from './fleetNext/battlePresentation.js';
import {ALL_WEAPON_BY_ID} from './fleetNext/weaponRarityEvolutions.js';
import {metalWeaponEffectProfile} from './metalWeaponBattleVisuals.js';
import {chainWeaponEffectProfile} from './chainWeaponBattleVisuals.js';
import {precisionWeaponEffectProfile,cascadeImpactPresentation} from './precisionWeaponBattleVisuals.js';
import {ionicWeaponEffectProfile} from './ionicWeaponBattleVisuals.js';
import {coreThunderEffectProfile} from './coreThunderBattleVisuals.js';
import {approvedWeaponSalvo} from './fleetNext/approvedWeaponSalvos.js';

export const MAGLIO_CARD_ID='weapon-confirmed-metallic-maglio';
export const MAGLIO_VARIANTS=Object.freeze([
 {id:MAGLIO_CARD_ID,rarity:'Comune',folder:'',impactScale:1},
 {id:MAGLIO_CARD_ID+'-rarity-r',rarity:'Rara',folder:'rara/',impactScale:1.1},
 {id:MAGLIO_CARD_ID+'-rarity-e',rarity:'Epica',folder:'epica/',impactScale:1.2},
 {id:MAGLIO_CARD_ID+'-rarity-l',rarity:'Leggendaria',folder:'leggendaria/',impactScale:1.34}
].map(Object.freeze));
export const maglioVariant=id=>MAGLIO_VARIANTS.find(v=>v.id===id)||null;
// Volo leggibile dei proiettili approvati; il timer del turno riparte a fine impatto.
export const MAGLIO_FLIGHT_MS=1400;
export const MAGLIO_IMPACT_MS=950;
export const weaponShotStartMs=revealCount=>980+revealCount*520;
export const MAGLIO_FX_MS=weaponShotStartMs(1)+MAGLIO_FLIGHT_MS+MAGLIO_IMPACT_MS+150;
export const MAGLIO_SHOT_GAP_MS=260;
const ASSET_ROOT=(import.meta.env?.VITE_ASSET_ROOT||'/assets').replace(/\/+$/,'');
export const MAGLIO_PROJECTILE_ATLAS=ASSET_ROOT+'/fleet-weapons/maglio/projectiles/approved-atlas.png';
export const MAGLIO_ATLAS_SIZE=Object.freeze({width:1922,height:818,cellWidth:480.5});
const RARITY_TIER=Object.freeze({Comune:0,Rara:1,Epica:2,Leggendaria:3});
// Le altre carte mantengono il segnaposto attuale finché fronte, sparo e suono
// non vengono progettati e approvati insieme, per ID di carta e rarità.
const LEGACY_EFFECT=Object.freeze({
 kind:'legacy-pulse',core:'#9deaff',glow:'#8eeaff',secondary:'#ffad48',
 impactCore:'#fff9dc',impactGlow:'#ffab4b',impactSecondary:'#ffad48'
});
const MAGLIO_FINISH=Object.freeze([
 {core:'#ffe2b5',glow:'#ff7b16',secondary:'#ffb34f'},
 {core:'#ffe2b8',glow:'#ff8425',secondary:'#f6be77'},
 {core:'#fff0d2',glow:'#ff8b25',secondary:'#fff4df'},
 {core:'#fff5ff',glow:'#b38aff',secondary:'#7fdfff'}
]);
export function weaponEffectProfile(id,shot){
 const definition=ALL_WEAPON_BY_ID[id];
 if(!definition)return null;
 const tier=RARITY_TIER[definition.rarita]??0;
 const maglio=!!maglioVariant(id);
 const finish=maglio?MAGLIO_FINISH[tier]:LEGACY_EFFECT;
 const profile={
  cardId:id,familyId:definition.weaponFamilyId||id,
  rarity:definition.rarita,elementId:definition.elementId,
  pattern:definition.effectSpec?.weaponProfile?.pattern||definition.effectSpec?.damageMode,
  kind:maglio?'gravity-maul':LEGACY_EFFECT.kind,
  approved:maglio,tier:maglio?tier:0,
  flightMs:maglio?MAGLIO_FLIGHT_MS:470,impactMs:maglio?MAGLIO_IMPACT_MS:700,
  ...(maglio?{projectileArt:MAGLIO_PROJECTILE_ATLAS,
   spriteCell:tier,spriteSize:142+tier*10}:{}),
  trailBands:maglio?1+tier:1,impactRings:maglio?1+tier:1,
  scale:maglio?1+tier*.12:1,impactScale:maglioVariant(id)?.impactScale||1,
  ...finish,
  ...(maglio?{chargeMs:420,sequence:['piston-pressure','orbital-sling','gravity-well','prismatic-implosion'][tier],
   sound:{charge:'maglio_charge_'+['common','rare','epic','legendary'][tier],
   fire:'maglio_fire_'+['common','rare','epic','legendary'][tier],
   impact:'maglio_impact_'+['common','rare','epic','legendary'][tier]}}:{sound:null}),
  ...metalWeaponEffectProfile(id),...chainWeaponEffectProfile(id,shot),...precisionWeaponEffectProfile(id,shot),...ionicWeaponEffectProfile(id),...coreThunderEffectProfile(id,shot)
 };
 const salvo=approvedWeaponSalvo(id);
 const flight=salvo?.count>1?salvo.flightMs:profile.flightMs;
 const last=!!shot?.salvoCount&&shot.salvoIndex===shot.salvoCount-1;
 const charge=shot?.finisher&&salvo?.style==='six-plus-lance'?360:shot?.salvoIndex>0?0:profile.chargeMs;
 return Object.freeze({...profile,...(salvo?{salvoCount:salvo.count,choreography:salvo.style}:{}),salvoLast:last,
  flightMs:shot?.cascadeTransfer?profile.flightMs:shot?.finisher&&salvo?.style==='six-plus-lance'?1250:flight,
  impactMs:shot?.salvoCount>1&&!last?Math.round(profile.impactMs*.48):profile.impactMs,
  chargeMs:charge,sound:profile.sound?{...profile.sound,charge:charge?profile.sound.charge:null}:profile.sound});
}
// Ancora centrale per i consumatori storici. La scena approvata usa
// weaponLaunchOrigin, con coordinate variabili lungo il bordo corretto.
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
 for(const [eventIndex,event] of events.entries()){
  if(!['A','B'].includes(event?.who))continue;
  if(['weapon-base-shot','weapon-cryo-shot'].includes(event.kind)){
   shots.push({...event,delayMs:shots.length*MAGLIO_SHOT_GAP_MS,
    fires:!event.blocked&&event.actualDamage>0&&!!event.targetKind&&!!event.targetId});
  }else if(['weapon-multi-shot','weapon-designed-shot','weapon-provisional-shot'].includes(event.kind)){
   let groupStart=shots.length*MAGLIO_SHOT_GAP_MS;
   if(event.jawCombo){
    const arrivals=shots.filter(s=>s.who===event.who&&event.jawMachineIds?.includes(s.machineId))
     .map(s=>(s.delayMs||0)+(weaponEffectProfile(s.cardId,s)?.flightMs||1450));
    groupStart=Math.max(groupStart,...arrivals.map(t=>t+630));
   }
   for(const [impactIndex,hit] of (event.impacts||[]).entries())shots.push({...event,
    visualGroupId:event.who+':'+eventIndex,impactIndex,
    defenseBlocked:!!hit.defenseBlocked||event.pattern==='induction'&&hit.actualDamage===0&&
     events[eventIndex-1]?.kind==='block'&&events[eventIndex-1]?.who===event.who,
    targetKind:hit.targetKind,targetId:hit.targetId,actualDamage:hit.actualDamage,
    nominalDamage:hit.nominalDamage,projectileHits:hit.projectileHits,destroyed:!!hit.destroyed,
    delayMs:event.jawCombo?groupStart:shots.length*MAGLIO_SHOT_GAP_MS,
    ...cascadeImpactPresentation(event,impactIndex,events,groupStart),
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
// Aggregate weapon activations remain available for rules, HP and combo
// diagnostics. The live scene consumes only projectile packets issued by
// the combat emitter, with exact per-projectile damage attribution.
export function fleetWeaponProjectiles(events=[]){
 return fleetWeaponShots(events).flatMap(shot=>{
  const packets=shot.projectileHits;
  if(!packets?.length)return [shot];
  return packets.map(packet=>({...shot,projectileHits:undefined,
   activationDamage:shot.actualDamage,actualDamage:packet.actualDamage,
   salvoIndex:packet.index,salvoCount:packet.count,finisher:packet.finisher,
   salvoLast:packet.index===packet.count-1,
   visualScale:packet.visualScale,salvoStyle:shot.salvo?.style,
   transferEnergySpent:packet.index===0?(shot.transferEnergySpent||0):0,
   delayMs:(shot.delayMs||0)+packet.delayMs,
   // A zero allocation can still be a real round in an authorized volley.
   // It never claims extra HP; a completely blocked volley stays suppressed.
   fires:shot.fires,defenseBlocked:shot.defenseBlocked}));
 });
}
export function maglioResolutionMs(events=[],selectedCards=[]){
 return weaponResolutionMs(events,selectedCards);
}

// La stessa lista serve a calcolare i tempi e a mostrare le carte. I doppioni
// scelti restano due carte; un'Arma già sul tavolo aggiunge una sola anteprima.
export function weaponVisualCards(shots=[],selectedCards=[]){
 const cards=selectedCards.map(c=>typeof c==='string'?{id:c,grade:1}:c);
 for(const shot of shots)if(!cards.some(c=>c.id===shot.cardId))
  cards.push({id:shot.cardId,grade:1});
 return cards;
}
export function weaponResolutionMs(events=[],selectedCards=[]){
 const allShots=fleetWeaponProjectiles(events),shots=allShots.filter(shot=>shot.fires||shot.defenseBlocked);
 const breaks=events.filter(e=>e.kind==='weapon-break-defense'&&chainWeaponEffectProfile(e.cardId));
 const coreExpiry=events.some(e=>e.kind==='weapon-core-expired');
 const coreFeedback=allShots.some(s=>s.coreChargeLost||s.energySpent>0&&coreThunderEffectProfile(s.cardId));
 if(!shots.length&&!breaks.length&&!coreExpiry&&!coreFeedback)return 0;
 const start=weaponShotStartMs(weaponVisualCards(allShots,selectedCards).length);
 const end=Math.max(0,...shots.map(shot=>{
  const profile=weaponEffectProfile(shot.cardId,shot);
  return start+(shot.delayMs||0)+(profile?.flightMs||470)+(profile?.impactMs||700)+150;
 }));
 // Conserva l'attesa precedente degli effetti provvisori delle altre Armi.
 const legacy=shots.some(s=>!weaponEffectProfile(s.cardId)?.approved)?4850+(shots.length-1)*MAGLIO_SHOT_GAP_MS:0;
 // La rimozione di una Difesa è un evento autonomo, anche se lo sparo è bloccato.
 return Math.max(legacy,end,breaks.length?start+1100:0,coreFeedback?start+150:0,
  coreExpiry?weaponExpiryStartMs(allShots,start)+720:0);
}
export function weaponExpiryStartMs(shots=[],start=0){
 return Math.max(160,...shots.filter(s=>s.fires||s.defenseBlocked).map(s=>{
  const p=weaponEffectProfile(s.cardId,s);return start+(s.delayMs||0)+(p?.flightMs||470)+(p?.impactMs||700)+150;
 }));
}
// Durante gli effetti la plancia conserva gli HP precedenti. Lo snapshot
// del Maglio risolto mantiene il nome nello slot anche sul lato IA.
export function maglioPresentationBerths(unit,chosenCards,ply,shots=[],resolvedUnit){
 const berths=projectMachineBerths(unit,chosenCards,ply);
 for(const shot of shots){
  if(!weaponEffectProfile(shot.cardId)?.approved)continue;
  const machine=resolvedUnit?.machines?.find(m=>m.id===shot.machineId);
  berths[shot.machineSlot]={...(machine||berths[shot.machineSlot]),
   id:shot.machineId,sourceCardId:shot.cardId,name:ALL_WEAPON_BY_ID[shot.cardId].name,
   pending:false,maglioShot:shot};
 }
 return berths;
}
