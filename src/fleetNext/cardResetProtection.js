// Eclissi Stellare — invarianti del rifacimento del catalogo.
// Le carte Personaggio e Boss conservano la propria identità anche
// quando i vecchi Attacco, Difesa, Trappola e Supporto sono sostituiti.
// Usare queste funzioni durante la migrazione per non perdere salvataggi.
import generalData from './catalogGeneral.json' with {type:'json'};
import exclusiveData from './catalogExclusive.json' with {type:'json'};
import {BOSS_CARDS} from './bossCards.js';

const isGeneralPersonaggio = card => card?.sottotipo === 'Personaggio';
const isExclusivePersonaggio = card => /Personaggio/i.test(card?.category || '');

export const PRESERVED_GENERAL_CHARACTER_IDS = Object.freeze(
 generalData.carte.filter(isGeneralPersonaggio).map(card => card.id)
);
export const PRESERVED_EXCLUSIVE_CHARACTER_IDS = Object.freeze(
 exclusiveData.cards.filter(isExclusivePersonaggio).map(card => card.id)
);
export const PRESERVED_BOSS_IDS = Object.freeze(Object.keys(BOSS_CARDS));
export const PRESERVED_CHARACTER_AND_BOSS_IDS = Object.freeze([
 ...PRESERVED_GENERAL_CHARACTER_IDS,
 ...PRESERVED_EXCLUSIVE_CHARACTER_IDS,
 ...PRESERVED_BOSS_IDS
]);

const protectedIds = new Set(PRESERVED_CHARACTER_AND_BOSS_IDS);
export const isProtectedCardDuringRedesign = id => protectedIds.has(id);
export const LEGACY_GENERAL_IDS_TO_REPLACE = Object.freeze(
 generalData.carte.filter(c => !isGeneralPersonaggio(c)).map(c => c.id)
);
export const LEGACY_EXCLUSIVE_IDS_TO_REPLACE = Object.freeze(
 exclusiveData.cards.filter(c => !isExclusivePersonaggio(c)).map(c => c.id)
);

// Non distruggere mai la collezione del giocatore: gli ID storici devono
// poter essere migrati verso i sostituti prima della rimozione dei cataloghi.
export const CARD_RESET_POLICY = Object.freeze({
 protectedCount: PRESERVED_CHARACTER_AND_BOSS_IDS.length,
 legacyGeneralCount: LEGACY_GENERAL_IDS_TO_REPLACE.length,
 legacyExclusiveCount: LEGACY_EXCLUSIVE_IDS_TO_REPLACE.length,
 version: 'redesign-2026-11-16'
});
