// Categoria editoriale: distinta dal ruolo tecnico usato da motore, IA e salvataggi.
// 26/11/2026: ARMA rossa, STRATEGIA arancione (ex ATTACCO).
export const CARD_CATEGORY_COLORS=Object.freeze({weapon:'#ff594c',strategy:'#ffb24d'});
export function cardVisualFamily(def,legacyRole){
 if(!def)return legacyRole||'support';
 const spec=def.effectSpec||{};
 if(spec.type==='deployMachine'||def.id?.startsWith('weapon-'))return 'weapon';
 if(spec.type==='energy'||def.kind==='energy')return 'energy';
 if(spec.type==='trap'||def.kind==='trap'||def.sottotipo==='Trappola coperta'||def.category==='Trappola')return 'trap';
 if(def.kind==='character'||def.sottotipo==='Personaggio')return 'character';
 if(def.kind==='terrain')return 'terrain';
 if(def.kind==='defense')return 'defense';
 if(def.kind==='attack'||[def.category,def.categoria].some(c=>c==='Attacco'||c==='Strategia'))return 'strategy';
 return legacyRole||def.kind||'support';
}
export const cardCategoryLabel=(def,legacyRole)=>({
 weapon:'ARMA',strategy:'STRATEGIA',attack:'STRATEGIA',defense:'DIFESA',
 trap:'TRAPPOLA',character:'PERSONAGGIO',terrain:'TERRENO',energy:'ENERGIA',
 support:'SUPPORTO',control:'CONTROLLO',combo:'FUSIONE'
}[cardVisualFamily(def,legacyRole)]||'SPECIALE');
export const cardCategoryColor=(def,legacyRole)=>CARD_CATEGORY_COLORS[cardVisualFamily(def,legacyRole)]||null;
