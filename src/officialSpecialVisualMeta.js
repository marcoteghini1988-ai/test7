// Etichette strettamente derivate dal catalogo ufficiale: nessuna
// rarita' inventata. Il catalogo assegna esplicitamente la categoria ma
// non una rarita' a ogni speciale; gli Oggetti Epici sono l'eccezione.
import {SPECIAL_CARD_CATALOG} from './specialCards.js';
import {isTacticalEpic} from './tacticalEpicCards.js';
import {isBossCharacterCard} from './bossCharacterCards.js';

const FAMILY_NAMES=Object.freeze({
 offense:'ATTACCO',defense:'DIFESA',support:'SUPPORTO',fusion:'FUSIONE',
 reaction:'REAZIONE',intel:'SCANSIONE',control:'CONTROLLO',
 quantum:'DADO',sabotage:'MALUS',transmute:'DORATA',
 rift:'FAGLIA',mutation:'MUTAZIONE',volley:'RAFFICA',
 equipment:'MODULO',epic:'EPICO','boss-character':'PERSONAGGIO',
 terrain:'TERRENO'
});
const KNOWN_RARITIES=Object.freeze({
 common:'COMUNE',rare:'RARA',epic:'EPICA',legendary:'LEGGENDARIA'
});
export function officialSpecialVisualMeta(type){
 const card=SPECIAL_CARD_CATALOG[type];
 if(!card)return null;
 const rarity=KNOWN_RARITIES[card.rarity]||
  (isTacticalEpic(type)?'EPICA':null);
 return Object.freeze({
  type,role:FAMILY_NAMES[card.family]||'SPECIALE',
  rarity,
  limited:isBossCharacterCard(type)?'BOSS':
   card.maxCopies===1?'UNICA':null
 });
}
