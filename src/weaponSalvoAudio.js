import {isProbeHammerKind} from './probeHammerSpec.js';
import {thermalChargeForShot} from './metalWeaponBattleVisuals.js';
// Shared by live playback and the offline score: one timed cue per actual
// round, shorter tails for the salvo, full material body on its last impact.
export function weaponSalvoAudioCue(profile,shot,phase){
 const multi=(shot.salvoCount||1)>1,full=shot.finisher||shot.salvoLast;
 return {type:phase==='impact'&&shot.destroyed&&!isProbeHammerKind(profile.kind)&&profile.kind!=='storm-capacitor-cloud'&&profile.kind!=='ionic-command-lance'&&!shot.jawCombo&&(!multi||shot.salvoLast)?'weapon_hull_destroyed':profile.sound?.[phase],
  pitchSemitones:(profile.jawRole==='b'?-2:0)+(phase==='charge'?thermalChargeForShot(shot).ratio*3+(profile.inductionBoostRatio||0)*2:0),
  level:!multi||phase==='charge'?1:full&&phase==='impact'?.95:.85/Math.sqrt(shot.salvoCount),
  timeScale:!multi||phase==='charge'?1:phase==='fire'?Math.min(.58,profile.flightMs/1400):full?1:.44};
}
