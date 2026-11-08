// Eclissi Stellare — Punto 30: collection and construction of the SPECIAL deck.
// Persistent data is intentionally separate from legacy ship collection saves.
// Prices / monetization are NOT defined: packs are granted once for a unique
// completed campaign sector. Pack sizes / drop rates are still prototype settings;
// deck size and duplicate limit are confirmed gameplay rules.
import {SPECIAL_CARD_CATALOG,SPECIAL_DECK_SIZE,SPECIAL_DECK_COPY_LIMIT,specialCardMaxCopies} from './specialCards.js';
import {BOSS_CHARACTER_TYPES,isBossCharacterCard} from './bossCharacterCards.js';
import {PVP_TERRAIN_TYPES,isPvpTerrain} from './pvpTerrainCards.js';
import {SIGNATURE_MUTATION_CARD_ID} from './tacticalSignatureMutation.js';
export {SPECIAL_DECK_SIZE,SPECIAL_DECK_COPY_LIMIT};

export const SPECIAL_COLLECTION_KEY='eclissi_special_collection_v1';
export const SPECIAL_COLLECTION_VERSION=1;
export const SPECIAL_PACK_SIZE=3;
export const SPECIAL_TYPES=Object.freeze(Object.keys(SPECIAL_CARD_CATALOG));
// Boss Characters are trophy-only: never silently drop in generic packs.
export const SPECIAL_PACK_TYPES=Object.freeze(SPECIAL_TYPES.filter(type=>!isBossCharacterCard(type)&&!isPvpTerrain(type)));
// Support cards are unlocked via real packs; none are assigned to new players for free.
const ORIGINAL_STARTER_SPECIALS=new Set([
 'fusion-barrier','fusion-strike','tactical-cover',
 'shot-piercing','shot-ion','shot-corrosion'
]);
export const STARTER_SPECIAL_COUNTS=Object.freeze(Object.fromEntries(SPECIAL_TYPES.map(type=>
 [type,ORIGINAL_STARTER_SPECIALS.has(type)?4:0])));
const MAX_OWNED_COPIES=999;
const MAX_CLAIMS=5000;
const cleanNumber=n=>Number.isInteger(n)&&n>=0&&n<=MAX_OWNED_COPIES;
const emptyCounts=()=>Object.fromEntries(SPECIAL_TYPES.map(type=>[type,0]));
const isPlainObject=o=>o&&typeof o==='object'&&!Array.isArray(o);

