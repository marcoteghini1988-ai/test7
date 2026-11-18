// Trappola generica confermata: ferma una Fusione di navicelle indipendenti.
// Rarità, numero definitivo di copie, acquisizione e illustrazione da decidere.
// Non introdurre costi o pacchetti prima del bilanciamento del catalogo.
export const FUSION_DENIAL_TRAP=Object.freeze({
 id:'trap-fusion-denial',
 name:'Interdizione di Fusione',nome:'Interdizione di Fusione',
 category:'Trappola',categoria:'Difesa',sottotipo:'Trappola coperta',
 kind:'defense',playable:true,nativeFace:true,
 rarita:'Da definire',rarityPending:true,
 maxCopiesPerDeck:1,copyLimitPending:true,acquisitionPending:true,
 visualBrief:'Un sigillo d’interferenza si attiva attorno a due navicelle che stanno per fondersi; il collegamento si spezza prima di completarsi.',
 effectProposed:'Trappola coperta. Annulla la prossima Carta Navicella Fusione giocata dall’avversario: la carta viene scartata e il supporto resta invariato.',
 effectSpec:Object.freeze({type:'trap',trigger:'shipFusion',action:'cancel'})
});
export const FUSION_DENIAL_TRAPS=Object.freeze([FUSION_DENIAL_TRAP]);
export const FUSION_DENIAL_TRAP_BY_ID=Object.freeze({[FUSION_DENIAL_TRAP.id]:FUSION_DENIAL_TRAP});
