// Target di durata per il bilanciamento, non timer di eliminazione forzata.
// Un turno individuale dura al massimo 30 secondi; la scelta di giocare
// prima della scadenza abbrevia il tempo reale. Le durate vanno collaudate.
export const FLEET_PACING_WINDOWS=Object.freeze({
 pvp:Object.freeze({minSeconds:300,targetSeconds:330,maxSeconds:360}),
 campaign:Object.freeze({minSeconds:300,targetSeconds:330,maxSeconds:360}),
 boss:Object.freeze({minSeconds:300,targetSeconds:345,maxSeconds:360})
});
export function matchPacingTarget(mode='campaign',bossId=null,turnSeconds=30){
 const category=bossId!=null||mode==='boss'?'boss':mode==='pvp'?'pvp':'campaign';
 const window=FLEET_PACING_WINDOWS[category];
 const seconds=Number.isFinite(turnSeconds)&&turnSeconds>0?turnSeconds:30;
 // referenceTurns considera il limite di 30 s, non la durata media effettiva.
 // Dopo la terza carta o PASSA il turno termina subito. Nelle simulazioni
 // va misurata anche la scelta media e il tempo reale delle animazioni.
 const referenceTurns=Object.freeze({
  min:Math.ceil(window.minSeconds/seconds),
  target:Math.ceil(window.targetSeconds/seconds),
  max:Math.ceil(window.maxSeconds/seconds)
 });
 const expectedTurnSeconds=Math.min(seconds,18); // ipotesi iniziale da collaudare
 const typicalTurns=Object.freeze({
  min:Math.ceil(window.minSeconds/expectedTurnSeconds),
  target:Math.ceil(window.targetSeconds/expectedTurnSeconds),
  max:Math.ceil(window.maxSeconds/expectedTurnSeconds)
 });
 return Object.freeze({category,...window,referenceTurns,typicalTurns,
  expectedTurnSeconds,enforcedTimeLimit:false,estimatedAssumingFullTurns:true});
}

// Le finestre in alto sono riferimenti statistici, non parametri del danno.
// Il precedente sovraccarico a tempo e' stato disattivato per consentire
// anche mazzi molto aggressivi o difensivi e strategie impreviste.
export const FLEET_PACING_PRESSURE=Object.freeze({enabled:false});
export const pacingAttackMultiplier=(_battle,_nowMs=0)=>1;

export const BOSS_GUARD_ORDER=Object.freeze([1,2,3,6,7,8,9,11,14,17,19,20]);
export function bossExtraDamageResistance(bossId){
 const index=BOSS_GUARD_ORDER.indexOf(Number(bossId));
 return index<0?10:8+Math.round(index*.55);
}
// I boss usano Terreno e passive strategiche. La resistenza supplementare
// e' moderata per mantenere il medesimo obiettivo di 5-6 minuti del PvP.
// Questo parametro non cambia le Carte Personaggio Boss e non tocca i Terreni.
export function bossAttackMultiplier(bossId){
 const index=BOSS_GUARD_ORDER.indexOf(Number(bossId));
 if(index<8)return 1;
 return Math.max(.80,Math.round((1-.075*(index-7))*1000)/1000);
}
