export {synthesizeCoreAudio as synthesizeReviewAudio} from '../../../src/coreThunderAudio.js';
import {reviewTimeline} from './timeline.mjs';
import {probeHammerCue} from '../../../src/probeHammerAudio.js';
export function reviewCuePlan(sequence){
 const timeline=reviewTimeline(sequence),plan=[];
 const add=(phase,ms,hit,cue)=>plan.push({phase,at:ms/1000,who:hit.who,pan:hit.who==='A'?.10:-.10,...cue,seedIndex:plan.length});
 for(const h of timeline.hits){
  add('launch',h.launchAt,h,probeHammerCue(h.kind,'fire',h));
  const blocked=h.blocked||h.actualDamage<=0,phase=blocked?(h.blocked?'block':'contact'):h.kind==='probe'?'probe-contact':h.bonus?'combo-detonation':'blade-contact';
  add(phase,h.impactAt,h,probeHammerCue(h.kind,blocked?'block':'impact',h));
 }
 if(timeline.mark)add('mark-set',timeline.mark.at,timeline.hits.find(h=>h.kind==='probe'),probeHammerCue('probe','mark'));
 return plan.sort((a,b)=>a.at-b.at);
}
