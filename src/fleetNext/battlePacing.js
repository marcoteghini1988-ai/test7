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

// Pressione progressiva uguale per entrambi i giocatori: niente timeout
// automatico. In modalita' HP e con rarita' attive aumenta il danno solo
// dopo diversi minuti, per ridurre gli scontri bloccati da difese e fusioni.
export const FLEET_PACING_PRESSURE=Object.freeze({
 pvp:Object.freeze({startSeconds:180,stepSeconds:30,stepBonus:.40,maxMultiplier:3.5}),
 campaign:Object.freeze({startSeconds:240,stepSeconds:30,stepBonus:.25,maxMultiplier:2.5}),
 boss:Object.freeze({startSeconds:480,stepSeconds:30,stepBonus:.25,maxMultiplier:2.5})
});
export const BOSS_GUARD_ORDER=Object.freeze([1,2,3,6,7,8,9,11,14,17,19,20]);
export function bossExtraDamageResistance(bossId){
 const index=BOSS_GUARD_ORDER.indexOf(Number(bossId));
 return index<0?15:15+index;
}
export function pacingAttackMultiplier(battle,nowMs=0){
 const category=battle?.bossId!=null?'boss':battle?.mode==='pvp'?'pvp':'campaign';
 const params=FLEET_PACING_PRESSURE[category];
 const elapsed=Math.max(0,(Number(nowMs)-Number(battle?.startedAtMs||0))/1000);
 if(!Number.isFinite(elapsed)||elapsed<params.startSeconds+params.stepSeconds)return 1;
 const steps=Math.floor((elapsed-params.startSeconds)/params.stepSeconds);
 return Math.min(params.maxMultiplier,
  Math.round((1+params.stepBonus*steps)*100)/100);
}

// Le sfide degli ultimi boss sono piu' difensive: la difficolta' cresce
// tramite resistenza e abilita' senza dover abbattere il giocatore subito.
// Questo parametro non cambia le Carte Personaggio Boss e non tocca i Terreni.
export function bossAttackMultiplier(bossId){
 const index=BOSS_GUARD_ORDER.indexOf(Number(bossId));
 if(index<8)return 1;
 return Math.max(.80,Math.round((1-.075*(index-7))*1000)/1000);
}
