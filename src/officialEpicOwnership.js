// Bridge read-only verso i QUATTRO salvataggi reali della Cripta storica.
// Il nuovo mazzo speciale NON modifica ne' riusa i bonus passivi del vecchio
// motore Poker. L'unica fonte di acquisizione e' un Varco gia' fuso.
import {TACTICAL_EPIC_CARDS} from './tacticalEpicCards.js';

export const LEGACY_EPIC_KEYS=Object.freeze({
 relics:'eclissi_unlocked_relics',
 rifts:'eclissi_unlocked_rifts',
 inventory:'eclissi_epic_inventory',
 equipped:'eclissi_equipped_epic_items',
 level:'eclissi_level'
});
const plain=o=>!!o&&typeof o==='object'&&!Array.isArray(o);
function readMap(storage,key){
 const raw=storage.getItem(key);
 if(raw==null)return {};
 const data=JSON.parse(raw);
 if(!plain(data))throw new Error('Salvataggio Epici storico non valido: '+key);
 return data;
}
function readLevel(storage){
 const raw=storage.getItem(LEGACY_EPIC_KEYS.level);
 if(raw==null)return 1;
 const n=Number(raw);
 if(!Number.isInteger(n)||n<1||n>1000)throw new Error('Livello pilota storico non valido');
 return n;
}
// Solo un oggetto fuso/ottenuto e' posseduto. Due reliquie da sole NON bastano.
// Un Varco completato con entrambe le reliquie vale anche se la vecchia
// versione non ha ancora materializzato il campo inventory[itemId].
export function resolveLegacyEpicProgress({relics={},rifts={},inventory={},pilotLevel=1}={}){
 if(!plain(relics)||!plain(rifts)||!plain(inventory)||
  !Number.isInteger(pilotLevel)||pilotLevel<1)
  throw new Error('Stato Epici storico non valido');
 const unlocked=Object.keys(TACTICAL_EPIC_CARDS).filter(id=>{
  const epic=TACTICAL_EPIC_CARDS[id];
  return inventory[id]?.unlocked===true||
   (rifts[epic.riftId]===true&&epic.relicsRequired.every(relic=>relics[relic]===true));
 });
 const hasCollapsed=Object.values(TACTICAL_EPIC_CARDS).some(epic=>rifts[epic.riftId]===true);
 const slotLimit=pilotLevel>=60?2:pilotLevel>=20||hasCollapsed?1:0;
 return {unlocked,slotLimit,pilotLevel,hasCollapsed};
}
export function readLegacyEpicProgress(storage=globalThis.localStorage){
 return resolveLegacyEpicProgress({
  relics:readMap(storage,LEGACY_EPIC_KEYS.relics),
  rifts:readMap(storage,LEGACY_EPIC_KEYS.rifts),
  inventory:readMap(storage,LEGACY_EPIC_KEYS.inventory),
  pilotLevel:readLevel(storage)
 });
}
// Proiezione monotona: il possesso storico e' importato UNA sola volta come
// una copia nella collezione nuova; non altera le reliquie o l'equipaggiato
// originale. Nessuna copia extra a riapertura, nessun cambio del loadout 24.
export function mergeLegacyEpicOwnership(collection,progress){
 if(!plain(collection?.owned))throw new Error('Inventario speciale non valido');
 const owned={...collection.owned};
 let changed=false;
 for(const id of progress.unlocked){
  if(!TACTICAL_EPIC_CARDS[id])continue;
  if((owned[id]??0)<1){owned[id]=1;changed=true;}
 }
 return changed?{...collection,owned}:collection;
}
