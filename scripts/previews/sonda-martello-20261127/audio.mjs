export {synthesizeCoreAudio as synthesizeReviewAudio} from '../../../src/coreThunderAudio.js';
import {reviewTimeline} from './timeline.mjs';
export function reviewCuePlan(sequence){
 const timeline=reviewTimeline(sequence),plan=[];
 const add=(phase,ms,hit,haptic,voices)=>plan.push({phase,at:ms/1000,who:hit.who,pan:hit.who==='A'?.10:-.10,haptic,voices,seedIndex:plan.length});
 for(const h of timeline.hits){
  add('launch',h.launchAt,h,h.kind==='probe'?[5]:[8],[{wave:'noise',from:h.kind==='probe'?6100:1200,to:h.kind==='probe'?2800:6500,duration:h.flightMs/1000,gain:h.kind==='probe'?.018:.030},{wave:'sine',from:h.kind==='probe'?1200:420,to:h.kind==='probe'?2100:1050,duration:.75,gain:.015}]);
  if(h.blocked||h.actualDamage<=0)add(h.blocked?'block':'contact',h.impactAt,h,[5,15,5],[{wave:'noise',from:4800,to:900,duration:.09,gain:.050},{wave:'sine',from:1100,to:420,duration:.08,gain:.025}]);
  else if(h.kind==='probe')add('probe-contact',h.impactAt,h,[7],[{wave:'triangle',from:1650,to:700,duration:.10,gain:.042},{wave:'noise',from:5600,to:2100,duration:.07,gain:.038}]);
  else if(h.bonus)add('combo-detonation',h.impactAt,h,[34,16,16],[{wave:'noise',from:8200,to:650,duration:.24,gain:.145},{wave:'sine',from:190,to:32,duration:.40,gain:.125},{wave:'triangle',from:1600,to:210,duration:.12,gain:.065},{wave:'noise',from:6500,to:1700,duration:.16,gain:.035,delay:.065}]);
  else add('blade-contact',h.impactAt,h,[18],[{wave:'noise',from:7200,to:1400,duration:.12,gain:.085},{wave:'triangle',from:1400,to:290,duration:.10,gain:.045},{wave:'sine',from:155,to:60,duration:.19,gain:.044}]);
 }
 if(timeline.mark)add('mark-set',timeline.mark.at,timeline.hits.find(h=>h.kind==='probe'),[],[{wave:'sine',from:1000,to:1600,duration:.16,gain:.015}]);
 return plan.sort((a,b)=>a.at-b.at);
}
