// Fixture di collaudo: usa il motore e la plancia ufficiali, senza inventario o ricompense.
import {createFleetNextBattle,resolvePreparedFleetTurn} from '../src/fleetNext/combat.js';
import {HP_SYNC_RULESET} from '../src/fleetNext/hpSynchronization.js';
import {MAGLIO_CARD_ID,maglioVariant} from '../src/maglioBattleVisuals.js';
import {WEAPON_NEAR_FINAL_BY_ID} from '../src/fleetNext/weaponRarityEvolutions.js';
import {chainWeaponVariant,GRAPPLE_ID,COLLISION_ID} from '../src/chainWeaponBattleVisuals.js';
import {precisionWeaponVariant} from '../src/precisionWeaponBattleVisuals.js';

export function createMaglioReviewBattle({nowMs=Date.now(),slot=0,blocked=false,
 cardId=MAGLIO_CARD_ID,supports=false,wounded=false,focus=0,boost=false,
 shipA='N00',shipB='C01',supportModels=['C02','C03'],fused=false,secondTurn=false,
 supportCount=2,energyCards=0,withDefense=false,expiredCombo=false,
 cascadeMode='none',ownStage=1}={}){
 const chain=chainWeaponVariant(cardId),collision=chain?.kind==='alloy-collision';
 const precision=precisionWeaponVariant(cardId);
 const grappleId=rarityGrapple(cardId),comboId=cardId.endsWith('-rarity-l')?COLLISION_ID+'-rarity-l':COLLISION_ID;
 const rarity=maglioVariant(cardId)?.rarity||WEAPON_NEAR_FINAL_BY_ID[cardId]?.rarita||'Comune';
 const roster=who=>supports?supportModels.slice(0,supportCount).map((model,index)=>({
  id:'support-model-'+model.toLowerCase(),instanceId:'maglio-review-'+who+'-'+index,
  slot:index,rarita:rarity})):[];
 const b=createFleetNextBattle({shipA,shipB,raritaA:rarity,raritaB:rarity,
  supportRosterA:boost?[{id:'support-model-r01',instanceId:'review-booster',slot:0,rarita:rarity}]:roster('A'),
  supportRosterB:roster('B'),deckA:[],deckB:[],mode:'pvp',
  ruleset:HP_SYNC_RULESET,newGeneratorCombat:true,strategicNoDeterioration:true,
  seed:20261122,nowMs});
 for(const side of Object.values(b.sides)){
  side.hand=collision?[grappleId,cardId,...Array(5).fill('energy-metallic')]:
   chain?.kind==='magnetic-grapple'?[cardId,comboId,...Array(5).fill('energy-metallic')]:
   [cardId,...Array(6).fill('energy-metallic')];
  // Il Maglio base è autonomo: senza Energie evitiamo anche il colpo
  // del Generatore IA, così la prova visiva isola soltanto questa Arma.
  side.energyPile=Array(energyCards).fill('energy-metallic');
  if(precision)side.elementalCharges=energyCards?{metallic:energyCards}:{};
  side.deck=Array(25).fill('energy-metallic');
  side.discard=[];
  // La configurazione slot 2 serve a verificare anche il secondo alloggiamento.
  if(collision?slot===0:slot===1)side.machines=[{id:'review-existing',sourceCardId:'weapon-confirmed-metallic-slitta',
   name:'Cannone a Slitta d’Acciaio',slot:0,hp:1,maxHp:1,power:0,untilPly:99,deployedPly:-2}];
 }
 if(supports&&wounded)for(const side of Object.values(b.sides)){
  if(side.escorts[focus])side.escorts[focus].hp=1;
 }
 if(supports&&precision?.kind==='cascade-piercer'&&cascadeMode!=='none'){
  for(const side of Object.values(b.sides))
   side.escorts.slice(0,cascadeMode==='two'?2:1).forEach(e=>{e.hp=1;});
 }
 if(supports&&fused)for(const side of Object.values(b.sides)){
  if(side.escorts[0]){side.escorts[0].fused=true;
   side.escorts[0].fusionModelIds=[side.escorts[0].shipModelId,'C01'];}
 }
 let state=b;
 if(collision){
  for(const who of ['A','B']){
   const result=resolvePreparedFleetTurn(state,who,{cards:[0],targetKind:'part',targetId:'weapons',partId:'weapons'},nowMs);
   if(!result.ok)throw new Error('Preparazione Ganasce: '+result.reason);
   state=result.battle;
  }
  for(const side of Object.values(state.sides))side.machines=side.machines.filter(m=>m.id!=='review-existing');
  if(expiredCombo){
   // Il passaggio recupera la prima carta: la seconda copia viene realmente
   // pescata, così possiamo tentare la combo fuori tempo senza crearne lo stato.
   for(const side of Object.values(state.sides))side.deck.unshift(cardId);
   for(const who of ['A','B'])state=resolvePreparedFleetTurn(state,who,{cards:[],pass:true},nowMs).battle;
   for(const side of Object.values(state.sides)){
    const i=side.hand.indexOf(cardId);if(i>=0)side.hand.unshift(...side.hand.splice(i,1));
   }
  }
 }
 if(withDefense)for(const [who,side] of Object.entries(state.sides)){
  // Una vera Difesa pubblica del catalogo, con protezione e fonte coerenti.
  side.defenses.push({id:'gen-227',source:'review-shield-'+who,hidden:false,untilPly:99});
  side.protections.push({id:'gen-227',source:'review-shield-'+who,kind:'protect',target:'escort',escortSlot:side.escorts[0]?.slot??0,remaining:1,untilPly:99});
 }
 if(blocked)state.sides.A.fireDisabledUntil=20;
 // Prova della conversione: due veri turni precedenti, non HP o carica
 // aggiunti dal pannello. Il terzo turno usa la stessa macchina già posata.
 if(secondTurn&&cardId.startsWith('weapon-designed-metallic-recuperatore-termobalistico')){
  for(const who of ['A','B']){
   const result=resolvePreparedFleetTurn(state,who,{cards:[0],
    targetKind:'part',targetId:'weapons',partId:'weapons'},nowMs);
   if(!result.ok)throw new Error('Preparazione secondo turno: '+result.reason);
   state=result.battle;
  }
  return state;
 }
 if(precision&&ownStage>1){
  for(let stage=1;stage<Math.min(ownStage,precision.kind==='cascade-piercer'?3:2);stage++){
   for(const who of ['A','B']){
    const r=resolvePreparedFleetTurn(state,who,{cards:stage===1?[0]:[],pass:stage!==1,
     targetKind:'part',targetId:'weapons',partId:'weapons'},nowMs);
    if(!r.ok)throw new Error('Preparazione turno proprio '+stage+': '+r.reason);
    state=r.battle;
   }
  }
 }
 return state;
}
function rarityGrapple(id){
 return id.endsWith('-rarity-l')?GRAPPLE_ID+'-rarity-l':id===COLLISION_ID?GRAPPLE_ID+'-rarity-e':GRAPPLE_ID;
}
