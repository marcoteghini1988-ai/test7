// Gli identificatori delle vecchie carte sono conservati per migrazione, non sono carte attive.
import generalData from './catalogGeneral.json' with {type:'json'};
import exclusiveData from './catalogExclusive.json' with {type:'json'};
import retired from './retiredCardIds.json' with {type:'json'};
import {BOSS_CARDS} from './bossCards.js';
export const PRESERVED_GENERAL_CHARACTER_IDS=Object.freeze(generalData.carte.filter(c=>c.sottotipo==='Personaggio').map(c=>c.id));
export const PRESERVED_EXCLUSIVE_CHARACTER_IDS=Object.freeze(exclusiveData.cards.filter(c=>/Personaggio/i.test(c.category||'')).map(c=>c.id));
export const PRESERVED_BOSS_IDS=Object.freeze(Object.keys(BOSS_CARDS));
export const PRESERVED_CHARACTER_AND_BOSS_IDS=Object.freeze([...PRESERVED_GENERAL_CHARACTER_IDS,...PRESERVED_EXCLUSIVE_CHARACTER_IDS,...PRESERVED_BOSS_IDS]);
const protectedIds=new Set(PRESERVED_CHARACTER_AND_BOSS_IDS);
export const isProtectedCardDuringRedesign=id=>protectedIds.has(id);
export const LEGACY_GENERAL_IDS_TO_REPLACE=Object.freeze([...retired.generalIds]);
export const LEGACY_EXCLUSIVE_IDS_TO_REPLACE=Object.freeze([...retired.exclusiveIds]);
const retiredIds=new Set([...retired.generalIds,...retired.exclusiveIds]);
export const isRetiredCardId=id=>retiredIds.has(id);
export const CARD_RESET_POLICY=Object.freeze({protectedCount:PRESERVED_CHARACTER_AND_BOSS_IDS.length,legacyGeneralCount:LEGACY_GENERAL_IDS_TO_REPLACE.length,legacyExclusiveCount:LEGACY_EXCLUSIVE_IDS_TO_REPLACE.length,status:'removed',version:'2026-11-16'});
