// Eclissi Stellare — cataloghi e regole ufficiali del nuovo sistema di flotte.
// Nessuna dipendenza grafica: i componenti di battaglia e Shop usano gli stessi dati.
// Ogni effetto è esplicito: catalogo, testo e combattimento condividono la stessa regola.
import generalData from './catalogGeneral.json' with {type:'json'};
import {NEXT_COMMON_CARD_BY_ID,NEXT_COMMON_CARDS} from './newCardRegistry.js';
import {DISMANTLE_BY_ID,DISMANTLE_CARDS} from './dismantleCards.js';
import {FUSION_DENIAL_TRAP_BY_ID} from './fusionDenialTrap.js';
import {DISCARD_WEAPON_BY_ID} from './discardWeapon.js';
import {TEMP_SUPPORT_WEAPON_BY_ID} from './temporarySupportWeapons.js';
import {APPROVED_BASE_WEAPON_BY_ID} from './approvedBaseWeapons.js';
import {CONFIRMED_WEAPON_BY_ID} from './confirmedWeaponCards.js';
import {MULTI_WEAPON_BY_ID} from './multiWeaponCards.js';
import {DESIGNED_WEAPON_BY_ID} from './designedWeaponCards.js';
import {CONFIRMED_TRANSFER_WEAPON_BY_ID} from './confirmedTransferredWeapons.js';
import {CURRENT_WEAPON_BY_ID} from './weaponRarityEvolutions.js';
import {officialWeaponFacePath,officialWeaponDisplayFacePath} from './officialWeaponArt.js';
import {cardTextBasePath} from '../cardTextAssets.js';
export {ALL_WEAPON_CARDS,ALL_WEAPON_BY_ID,CURRENT_WEAPON_CARDS,CURRENT_WEAPON_BY_ID,WEAPON_BASE_CARDS,EVOLVED_WEAPON_CARDS,
 WEAPON_EVOLUTION_FAMILIES,weaponAtRarity,weaponNextEvolution} from './weaponRarityEvolutions.js';
