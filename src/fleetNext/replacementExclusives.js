// Tre carte esclusiva che sostituiscono le antiche fusioni vincolate alla madre.
// Il catalogo deve conservare 10 esclusive per ciascuna delle 17 madri.
// Gli ID restano stabili; nessuna di queste abilità esegue più una fusione.
// I valori numerici sono provvisori in attesa del bilanciamento finale.
export const REPLACEMENT_EXCLUSIVE_EFFECTS=Object.freeze({
 'nx-l01-10':Object.freeze({name:'Velo della Corona',category:'Difesa',
  kind:'defense',effectSpec:Object.freeze({type:'protect',target:'all',amount:1,turns:2})}),
 'nx-l03-08':Object.freeze({name:'Spine di Ossidiana',category:'Difesa',
  kind:'defense',effectSpec:Object.freeze({type:'counter',amount:1,turns:1})}),
 'nx-l04-05':Object.freeze({name:'Ricambio Astrale',category:'Tattica',
  kind:'support',effectSpec:Object.freeze({type:'exchange',amount:1})})
});