export function createSpecialCollection(){
 return {schemaVersion:SPECIAL_COLLECTION_VERSION,
  owned:{...STARTER_SPECIAL_COUNTS},
  loadout:SPECIAL_TYPES.flatMap(type=>Array(STARTER_SPECIAL_COUNTS[type]).fill(type)),
  packCredits:0,openedPacks:0,claimedRewards:[]};
}
export function specialDeckCounts(types){
 const counts=emptyCounts();
 if(Array.isArray(types))for(const type of types)if(Object.hasOwn(counts,type))counts[type]++;
 return counts;
}
export function validateSpecialDeck(collection,loadout){
 if(!Array.isArray(loadout)||loadout.length!==SPECIAL_DECK_SIZE)
  return {valid:false,reason:'deck_size'};
 const counts=specialDeckCounts(loadout);
 if(loadout.some(type=>!Object.hasOwn(SPECIAL_CARD_CATALOG,type)))
  return {valid:false,reason:'unknown_card'};
 if(SPECIAL_TYPES.some(type=>counts[type]>specialCardMaxCopies(type)))
  return {valid:false,reason:'copy_limit'};
 if(SPECIAL_TYPES.some(type=>counts[type]>(collection?.owned?.[type]||0)))
  return {valid:false,reason:'not_owned'};
 return {valid:true,reason:'ok',counts};
}
export function normalizeSpecialCollection(raw){
 if(raw==null)return createSpecialCollection();
 if(!isPlainObject(raw)||raw.schemaVersion!==SPECIAL_COLLECTION_VERSION)
  throw new Error('Formato collezione speciale non supportato');
 if(!isPlainObject(raw.owned)||!Array.isArray(raw.loadout)||
    !Array.isArray(raw.claimedRewards))throw new Error('Salvataggio speciale incompleto');
 const owned=emptyCounts();
 for(const type of SPECIAL_TYPES){
  // Saved schema v1 predates this new card; only its missing zero is migrated.
  // Missing existing card types remain an error (never reset a corrupt save).
  const value=Object.hasOwn(raw.owned,type)?raw.owned[type]:
   (['support-escort-repair','fusion-twin','fusion-triad'].includes(type)||
    BOSS_CHARACTER_TYPES.includes(type)||PVP_TERRAIN_TYPES.includes(type)||
    type===SIGNATURE_MUTATION_CARD_ID)?0:undefined;
  if(!cleanNumber(value))throw new Error('Numero di carte speciali non valido');
  owned[type]=Math.max(STARTER_SPECIAL_COUNTS[type],value);
 }
 const claimedRewards=[];
 const seen=new Set();
 if(raw.claimedRewards.length>MAX_CLAIMS)throw new Error('Elenco ricompense troppo grande');
 for(const key of raw.claimedRewards){
  if(typeof key!=='string'||!key.trim()||key.length>160)
   throw new Error('Ricompensa non valida');
  if(!seen.has(key)){seen.add(key);claimedRewards.push(key);}
 }
 if(!cleanNumber(raw.packCredits)||!cleanNumber(raw.openedPacks))
  throw new Error('Contatori pacchetti non validi');
 const result={schemaVersion:SPECIAL_COLLECTION_VERSION,owned,
  loadout:[...raw.loadout],packCredits:raw.packCredits,openedPacks:raw.openedPacks,
  claimedRewards};
 if(!validateSpecialDeck(result,result.loadout).valid)
  throw new Error('Mazzo speciale salvato non valido: non modificato');
 return result;
}
export function equipSpecialDeck(collection,loadout){
 const check=validateSpecialDeck(collection,loadout);
 if(!check.valid)throw new Error(({
  deck_size:'Il mazzo deve contenere esattamente 24 speciali',
  unknown_card:'Carta speciale non riconosciuta',
  copy_limit:'Limite copie superato: massimo 1 per ciascun Personaggio Boss, massimo 6 per le altre speciali',
  not_owned:'Non possiedi abbastanza copie della speciale'
 })[check.reason]||'Mazzo speciale non valido');
 return {...collection,loadout:[...loadout]};
}
export function specialPackReward(collection,rewardKey){
 if(typeof rewardKey!=='string'||!rewardKey.trim()||rewardKey.length>160)
  throw new Error('Ricompensa sconosciuta');
 if(collection.claimedRewards.includes(rewardKey))
  return {granted:false,reason:'already_claimed',collection};
 if(collection.claimedRewards.length>=MAX_CLAIMS||collection.packCredits>=MAX_OWNED_COPIES)
  return {granted:false,reason:'limit',collection};
 return {granted:true,reason:'ok',collection:{...collection,packCredits:collection.packCredits+1,
  claimedRewards:[...collection.claimedRewards,rewardKey]}};
}
function randIndex(rng,size){
 const n=Number(rng());
 const unit=Number.isFinite(n)?Math.max(0,Math.min(.999999999999,n)):0;
 return Math.floor(unit*size);
}
export function openSpecialPack(collection,rng=Math.random){
 if(!collection.packCredits)return {opened:false,reason:'no_pack',collection};
 const drawn=Array.from({length:SPECIAL_PACK_SIZE},()=>SPECIAL_PACK_TYPES[randIndex(rng,SPECIAL_PACK_TYPES.length)]);
 const increments=specialDeckCounts(drawn);
 if(SPECIAL_TYPES.some(type=>collection.owned[type]+increments[type]>MAX_OWNED_COPIES))
  return {opened:false,reason:'inventory_full',collection};
 return {opened:true,reason:'ok',drawn,collection:{...collection,openedPacks:collection.openedPacks+1,
  packCredits:collection.packCredits-1,owned:Object.fromEntries(SPECIAL_TYPES.map(
   type=>[type,collection.owned[type]+increments[type]]))}};
}
export function readSpecialCollection(storage=globalThis.localStorage){
 const raw=storage.getItem(SPECIAL_COLLECTION_KEY);
 return normalizeSpecialCollection(raw?JSON.parse(raw):null);
}
export function updateSpecialCollection(change,storage=globalThis.localStorage){
 const raw=storage.getItem(SPECIAL_COLLECTION_KEY);
 const before=normalizeSpecialCollection(raw?JSON.parse(raw):null);
 const result=normalizeSpecialCollection(change(before));
 const payload=JSON.stringify(result);
 if(payload!==raw)storage.setItem(SPECIAL_COLLECTION_KEY,payload);
 return result;
}
export function claimFirstWinSpecialPack(mode,sector,storage=globalThis.localStorage){
 if(!['campaign','adventure'].includes(mode)||!Number.isInteger(sector)||sector<1)
  return {granted:false,reason:'not_campaign',collection:readSpecialCollection(storage)};
 let reward={granted:false};
 const collection=updateSpecialCollection(current=>{
  reward=specialPackReward(current,`${mode}:sector:${sector}`);
  return reward.collection;
 },storage);
 return {...reward,collection};
}
