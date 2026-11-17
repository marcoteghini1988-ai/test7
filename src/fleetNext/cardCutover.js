// Archivio degli ID dismessi del 16/11: non confondere carte tecniche e nuove esclusive con quelle ritirate.
// Non attiva carte in bozza e non modifica il salvataggio mentre il nuovo
// motore delle azioni montabili e delle macchine non è stato completato.
import {GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS,cardRole} from './rules.js';
import retiredArchive from './retiredCardIds.json' with {type:'json'};

const keys=object=>Object.keys(object);
const oldGeneral=keys(GENERAL_CARDS);
const oldExclusive=keys(EXCLUSIVE_CARDS);
const bossIds=keys(BOSS_CARDS);

export const RETAINED_GENERAL_CHARACTERS=Object.freeze(oldGeneral.filter(id=>cardRole(id)==='character'));
export const RETAINED_EXCLUSIVE_CHARACTERS=Object.freeze(oldExclusive.filter(id=>cardRole(id)==='character'));
export const RETAINED_BOSS_CARDS=Object.freeze([...bossIds]);
export const RETAINED_CHARACTER_IDS=Object.freeze([
 ...RETAINED_GENERAL_CHARACTERS,...RETAINED_EXCLUSIVE_CHARACTERS,...RETAINED_BOSS_CARDS
]);
export const RETIRED_LEGACY_CARD_IDS=Object.freeze([...retiredArchive.generalIds,...retiredArchive.exclusiveIds]);
const retained=new Set(RETAINED_CHARACTER_IDS);
const retired=new Set(RETIRED_LEGACY_CARD_IDS);

if(retained.size!==RETAINED_CHARACTER_IDS.length||retired.size!==RETIRED_LEGACY_CARD_IDS.length||
 retired.size!==350||
 [...retired].some(id=>retained.has(id)))throw Error('Cutover: una carta Boss o Personaggio rischia di essere eliminata');

export function isProtectedCharacterCard(id){return retained.has(id);}
export function isOldCardToRetire(id){return retired.has(id);}

// Inventario storico: la cancellazione delle carte NON deve cancellare crediti,
// premi, navi, potenziamenti, o acquisti. Le vecchie copie vanno archiviate,
// non convertite silenziosamente in carte nuove con un effetto diverso.
export function previewCardCutover(inventory){
 const oldOwned=inventory?.owned||{},retainedOwned={},retiredOwned={},unclassifiedOwned={};
 for(const [id,number] of Object.entries(oldOwned)){
  if(!Number.isInteger(number)||number<0)continue;
  const bucket=retained.has(id)?retainedOwned:retired.has(id)?retiredOwned:unclassifiedOwned;
  bucket[id]=number;
 }
 const oldDeck=Array.isArray(inventory?.deck)?inventory.deck:[];
 return Object.freeze({
  protectedOwned:Object.freeze(retainedOwned),
  cardsToArchive:Object.freeze(retiredOwned),
  unknownOrNewOwned:Object.freeze(unclassifiedOwned),
  oldDeckIds:Object.freeze([...oldDeck]),
  unconvertedDeckIds:Object.freeze(oldDeck.filter(id=>!retained.has(id))),
  credits:inventory?.credits??0,
  equippedMother:inventory?.equippedMother??'N00',
  claimedRewards:Object.freeze([...(inventory?.claimedRewards||[])]),
  exclusiveUpgrades:Object.freeze({...inventory?.exclusiveUpgrades})
 });
}
