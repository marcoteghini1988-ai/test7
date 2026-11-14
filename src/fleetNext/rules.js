// Eclissi Stellare — cataloghi e regole ufficiali del nuovo sistema di flotte.
// Nessuna dipendenza grafica: i componenti di battaglia e Shop usano gli stessi dati.
// I contenuti progettati sono importati, ma i loro effetti devono essere validati nel motore.
import generalData from './catalogGeneral.json';
import exclusiveData from './catalogExclusive.json';

export const GENERAL_CARDS = Object.freeze(Object.fromEntries(generalData.carte.map(card =>
 [card.id, Object.freeze({...card,kind:card.sottotipo==='Terreno'?'terrain':
  card.sottotipo==='Personaggio'?'character':card.sottotipo==='Difesa'?'defense':
  card.categoria==='Attacco'?'attack':card.categoria==='Controllo'?'control':'support'})]
)));
export const EXCLUSIVE_CARDS = Object.freeze(Object.fromEntries(exclusiveData.cards.map(card =>
 [card.id,Object.freeze({...card,kind:/Personaggio/i.test(card.category)?'character':/Difesa/i.test(card.category)?'defense':
  /Scudiera|Supporto|Tattica/i.test(card.category)?'support':
  /Controllo/i.test(card.category)?'control':
  /combo|fusione/i.test(card.category)?'combo':'attack'})]
)));
export const SHIP_CONFIGS = Object.freeze(Object.fromEntries(exclusiveData.shipConfigurations.map(s=>[s.id,Object.freeze(s)])));
export const COMBO_RECIPES = Object.freeze(exclusiveData.comboRecipes.map(c=>Object.freeze(c)));
export const PREMADE_DECKS = Object.freeze(generalData.mazziPreconfigurati);
export const STARTER_DECK = Object.freeze(generalData.mazzoIniziale);
export const GENERAL_COUNT = Object.keys(GENERAL_CARDS).length;
export const EXCLUSIVE_COUNT = Object.keys(EXCLUSIVE_CARDS).length;
export const FLEET_TURN_SECONDS = 30;
export const FLEET_HAND_SIZE = 7;
export const FLEET_MAX_PLAYED = 3;
export const FLEET_BASE_DECK_SIZE = 40;
export const FLEET_SLOTS = Object.freeze({attack:3,defense:2,character:1});
export const VITAL_KEYS = Object.freeze(['engine','weapons','command','generator']);
export const VITAL_LABELS = Object.freeze({engine:'Motori',weapons:'Armi',command:'Centralina',generator:'Generatore'});
export const CARD_PRICES = Object.freeze({Comune:80,Rara:220,Epica:550,Leggendaria:1200});
export const RARITY_COPY_LIMIT = Object.freeze({Comune:5,Rara:4,Epica:3,Leggendaria:2});
export const PACK_PRICE = 280;
export const PACK_SIZE = 3;
export const MAX_EXCLUSIVE_UPGRADE = 3;

if(GENERAL_COUNT!==250||EXCLUSIVE_COUNT!==129||Object.keys(SHIP_CONFIGS).length!==17||COMBO_RECIPES.length!==18)
 throw new Error('Catalogo flotta incompleto: le regole devono corrispondere ai 250+129 contenuti ufficiali');

export const generalCard = id => GENERAL_CARDS[id]||null;
export const exclusiveCard = id => EXCLUSIVE_CARDS[id]||null;
export const card = id => generalCard(id)||exclusiveCard(id);
export const shipConfig = id => SHIP_CONFIGS[id]||null;
export function cardCopyLimit(id){
 const c=card(id);
 if(!c)return 0;
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
 const profile=shipConfig(shipId);
 if(!profile)return [];
 return VITAL_KEYS.filter(id=>level>=(profile.partUnlockLevels[id]||99));
}
export function requiredEscortCount(shipId,level){
 const profile=shipConfig(shipId);
 if(!profile)return 0;
 return (level>=profile.escort1UnlockLevel?1:0)+(level>=profile.escort2UnlockLevel?1:0);
}
export function exclusiveUnlocked(id,shipId,level){
 const def=exclusiveCard(id), profile=shipConfig(shipId);
 if(!def||!profile||def.shipId!==shipId||level<def.minShipLevelDraft)return false;
 const parts=unlockedParts(shipId,level);
 return def.requiredOwnParts.every(part=>parts.includes(part))&&
  requiredEscortCount(shipId,level)>=def.requiredEscortCount;
}
export function exclusiveOperational(id,mother,escorts=[]){
 if(!exclusiveUnlocked(id,mother.id,mother.level))return false;
 const def=exclusiveCard(id);
 return def.requiredOwnParts.every(id=>mother.parts.some(p=>p.id===id&&!p.destroyed))&&
  escorts.filter(e=>e.hp>0&&!e.destroyed&&e.linked!==false).length>=def.requiredEscortCount;
}
export function eligibleExclusives(shipId,level){
 return Object.values(EXCLUSIVE_CARDS).filter(def=>exclusiveUnlocked(def.id,shipId,level));
}
export function effectiveDeck(baseDeck,shipId,level){
 const base=Array.isArray(baseDeck)?baseDeck:[];
 const ex=eligibleExclusives(shipId,level).flatMap(c=>Array(c.maxCopiesInAutoPackageDraft||1).fill(c.id));
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
  const def=generalCard(id);
  if(!def)return {valid:false,reason:'Carta non generale nel mazzo: '+id};
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
 return COMBO_RECIPES.filter(c=>c.navicella===shipId);
}
export function comboCardIds(recipe){
 const defs=Object.values(EXCLUSIVE_CARDS).filter(c=>c.shipId===recipe.navicella);
 return (recipe.carte_effettive_da_giocare||[]).map(name=>defs.find(d=>d.name===name)?.id).filter(Boolean);
}
export function isComboReady(recipe,mother,escorts,playedIds,previousIds=[]){
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
 return {count:GENERAL_COUNT,rarity,category,exclusive:EXCLUSIVE_COUNT,ships:17,recipes:COMBO_RECIPES.length};
}
