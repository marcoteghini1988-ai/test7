// Bilanciamento ufficiale degli impatti sui quattro vitali (duello 30+8).
// Un vitale standard parte da 10 HP. Il colpo matematico valido ordinario
// deve creare un'avaria vera prima del KO: 6 HP con 2 numeriche, 8 con 3.
// Bonus temporanei di boss, equipaggiamenti, arena o scudiere rimangono
// applicati dal motore e possono produrre eccezionalmente un KO immediato.
// Questa tabella NON cambia le 42 armi native o gli HP dei pezzi.
export const TACTICAL_PRECISION_BASE=Object.freeze({
 twoCards:6,
 threeCards:8
});
export function tacticalPrecisionBaseDamage(cards){
 const count=Array.isArray(cards)?cards.length:cards;
 if(count===2)return TACTICAL_PRECISION_BASE.twoCards;
 if(count===3)return TACTICAL_PRECISION_BASE.threeCards;
 return 0;
}
