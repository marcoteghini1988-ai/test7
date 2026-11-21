// Eclissi Stellare — valori candidati per il nuovo sistema dei tre componenti.
// Fonte unica per audit statistici e numeri PRE-STAMPA, NON attivi nel gioco.
// Derivazione: 72 PvP e 24 boss con semi nuovi, 17s/turno, Personaggi esclusi.
// Restano da integrare: nuovo Generatore effettivo, 3 timer live, arma sequenza
// e Frammenti senza sparo base, combinazioni reali di Difese/Trappole future.
export const PACING_BALANCE_CANDIDATE=Object.freeze({
 id:'nov-21-generator-three-timers-F-validated-v1',
 status:'SIMULATED_NOT_LIVE',
 targetSeconds:Object.freeze({min:300,max:360}),
 assumedSecondsPerTurn:17,
 motherHpMultiplier:Object.freeze({
  Comune:1.15,Rara:1,Epica:1,Leggendaria:1
 }),
 weaponNominalMultiplier:Object.freeze({
  Comune:.60,Rara:1,Epica:1,Leggendaria:1
 }),
 deteriorationFractionPerSecond:Object.freeze({
  Comune:.009,Rara:.009,Epica:.012,Leggendaria:.016
 }),
 // Il Generatore non ha timer di distruzione: cooldown 1/2 o 1/3 turni.
 generatorCannotPermanentlyBreak:true,
 timedComponentIds:Object.freeze(['weapons','command','bridge']),
 weaponGraphicsFinalApproved:false
});
