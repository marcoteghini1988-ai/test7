// Eclissi Stellare — tredici modelli di supporto progettati per abilità.
// Il catalogo madri ufficiale contiene 12 modelli: i 13 supporti sono indipendenti.
// Ogni modello ha una sola passiva innata e un elemento nativo proprio;
// gli SVG storici fungono da segnaposto fino alle immagini Flow definitive.
// I 15 effetti precedenti rimangono disponibili nei soli percorsi legacy.
export const SUPPORT_MODEL_DESIGNS=Object.freeze([
 Object.freeze({"shipId":"N00","name":"Velo Aurora","role":"Rigenerazione","skillId":"regeneration","originSlot":0,"visualBrief":"Supporto che rigenera la nave madre nel turno avversario","templateMotherId":"N00","elementId":"ionic","rarita":"Comune"}),
 Object.freeze({"shipId":"C01","name":"Bastione Solare","role":"Guardia finale","skillId":"last-shield","originSlot":0,"visualBrief":"Supporto corazzato che ripara la madre alla distruzione","templateMotherId":"C01","elementId":"plasma","rarita":"Comune"}),
 Object.freeze({"shipId":"C02","name":"Prisma Silente","role":"Blocco trappole","skillId":"trap-silence","originSlot":1,"visualBrief":"Interferitore che impedisce l'attivazione delle Trappole nemiche","templateMotherId":"C02","elementId":"refrigerant","rarita":"Comune"}),
 Object.freeze({"shipId":"C03","name":"Corvo Esploratore","role":"Pescata","skillId":"extra-draw","originSlot":1,"visualBrief":"Ricognitore che fornisce una carta aggiuntiva","templateMotherId":"C03","elementId":"void","rarita":"Comune"}),
 Object.freeze({"shipId":"C04","name":"Falce del Vento","role":"Controllo terreno","skillId":"terrain-half","originSlot":1,"visualBrief":"Supporto che riduce la durata dei Terreni avversari","templateMotherId":"E02","elementId":"aerial","rarita":"Comune"}),
 Object.freeze({"shipId":"R01","name":"Armeria Binaria","role":"Armi potenziate","skillId":"weapon-double","originSlot":1,"visualBrief":"Piattaforma che potenzia le Carte Arma","templateMotherId":"R01","elementId":"metallic","rarita":"Rara"}),
 Object.freeze({"shipId":"R02","name":"Relè Ionico","role":"Risparmio Energia","skillId":"energy-discount","originSlot":1,"visualBrief":"Reattore che riduce il costo dell'Attacco Speciale","templateMotherId":"R02","elementId":"ionic","rarita":"Rara"}),
 Object.freeze({"shipId":"E01","name":"Scudo Nebuloso","role":"Immunità terreno","skillId":"terrain-immunity","originSlot":0,"visualBrief":"Schermo che protegge la flotta dai malus ambientali","templateMotherId":"E01","elementId":"cryogenic","rarita":"Epica"}),
 Object.freeze({"shipId":"E03","name":"Fenice Energetica","role":"Energia alla distruzione","skillId":"death-energy","originSlot":1,"visualBrief":"Condensatore che diventa Energia quando viene distrutto","templateMotherId":"L04","elementId":"plasma","rarita":"Epica"}),
 Object.freeze({"shipId":"L01","name":"Eclisse Sacrificale","role":"Sacrificio","skillId":"sacrifice","originSlot":1,"visualBrief":"Supporto che può sacrificarsi per colpire la nave madre avversaria","templateMotherId":"L01","elementId":"radiant","rarita":"Leggendaria"}),
 Object.freeze({"shipId":"L02","name":"Spina Gravitazionale","role":"Veleno reattivo","skillId":"reactive-poison","originSlot":1,"visualBrief":"Supporto che avvelena il nemico quando viene colpito","templateMotherId":"C03","elementId":"gravity","rarita":"Leggendaria"}),
 Object.freeze({"shipId":"L03","name":"Titano della Tempesta","role":"Tempesta finale","skillId":"death-storm","originSlot":0,"visualBrief":"Supporto che elimina le carte attive nemiche alla distruzione","templateMotherId":"L03","elementId":"mineral","rarita":"Leggendaria"}),
 Object.freeze({"shipId":"L04","name":"Arca Condensatrice","role":"Accumulo Fulmini","skillId":"capacitor","originSlot":1,"visualBrief":"Supporto che accumula cariche e scarica fulmini dopo tre turni","templateMotherId":"L04","elementId":"refrigerant","rarita":"Leggendaria"}),
]);
export const SUPPORT_MODEL_BY_SHIP_ID=Object.freeze(Object.fromEntries(
 SUPPORT_MODEL_DESIGNS.map(model=>[model.shipId,model])
));
export const SUPPORT_MODEL_IDS=Object.freeze(SUPPORT_MODEL_DESIGNS.map(m=>m.shipId));
// Le due madri ufficiali senza un supporto omonimo usano una formazione NPC.
export const SUPPORT_MODEL_FALLBACKS=Object.freeze({R04:'C03',E02:'C04'});
export const supportDesignFor=id=>SUPPORT_MODEL_BY_SHIP_ID[id]||null;
export const officialSupportShipFor=id=>
 SUPPORT_MODEL_BY_SHIP_ID[id]?id:SUPPORT_MODEL_FALLBACKS[id]||null;
if(SUPPORT_MODEL_DESIGNS.length!==13||
 new Set(SUPPORT_MODEL_IDS).size!==13||
 new Set(SUPPORT_MODEL_DESIGNS.map(m=>m.skillId)).size!==13)
 throw Error('I tredici modelli devono avere tredici passive distinte');
