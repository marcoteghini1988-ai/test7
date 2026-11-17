// Eclissi Stellare — cataloghi e regole ufficiali del nuovo sistema di flotte.
// Nessuna dipendenza grafica: i componenti di battaglia e Shop usano gli stessi dati.
// Ogni effetto è esplicito: catalogo, testo e combattimento condividono la stessa regola.
import generalData from './catalogGeneral.json' with {type:'json'};
import exclusiveData from './catalogExclusive.json' with {type:'json'};
import {describeEffect,validateEffectSpec} from './simpleEffects.js';
import {BOSS_CARDS,bossCard} from './bossCards.js';
import {PROGRESSION_CARDS,isProgressionCard} from './progressionCards.js';
import {getShipProgression} from './progression.js';
import {EXCLUSIVE_DESIGNS_120,NEW_EXCLUSIVE_BLUEPRINTS,EXCLUSIVE_SHIP_IDS,EXCLUSIVE_DESIGN_BY_ID} from './exclusive120.js';
export {EXCLUSIVE_DESIGNS_120,EXCLUSIVE_SHIP_IDS} from './exclusive120.js';
export {BOSS_CARDS,bossCard} from './bossCards.js';
export {PROGRESSION_CARDS,isProgressionCard} from './progressionCards.js';
export {CAMPAIGN_SHIP_ORDER,SHIP_PROGRESSION_IDS,getShipProgression,
 getShipProgressionLevels,shipProgressionProfile} from './progression.js';

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
  card.categoria==='Attacco'?'attack':card.categoria==='Controllo'?'control':'support','general')]
)));
const preservedCharacters=exclusiveData.cards.map(c=>{
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
 return c;
});
export const EXCLUSIVE_CARDS = Object.freeze(Object.fromEntries([...preservedCharacters,...Object.values(NEW_EXCLUSIVE_BLUEPRINTS)].map(card =>
 [card.id,definedCard(card,card.kind||(/Personaggio/i.test(card.category)?'character':/Difesa/i.test(card.category)?'defense':
  /Scudiera|Supporto|Tattica/i.test(card.category)?'support':
  /Controllo/i.test(card.category)?'control':
  /combo|fusione/i.test(card.category)?'combo':'attack'),'exclusive')]
)));
export const SHIP_CONFIGS = Object.freeze(Object.fromEntries(exclusiveData.shipConfigurations.map(s=>[s.id,Object.freeze(s)])));
export const COMBO_RECIPES = Object.freeze(exclusiveData.comboRecipes.map(c=>Object.freeze(c)));
export const PREMADE_DECKS = Object.freeze(generalData.mazziPreconfigurati);
export const STARTER_DECK=Object.freeze({...generalData.mazzoIniziale,carteGenerali:Object.freeze({...generalData.mazzoIniziale.carteGenerali})});
export const GENERAL_COUNT = Object.keys(GENERAL_CARDS).length;
export const EXCLUSIVE_COUNT = Object.keys(EXCLUSIVE_CARDS).length;
export const BOSS_COUNT = Object.keys(BOSS_CARDS).length;
export const BASE_CATALOG_COUNT = GENERAL_COUNT+EXCLUSIVE_COUNT+BOSS_COUNT;
export const PROGRESSION_CARD_COUNT = Object.keys(PROGRESSION_CARDS).length;
export const TOTAL_CARD_COUNT = BASE_CATALOG_COUNT+PROGRESSION_CARD_COUNT;
export const FLEET_TURN_SECONDS = 30;
export const FLEET_HAND_SIZE = 7;
export const FLEET_MAX_PLAYED = 3;
export const FLEET_BASE_DECK_SIZE = 40;
export const FLEET_SLOTS = Object.freeze({attack:3,defense:2,defenseVisible:1,trap:1,character:1,machine:2});
// engine rimane riconosciuto per gli effetti storici, ma non è un vitale delle nuove madri.
export const VITAL_KEYS = Object.freeze(['weapons','generator','bridge','command','engine']);
export const VITAL_LABELS = Object.freeze({engine:'Motori',weapons:'Arsenale',command:'Centralina',generator:'Generatore',bridge:'Plancia'});
export const CARD_PRICES = Object.freeze({Comune:80,Rara:220,Epica:550,Leggendaria:1200});
export const RARITY_COPY_LIMIT = Object.freeze({Comune:5,Rara:4,Epica:3,Leggendaria:2});
export const PACK_PRICE = 280;
export const PACK_SIZE = 3;
export const MAX_EXCLUSIVE_UPGRADE = 3;

