// Eclissi Stellare — bilanciamento operativo della nuova partita senza deterioramento.
// Il giocatore consuma tempo STRATEGICO per ogni turno proprio, non secondi reali.
// 72 PvP + 24 boss: 0 KO da timer, 0 pareggi con ricambio della mano bloccata.
// Taratura ufficiale prossima al definitivo delle 235 Carte Arma.
// Non modifica identita', effetti, durata o arte delle carte.
export const STRATEGIC_NO_DRAIN_BALANCE=Object.freeze({
 id:'nov-22-235-weapons-near-final-v1',
 status:'ACTIVE_WEAPON_VALUES_NEAR_FINAL_ART_PENDING',
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
 printValuesStillProvisional:false,
 weaponValuesNearFinal:true,
 lockedWeaponVersions:235
});