export {DESIGNED_WEAPON_CARDS,DESIGNED_WEAPON_BY_ID,DESIGNED_WEAPONS_PLAYABLE,DESIGNED_WEAPONS_PENDING} from './designedWeaponCards.js';
export {PENDING_ADVANCED_WEAPON_RULES,PENDING_ADVANCED_WEAPON_COUNT,pendingWeaponReason} from './confirmedAdvancedWeaponMechanics.js';
export {WEAPON_BALANCE_POLICY,PROVISIONAL_ADVANCED_WEAPONS} from './provisionalWeaponProfiles.js';
export {CONFIRMED_TRANSFER_WEAPONS,CONFIRMED_TRANSFER_WEAPON_BY_ID} from './confirmedTransferredWeapons.js';
export {MULTI_WEAPON_CARDS,MULTI_WEAPON_BY_ID} from './multiWeaponCards.js';
export {CONFIRMED_WEAPON_CARDS,CONFIRMED_WEAPON_BY_ID} from './confirmedWeaponCards.js';
export {APPROVED_BASE_WEAPONS,APPROVED_BASE_WEAPON_BY_ID} from './approvedBaseWeapons.js';
import {SIPHON_ATTACK_BY_ID} from './siphonAttacks.js';
export {TEMP_SUPPORT_WEAPONS,TEMP_SUPPORT_WEAPON_BY_ID,SEQUENCE_WEAPON_IDS} from './temporarySupportWeapons.js';
export {DISCARD_WEAPON,DISCARD_WEAPONS,DISCARD_WEAPON_ID,DISCARD_WEAPON_BY_ID} from './discardWeapon.js';
export {SIPHON_ATTACK_IDS,SIPHON_ATTACKS,SIPHON_ATTACK_BY_ID} from './siphonAttacks.js';
export {FUSION_DENIAL_TRAP,FUSION_DENIAL_TRAPS,FUSION_DENIAL_TRAP_BY_ID} from './fusionDenialTrap.js';
import {ENERGY_CARDS,ENERGY_CARD_BY_ID,ENERGY_CARD_COUNT} from './energyCards.js';
import {ELEMENTAL_TERRAIN_CARDS,ELEMENTAL_TERRAIN_BY_ID} from './elementalTerrainCards.js';
export {ELEMENTAL_TERRAIN_CARDS,ELEMENTAL_TERRAIN_BY_ID} from './elementalTerrainCards.js';
import {FUSION_SHIP_CARDS,FUSION_SHIP_CARD_BY_ID,FUSION_SHIP_CARD_COUNT} from './fusionShipCards.js';
export {FUSION_SHIP_CARDS,FUSION_SHIP_CARD_BY_ID,FUSION_SHIP_CARD_COUNT} from './fusionShipCards.js';
export {ENERGY_CARDS,ENERGY_CARD_BY_ID} from './energyCards.js';
export {DISMANTLE_CARDS,DISMANTLE_BY_ID} from './dismantleCards.js';
export {NEXT_COMMON_CARDS,NEXT_COMMON_CARD_BY_ID} from './newCardRegistry.js';
import exclusiveData from './catalogExclusive.json' with {type:'json'};
import {describeEffect,validateEffectSpec} from './simpleEffects.js';
import {BOSS_CARDS,bossCard} from './bossCards.js';
import {PROGRESSION_CARDS,isProgressionCard} from './progressionCards.js';
import {getShipProgression} from './progression.js';
import {EXCLUSIVE_DESIGNS_120,NEW_EXCLUSIVE_BLUEPRINTS,EXCLUSIVE_SHIP_IDS,EXCLUSIVE_DESIGN_BY_ID} from './exclusive120.js';
import {buildExclusiveUnlockLevels} from './exclusiveUnlocks.js';
export {EXCLUSIVE_DESIGNS_120,EXCLUSIVE_SHIP_IDS} from './exclusive120.js';
export {BOSS_CARDS,bossCard} from './bossCards.js';
export {PROGRESSION_CARDS,isProgressionCard} from './progressionCards.js';
export {CAMPAIGN_SHIP_ORDER,SHIP_PROGRESSION_IDS,getShipProgression,
 getShipProgressionLevels,shipProgressionProfile,shipMaxLevel,
 shipEscortUnlockLevels,SHIP_MAX_LEVELS,boundedShipLevel} from './progression.js';

function definedCard(card,kind,source){
 const error=validateEffectSpec(card.effectSpec);
 if(error)throw new Error(card.id+': '+error);
 const normalized={...card,kind,effectSpec:Object.freeze({...card.effectSpec})};
 const effect=describeEffect(normalized);
 if(effect!==(source==='general'?card.effetto:card.effectProposed))
  throw new Error(card.id+': testo della carta diverso dalla regola eseguibile');
 return Object.freeze(normalized);
}

