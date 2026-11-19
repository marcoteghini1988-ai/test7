// Target di durata per il bilanciamento, non timer di eliminazione forzata.
// Un turno individuale dura al massimo 30 secondi; la scelta di giocare
// prima della scadenza abbrevia il tempo reale. Le durate vanno collaudate.
export const FLEET_PACING_WINDOWS=Object.freeze({
 pvp:Object.freeze({minSeconds:240,targetSeconds:300,maxSeconds:360}),
 campaign:Object.freeze({minSeconds:300,targetSeconds:330,maxSeconds:360}),
 boss:Object.freeze({minSeconds:480,targetSeconds:540,maxSeconds:600})
});
export function matchPacingTarget(mode='campaign',bossId=null,turnSeconds=30){
 const category=bossId!=null||mode==='boss'?'boss':mode==='pvp'?'pvp':'campaign';
 const window=FLEET_PACING_WINDOWS[category];
 const seconds=Number.isFinite(turnSeconds)&&turnSeconds>0?turnSeconds:30;
 const referenceTurns=Object.freeze({
  min:Math.ceil(window.minSeconds/seconds),
  target:Math.ceil(window.targetSeconds/seconds),
  max:Math.ceil(window.maxSeconds/seconds)
 });
 return Object.freeze({category,...window,referenceTurns,
  enforcedTimeLimit:false,estimatedAssumingFullTurns:true});
}

// Le finestre in alto sono riferimenti statistici, non parametri del danno.
// Il precedente sovraccarico a tempo e' stato disattivato per consentire
// anche mazzi molto aggressivi o difensivi e strategie impreviste.
export const FLEET_PACING_PRESSURE=Object.freeze({enabled:false});
export const pacingAttackMultiplier=(_battle,_nowMs=0)=>1;

export const BOSS_GUARD_ORDER=Object.freeze([1,2,3,6,7,8,9,11,14,17,19,20]);
export function bossExtraDamageResistance(bossId){
 const index=BOSS_GUARD_ORDER.indexOf(Number(bossId));
 return index<0?15:15+index;
}
// Le sfide degli ultimi boss sono piu' difensive: la difficolta' cresce
// tramite resistenza e abilita' senza dover abbattere il giocatore subito.
// Questo parametro non cambia le Carte Personaggio Boss e non tocca i Terreni.
export function bossAttackMultiplier(bossId){
 const index=BOSS_GUARD_ORDER.indexOf(Number(bossId));
 if(index<8)return 1;
 return Math.max(.80,Math.round((1-.075*(index-7))*1000)/1000);
}