if(GENERAL_COUNT!==12||EXCLUSIVE_COUNT!==125||BOSS_COUNT!==12||Object.keys(SHIP_CONFIGS).length!==17||COMBO_RECIPES.length!==0)
 throw new Error('Catalogo esclusivo incompleto: 120 schede nuove (12 Personaggi già conservati), 5 Personaggi varianti e 12 Boss');

export const progressionCard = id => PROGRESSION_CARDS[id]||null;
export const generalCard = id => GENERAL_CARDS[id]||(!PROGRESSION_CARDS[id]?.shipId?PROGRESSION_CARDS[id]:null)||null;
export const exclusiveCard = id => EXCLUSIVE_CARDS[id]||(PROGRESSION_CARDS[id]?.shipId?PROGRESSION_CARDS[id]:null)||null;
export const card = id => generalCard(id)||exclusiveCard(id)||bossCard(id);
export function cardFacePath(id,level=1){
 const definition=card(id);
 if(!definition||definition.playable===false||definition.nativeFace||isProgressionCard(id))return null;
 if(bossCard(id))return '/assets/fleet-next-boss-cards/'+id+'.svg';
 const grade=Math.max(1,Math.min(3,Math.floor(Number(level)||1)));
 return exclusiveCard(id)&&grade>1?
  '/assets/fleet-next-card-upgrades/'+id+'-g'+grade+'.svg':
  '/assets/fleet-next-cards/'+id+'.svg';
}
export const shipConfig = id => SHIP_CONFIGS[id]||null;
export function cardCopyLimit(id){
 const c=card(id);
 if(!c)return 0;
 if(bossCard(id))return 1;
 if(isProgressionCard(id))return c.shipId?c.maxCopiesInAutoPackageDraft:RARITY_COPY_LIMIT[c.rarita]||0;
 return exclusiveCard(id)?1:(RARITY_COPY_LIMIT[c.rarita]||0);
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
 return def.requiredOwnParts.every(id=>mother.parts.some(p=>p.id===id&&!p.destroyed))&&
  escorts.filter(e=>e.hp>0&&!e.destroyed&&e.linked!==false).length>=def.requiredEscortCount;
}
export function eligibleExclusives(shipId,level){
 return [...Object.values(EXCLUSIVE_CARDS),...Object.values(PROGRESSION_CARDS).filter(c=>c.shipId)]
  .filter(def=>exclusiveUnlocked(def.id,shipId,level));
}
export function effectiveDeck(baseDeck,shipId,level){
 const base=Array.isArray(baseDeck)?baseDeck:[];
 // Il mazzo non pesca effetti nuovi che non esistono ancora nel motore.
 const ex=eligibleExclusives(shipId,level).filter(c=>c.playable!==false).flatMap(c=>Array(c.maxCopiesInAutoPackageDraft||1).fill(c.id));
 return [...base,...ex];
}
export function countDeck(deck){
 const n={};for(const id of deck)n[id]=(n[id]||0)+1;return n;
}
export function validateBaseDeck(deck,collection=null){
 if(!Array.isArray(deck)||deck.length!==FLEET_BASE_DECK_SIZE)
  return {valid:false,reason:'Il mazzo base deve contenere esattamente 40 carte.'};
 const counts=countDeck(deck);
 for(const [id,amount] of Object.entries(counts)){
  const def=generalCard(id)||bossCard(id);
  if(!def)return {valid:false,reason:'Carta non ammessa nel mazzo base: '+id};
  if(amount>cardCopyLimit(id))return {valid:false,reason:'Troppe copie di '+def.nome};
  if(collection&&amount>(collection.owned[id]||0))
   return {valid:false,reason:'Copie non possedute: '+def.nome};
 }
 return {valid:true,counts};
}
export function deckFromCounts(counts){
 return Object.entries(counts).flatMap(([id,n])=>Array(Math.max(0,Math.floor(n||0))).fill(id));
}
export function getPrebuilt(id){
 return PREMADE_DECKS.find(p=>p.id===id)||null;
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
 return {count:GENERAL_COUNT,rarity,category,exclusive:EXCLUSIVE_COUNT,boss:BOSS_COUNT,
  baseCatalog:BASE_CATALOG_COUNT,progression:PROGRESSION_CARD_COUNT,
  total:TOTAL_CARD_COUNT,ships:17,recipes:COMBO_RECIPES.filter(c=>c.active===true).length,archivedRecipes:COMBO_RECIPES.length};
}