export const GENERAL_CARDS = Object.freeze(Object.fromEntries(generalData.carte.map(card =>
 [card.id, definedCard(card,card.sottotipo==='Terreno'?'terrain':
  card.sottotipo==='Personaggio'?'character':card.sottotipo==='Difesa'?'defense':
  ['Attacco','Strategia'].includes(card.categoria)?'attack':card.categoria==='Controllo'?'control':'support','general')]
)));
const preservedCharacters=exclusiveData.cards.filter(c=>EXCLUSIVE_SHIP_IDS.includes(c.shipId)).map(c=>{
 if(c.id==='ex-n00-01')return {...c,effectSpec:{type:'aurora',action:'cartographer'},
  effectProposed:EXCLUSIVE_DESIGN_BY_ID[c.id].effectText,nativeFace:true};
 if(c.id==='ex-c01-01')return {...c,effectSpec:{type:'lince',action:'helios'},
  effectProposed:EXCLUSIVE_DESIGN_BY_ID[c.id].effectText,nativeFace:true};
 if(c.id==='ex-c02-01')return {...c,effectSpec:{type:'prisma',action:'prisma-artisan'},
  effectProposed:EXCLUSIVE_DESIGN_BY_ID[c.id].effectText,nativeFace:true};
 if(c.id==='ex-c03-01')return {...c,effectSpec:{type:'corvo',action:'resonant-commander'},
  effectProposed:EXCLUSIVE_DESIGN_BY_ID[c.id].effectText,nativeFace:true};
 if(c.id==='ex-r01-01')return {...c,effectSpec:{type:'falco',action:'binary-gunner'},
  effectProposed:EXCLUSIVE_DESIGN_BY_ID[c.id].effectText,nativeFace:true};
 if(c.id==='ex-r02-01')return {...c,effectSpec:{type:'manta',action:'manta-navigator'},
  effectProposed:EXCLUSIVE_DESIGN_BY_ID[c.id].effectText,nativeFace:true};
 if(c.id==='ex-r04-01')return {...c,effectSpec:{type:'shark',action:'abyssal-admiral'},
  effectProposed:EXCLUSIVE_DESIGN_BY_ID[c.id].effectText,nativeFace:true};
 if(c.id==='ex-e01-01')return {...c,effectSpec:{type:'nebula',action:'mist-archon'},
  effectProposed:EXCLUSIVE_DESIGN_BY_ID[c.id].effectText,nativeFace:true};
 if(c.id==='ex-e02-01')return {...c,effectSpec:{type:'storm',action:'storm-captain'},
  effectProposed:EXCLUSIVE_DESIGN_BY_ID[c.id].effectText,nativeFace:true};
 if(c.id==='ex-l01-01')return {...c,effectSpec:{type:'royal',action:'eclipse-sovereign'},
  effectProposed:EXCLUSIVE_DESIGN_BY_ID[c.id].effectText,nativeFace:true};
 if(c.id==='ex-l03-01')return {...c,effectSpec:{type:'obsidian',action:'obsidian-magister'},
  effectProposed:EXCLUSIVE_DESIGN_BY_ID[c.id].effectText,nativeFace:true};
 if(c.id==='ex-l04-01')return {...c,effectSpec:{type:'ark',action:'astral-keeper'},
  effectProposed:EXCLUSIVE_DESIGN_BY_ID[c.id].effectText,nativeFace:true};
 return c;
});
const EXCLUSIVE_SOURCES=[...preservedCharacters,...Object.values(NEW_EXCLUSIVE_BLUEPRINTS)];
export const EXCLUSIVE_UNLOCK_LEVELS=buildExclusiveUnlockLevels(EXCLUSIVE_SOURCES);
export const EXCLUSIVE_CARDS = Object.freeze(Object.fromEntries(EXCLUSIVE_SOURCES.map(raw => {
 const card={...raw,legacyMinShipLevelDraft:raw.minShipLevelDraft,
  minShipLevelDraft:EXCLUSIVE_UNLOCK_LEVELS[raw.id]};
 return [card.id,definedCard(card,card.kind||(/Personaggio/i.test(card.category)?'character':/Difesa/i.test(card.category)?'defense':
  /Scudiera|Supporto|Tattica/i.test(card.category)?'support':
  /Controllo/i.test(card.category)?'control':
  /combo|fusione/i.test(card.category)?'combo':'attack'),'exclusive')];
})));
export const SHIP_CONFIGS = Object.freeze(Object.fromEntries(exclusiveData.shipConfigurations
 .filter(ship=>EXCLUSIVE_SHIP_IDS.includes(ship.id)).map(s=>[s.id,Object.freeze(s)])));
