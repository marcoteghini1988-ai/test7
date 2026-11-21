// Eclissi Stellare — bilanciamento operativo della nuova partita senza deterioramento.
// Il giocatore consuma tempo STRATEGICO per ogni turno proprio, non secondi reali.
// 72 PvP + 24 boss: 0 KO da timer, 0 pareggi con ricambio della mano bloccata.
// Taratura dei danni calibrata con veri mazzi; non altera la grafica delle carte.
export const STRATEGIC_NO_DRAIN_BALANCE=Object.freeze({
 id:'nov-21-no-deterioration-mother-and-weapons-v1',
 status:'ACTIVE_STRATEGIC_PLAYTEST_NOT_FINAL_CARD_ART',
 strategicSecondsPerOwnTurn:20,
 lastComponentAtOwnSeconds:210,
 deteriorationFractionPerSecond:0,
 motherHpMultiplier:Object.freeze({
  Comune:1.15,Rara:1,Epica:1,Leggendaria:1
 }),
 weaponNominalMultiplier:Object.freeze({
  Comune:.60,Rara:1,Epica:1.7,Leggendaria:1.85
 }),
 generatorDamageMultiplier:Object.freeze({
  Comune:1,Rara:1,Epica:1.25,Leggendaria:1.30
 }),
 recoverFullHandOnEmptyTurn:true,
 printValuesStillProvisional:true
});
