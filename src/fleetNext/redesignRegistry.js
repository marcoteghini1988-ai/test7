// Catalogo di riprogettazione 2026. Registrato nel codice, non ancora
// attivato nel motore di battaglia: NON equipaggiare schede senza esecutore.
// Le carte Boss e Personaggio storiche non sono oggetto del ritiro.
import group01 from './redesignProposals/group01.json' with {type:'json'};
import group02 from './redesignProposals/group02.json' with {type:'json'};
import group03 from './redesignProposals/group03.json' with {type:'json'};
import group04 from './redesignProposals/group04.json' with {type:'json'};
import retired from './retiredLegacyCardsV2.json' with {type:'json'};

const proposed=[...group01,...group02,...group03,...group04];
const unique=new Set(proposed.map(c=>c.id));
if(proposed.length!==120||unique.size!==120)
 throw new Error('Catalogo riprogettato: servono 120 schede distinte');
export const REDESIGN_CARD_SPECS=Object.freeze(Object.fromEntries(
 proposed.map(c=>[c.id,Object.freeze({
  ...c,
  ...(c.category==='Personaggio'?{
   preservedCharacterId:'ex-'+c.shipId.toLowerCase()+'-01',
   status:'preserve_existing_character'
  }:{})
 })])
));
export const RETIREMENT_MANIFEST=Object.freeze(retired);
export const REDESIGN_SHIP_IDS=Object.freeze([...new Set(proposed.map(c=>c.shipId))]);
export const RETIRED_LEGACY_CARD_IDS=Object.freeze([
 ...retired.retiredGenericIds,...retired.retiredExclusiveIds
]);
export const PRESERVED_CHARACTER_CARD_IDS=Object.freeze([
 ...retired.keptGenericCharacters,...retired.keptExclusiveCharacters
]);
export const PRESERVED_BOSS_CARD_IDS=Object.freeze([...retired.keptBossIds]);
export const REDESIGN_NONCHARACTER_CARD_COUNT=proposed.filter(c=>c.category!=='Personaggio').length;
export function redesignedCardsForShip(shipId){
 return Object.values(REDESIGN_CARD_SPECS).filter(c=>c.shipId===shipId);
}
export function validateRedesignSpecs(){
 if(REDESIGN_SHIP_IDS.length!==12||REDESIGN_NONCHARACTER_CARD_COUNT!==108)return false;
 if(RETIRED_LEGACY_CARD_IDS.length!==350||
  new Set(RETIRED_LEGACY_CARD_IDS).size!==350||
  PRESERVED_CHARACTER_CARD_IDS.length!==29||
  PRESERVED_BOSS_CARD_IDS.length!==12)return false;
 const protectedIds=new Set([...PRESERVED_CHARACTER_CARD_IDS,...PRESERVED_BOSS_CARD_IDS]);
 if(RETIRED_LEGACY_CARD_IDS.some(id=>protectedIds.has(id)))return false;
 for(const shipId of REDESIGN_SHIP_IDS){
  const cards=redesignedCardsForShip(shipId);
  if(cards.length!==10||cards.filter(c=>c.category==='Personaggio').length!==1)return false;
  for(const level of [1,2,3,4,5]){
   if(cards.filter(c=>c.minShipLevel===level).length!==(level===1?6:1))return false;
  }
  if(cards.some(c=>!c.name||!c.effectText||c.imageReady!==false))return false;
 }
 return true;
}
