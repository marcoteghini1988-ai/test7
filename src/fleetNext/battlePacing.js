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