export const COMBO_RECIPES = Object.freeze(exclusiveData.comboRecipes.map(c=>Object.freeze(c)));
export const GENERAL_COUNT = Object.keys(GENERAL_CARDS).length;
export const EXCLUSIVE_COUNT = Object.keys(EXCLUSIVE_CARDS).length;
export const BOSS_COUNT = Object.keys(BOSS_CARDS).length;
export const BASE_CATALOG_COUNT = GENERAL_COUNT+EXCLUSIVE_COUNT+BOSS_COUNT;
export const PROGRESSION_CARD_COUNT = Object.keys(PROGRESSION_CARDS).length;
export const ENERGY_COUNT = ENERGY_CARD_COUNT;
export const TOTAL_CARD_COUNT = BASE_CATALOG_COUNT+PROGRESSION_CARD_COUNT+ENERGY_COUNT+FUSION_SHIP_CARD_COUNT+ELEMENTAL_TERRAIN_CARDS.length;
export const FLEET_TURN_SECONDS = 30;
export const FLEET_HAND_SIZE = 7;
export const FLEET_MAX_PLAYED = 3;
export const FLEET_SLOTS = Object.freeze({attack:3,defense:2,defenseVisible:1,trap:1,character:1,machine:2});
// engine rimane riconosciuto per gli effetti storici, ma non è un vitale delle nuove madri.
export const VITAL_KEYS = Object.freeze(['weapons','generator','bridge','command','engine']);
export const VITAL_LABELS = Object.freeze({engine:'Motori',weapons:'Arsenale',command:'Centralina',generator:'Generatore',bridge:'Plancia'});
export const RARITY_COPY_LIMIT = Object.freeze({Comune:5,Rara:4,Epica:3,Leggendaria:2});
export const MAX_EXCLUSIVE_UPGRADE = 3;

if(GENERAL_COUNT!==12||EXCLUSIVE_COUNT!==120||BOSS_COUNT!==12||ENERGY_COUNT!==40||Object.keys(SHIP_CONFIGS).length!==12||COMBO_RECIPES.length!==0)
 throw new Error('Catalogo ufficiale incompleto: 12 madri, 120 esclusive, 12 Personaggi e 12 Boss');

