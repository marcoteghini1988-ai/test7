// Illustrazioni SVG originali. I cataloghi restano fonte di verita' per effetti e inventario.
export const OFFICIAL_SPECIAL_ART_TYPES=Object.freeze(["fusion-barrier","fusion-strike","fusion-twin","fusion-triad","tactical-cover","shot-piercing","shot-ion","shot-corrosion","support-shield-repair","support-status-purge","support-escort-repair","tactic-quantum-dice","tactic-bomb","tactic-malus","tactic-golden","tactic-vulnerability-rift","tactic-signature-mutation","tactic-power-shift","tactic-scan","tactic-suppress","tactic-counter","tactic-reactive","tactic-kinetic","tactic-impact","tactic-numeric-recycle"]);
const known=new Set(OFFICIAL_SPECIAL_ART_TYPES);
export function officialSpecialArtPath(type){
 return known.has(type)?'/assets/special-cards/'+type+'.svg':null;
}
