// Percorsi alle illustrazioni ufficiali del mazzo speciale.
// Tutte le carte condividono la stessa funzione: la battaglia 3D non deve
// mostrare un simbolo generico al posto dei PNG Boss o Terreno esistenti.
import {BOSS_CHARACTER_CATALOG} from './bossCharacterCards.js';
import {PVP_TERRAIN_CATALOG} from './pvpTerrainCards.js';

export const OFFICIAL_SPECIAL_ART_TYPES=Object.freeze(["fusion-barrier","fusion-strike","fusion-twin","fusion-triad","tactical-cover","shot-piercing","shot-ion","shot-corrosion","support-shield-repair","support-status-purge","support-escort-repair","tactic-quantum-dice","tactic-bomb","tactic-malus","tactic-golden","tactic-vulnerability-rift","tactic-signature-mutation","tactic-power-shift","tactic-scan","tactic-suppress","tactic-counter","tactic-reactive","tactic-kinetic","tactic-impact","tactic-numeric-recycle","epic_item_1","epic_item_6","epic_item_7","epic_item_8","epic_item_9","epic_item_3","module-card-aries","module-card-taurus","module-card-gemini","module-card-cancer","module-card-leo","module-card-virgo","module-card-libra","module-card-scorpio","module-card-sagittarius","module-card-capricorn","module-card-aquarius","module-card-pisces","module-card-planet_char_1","module-card-planet_char_2","module-card-planet_char_3","module-card-planet_char_4","module-card-planet_char_5","module-card-planet_char_6","module-card-planet_char_7","module-card-planet_char_8","module-card-planet_char_9","module-card-planet_char_10","module-card-planet_char_11","module-card-planet_char_12","module-card-planet_char_13","module-card-planet_char_14","module-card-planet_char_15","module-card-planet_char_16","module-card-planet_char_17","module-card-planet_char_18","module-card-planet_char_19","module-card-planet_char_20","module-card-singularity_core","module-card-ophiuchus","module-card-supreme_eclipse"]);
const known=new Set(OFFICIAL_SPECIAL_ART_TYPES);
export function officialSpecialArtPath(type){
 if(BOSS_CHARACTER_CATALOG[type])return BOSS_CHARACTER_CATALOG[type].imagePath;
 if(PVP_TERRAIN_CATALOG[type])return PVP_TERRAIN_CATALOG[type].imagePath;
 return known.has(type)?'/assets/special-cards/'+type+'.png':null;
}