export const progressionCard = id => PROGRESSION_CARDS[id]||null;
export const generalCard = id => CURRENT_WEAPON_BY_ID[id]||CONFIRMED_TRANSFER_WEAPON_BY_ID[id]||DESIGNED_WEAPON_BY_ID[id]||MULTI_WEAPON_BY_ID[id]||CONFIRMED_WEAPON_BY_ID[id]||APPROVED_BASE_WEAPON_BY_ID[id]||SIPHON_ATTACK_BY_ID[id]||ELEMENTAL_TERRAIN_BY_ID[id]||TEMP_SUPPORT_WEAPON_BY_ID[id]||DISCARD_WEAPON_BY_ID[id]||FUSION_DENIAL_TRAP_BY_ID[id]||FUSION_SHIP_CARD_BY_ID[id]||ENERGY_CARD_BY_ID[id]||NEXT_COMMON_CARD_BY_ID[id]||DISMANTLE_BY_ID[id]||GENERAL_CARDS[id]||(!PROGRESSION_CARDS[id]?.shipId?PROGRESSION_CARDS[id]:null)||null;
export const exclusiveCard = id => EXCLUSIVE_CARDS[id]||(PROGRESSION_CARDS[id]?.shipId?PROGRESSION_CARDS[id]:null)||null;
export const card = id => generalCard(id)||exclusiveCard(id)||bossCard(id);
// La copia StackBlitz legge anche Personaggi e Difese dal medesimo
// riferimento degli asset remoti, senza copiarne i fronti nel WebContainer.
const CARD_ASSET_ROOT=(import.meta.env?.VITE_ASSET_ROOT||'/assets').replace(/\/+$/,'');
export function cardFacePath(id,level=1){
 const definition=card(id);
 if(!definition||definition.playable===false||isProgressionCard(id))return null;
 const approvedWeaponArt=officialWeaponFacePath(id);
 if(approvedWeaponArt)return approvedWeaponArt;
 if(definition.nativeFace)return null;
 if(bossCard(id))return null; // Personaggi Boss: illustrazioni ancora da creare.
 const grade=Math.max(1,Math.min(3,Math.floor(Number(level)||1)));
 return exclusiveCard(id)&&grade>1?
  CARD_ASSET_ROOT+'/fleet-next-card-upgrades/'+id+'-g'+grade+'.svg':
  CARD_ASSET_ROOT+'/fleet-next-cards/'+id+'.svg';
}
// I fronti approvati originali conservano percorso e hash; il renderer usa la variante cromatica verificata.
export function cardDisplayFacePath(id,level=1){
 const source=cardFacePath(id,level);
 return source?(cardTextBasePath(id)||officialWeaponDisplayFacePath(id)||source):null;
}
export const shipConfig = id => SHIP_CONFIGS[id]||null;
export function cardCopyLimit(id){
 const c=card(id);
 if(!c)return 0;
 if(bossCard(id))return 1;
 if(CURRENT_WEAPON_BY_ID[id])return c.maxCopiesPerDeck;
 if(ENERGY_CARD_BY_ID[id]||FUSION_SHIP_CARD_BY_ID[id]||FUSION_DENIAL_TRAP_BY_ID[id]||DISCARD_WEAPON_BY_ID[id]||TEMP_SUPPORT_WEAPON_BY_ID[id]||APPROVED_BASE_WEAPON_BY_ID[id]||CONFIRMED_WEAPON_BY_ID[id]||MULTI_WEAPON_BY_ID[id]||DESIGNED_WEAPON_BY_ID[id]||CONFIRMED_TRANSFER_WEAPON_BY_ID[id])return c.maxCopiesPerDeck;
 if(ELEMENTAL_TERRAIN_BY_ID[id])return RARITY_COPY_LIMIT[c.rarita]||0;
 if(NEXT_COMMON_CARD_BY_ID[id]||DISMANTLE_BY_ID[id])return c.maxCopiesPerDeck||RARITY_COPY_LIMIT[c.rarita]||0;
 if(isProgressionCard(id))return c.shipId?c.maxCopiesInAutoPackageDraft:RARITY_COPY_LIMIT[c.rarita]||0;
 return exclusiveCard(id)?(c.maxCopiesInAutoPackageDraft||1):(RARITY_COPY_LIMIT[c.rarita]||0);
}
export function cardRole(id){
 const def=card(id);
 if(!def)return null;
 if(def.kind==='terrain')return 'terrain';
 if(def.kind==='character')return 'character';
 if(def.kind==='defense')return 'defense';
 if(def.kind==='control'||def.kind==='support')return 'support';
 return 'attack';
}
export function unlockedParts(shipId,level){
 return [...(getShipProgression(shipId,level)?.vitalIds||[])];
}
export function requiredEscortCount(shipId,level){
 return getShipProgression(shipId,level)?.escortCount||0;
}
export function requiredReserveCount(shipId,level){
 return getShipProgression(shipId,level)?.reserveCount||0;
}
export function supportGrade(shipId,level,index=0){
 const profile=getShipProgression(shipId,level);
 return profile?[...profile.escortGrades,...profile.reserveGrades][index]||0:0;
}
export const exclusiveUnlockLevel=id=>EXCLUSIVE_CARDS[id]?.minShipLevelDraft??PROGRESSION_CARDS[id]?.minShipLevelDraft??null;
export function exclusiveUnlocked(id,shipId,level){
 const def=exclusiveCard(id),profile=getShipProgression(shipId,level);
 if(!def||!profile||def.shipId!==shipId||profile.level<def.minShipLevelDraft)return false;
 const parts=profile.vitalIds;
 return def.requiredOwnParts.every(part=>parts.includes(part))&&
  profile.escortCount>=def.requiredEscortCount;
}
export function exclusiveOperational(id,mother,escorts=[]){
 if(!exclusiveUnlocked(id,mother.id,mother.level))return false;
 if(exclusiveCard(id)?.playable===false)return false;
 const def=exclusiveCard(id);
 return exclusiveUnlocked(id,mother.id,mother.operationalLevel||mother.level)&&
  def.requiredOwnParts.every(id=>mother.parts.some(p=>p.id===id&&!p.destroyed&&!p.dismantled))&&
  escorts.filter(e=>e.hp>0&&!e.destroyed&&e.linked!==false).length>=def.requiredEscortCount;
}
export function eligibleExclusives(shipId,level){
 return [...Object.values(EXCLUSIVE_CARDS),...Object.values(PROGRESSION_CARDS).filter(c=>c.shipId)]
  .filter(def=>exclusiveUnlocked(def.id,shipId,level));
}
export function effectiveDeck(baseDeck,shipId,level,{independentSupports=false}={}){
 const base=Array.isArray(baseDeck)?baseDeck:[];
 // Il mazzo non pesca effetti nuovi che non esistono ancora nel motore.
 // Le tre vecchie Fusioni sono state sostituite con carte tattiche eseguibili.
 // Le sole carte prog-fusion-* restano fuori dal mazzo ufficiale.
 const ex=eligibleExclusives(shipId,level).filter(c=>c.playable!==false&&
  !c.id.startsWith('prog-fusion-'))
  .flatMap(c=>Array(c.maxCopiesInAutoPackageDraft||1).fill(c.id));
 return [...base,...ex];
}
export function countDeck(deck){
 const n={};for(const id of deck)n[id]=(n[id]||0)+1;return n;
}
export function deckFromCounts(counts){
 return Object.entries(counts).flatMap(([id,n])=>Array(Math.max(0,Math.floor(n||0))).fill(id));
}
export function comboForShip(shipId){
 return COMBO_RECIPES.filter(c=>c.active===true&&c.navicella===shipId);
}
export function comboCardIds(recipe){
 const defs=Object.values(EXCLUSIVE_CARDS).filter(c=>c.shipId===recipe.navicella);
 return (recipe.carte_effettive_da_giocare||[]).map(name=>defs.find(d=>d.name===name)?.id).filter(Boolean);
}
export function isComboReady(recipe,mother,escorts,playedIds,previousIds=[]){
 if(recipe.active!==true)return false;
 if(recipe.navicella!==mother.id||mother.level<recipe.livello_minimo)return false;
 if(escorts.filter(e=>e.hp>0&&!e.destroyed&&e.linked!==false).length<recipe.scudiere_richieste)return false;
 if(!recipe.vitali_madre_richiesti.every(id=>mother.parts.some(p=>p.id===id&&!p.destroyed)))return false;
 const have=countDeck([...previousIds,...playedIds]);
 const needed=countDeck(comboCardIds(recipe));
 return Object.entries(needed).every(([id,n])=>have[id]>=n);
}
export function comboRequiredSequence(recipe){
 return comboCardIds(recipe);
}
export function generalCatalogStats(){
 const rarity={};const category={};
 for(const c of Object.values(GENERAL_CARDS)){
  rarity[c.rarita]=(rarity[c.rarita]||0)+1;
  category[c.categoria]=(category[c.categoria]||0)+1;
 }
 return {count:GENERAL_COUNT,approvedNewCommon:NEXT_COMMON_CARDS.length,rarity,category,exclusive:EXCLUSIVE_COUNT,boss:BOSS_COUNT,
  baseCatalog:BASE_CATALOG_COUNT,progression:PROGRESSION_CARD_COUNT,energy:ENERGY_COUNT,
  total:TOTAL_CARD_COUNT,elementalTerrains:ELEMENTAL_TERRAIN_CARDS.length,
  fusionShipCards:FUSION_SHIP_CARD_COUNT,ships:12,recipes:COMBO_RECIPES.filter(c=>c.active===true).length,archivedRecipes:COMBO_RECIPES.length};
}
