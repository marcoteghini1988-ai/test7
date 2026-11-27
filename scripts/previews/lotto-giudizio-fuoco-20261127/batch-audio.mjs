import {judgmentAudioCues} from './judgment-audio.mjs';
import {batchFramePlan,batchTurnMs} from './batch-spec.mjs';
import {synthesizeCoreAudio} from '../../../src/coreThunderAudio.js';
export function batchAudioCues(s){
 if(s.kind==='judgment')return judgmentAudioCues(s);
 const tier={Rara:1,Epica:2,Leggendaria:3}[s.rarity];
 return s.frames.flatMap((f,i)=>{
  const plan=batchFramePlan(f,s),offset=i*batchTurnMs(s)/1000,pan=s.who==='A'?-.16:.16;
  const cue=(phase,at,haptic,voices)=>({phase,at:offset+at,pan:phase==='fire'?pan:-pan,haptic,voices}),result=[];
  if(plan.energySpent)result.push(cue('energy',plan.energyAt/1000,[5],[{wave:'sine',from:340,to:900+120*tier,duration:.14,gain:.026}]));
  for(const h of plan.hits){
   result.push(cue('fire',h.launchAt/1000,s.kind==='mortar'?[9+tier*3]:[7,12,5],s.kind==='mortar'?
    [{wave:'noise',from:490,to:130,duration:.30+tier*.025,gain:.08},{wave:'sine',from:85+tier*9,to:32,duration:.34,gain:.065},
     {wave:'noise',from:1800,to:4300,duration:1.45,gain:.018+tier*.003}]:
    [{wave:'noise',from:1400,to:4800,duration:1.60,gain:.04},{wave:'triangle',from:120+tier*50,to:310+tier*120,duration:1.6,gain:.022},
     {wave:'sine',from:450,to:960+tier*110,duration:1.4,gain:.012}]));
   result.push(h.blocked?cue('block',h.impactAt/1000,[7,18,7],[{wave:'noise',from:6200,to:1100,duration:.19,gain:.07},{wave:'sine',from:1400,to:440,duration:.2,gain:.035}]):
    h.actualDamage>0?cue('impact',h.impactAt/1000,s.kind==='mortar'?[20+tier*5,14,6]:[13+tier*3],s.kind==='mortar'?
     [{wave:'noise',from:3100,to:260,duration:.34+tier*.025,gain:.12},{wave:'sine',from:105+tier*8,to:31,duration:.42,gain:.073},
      {wave:'noise',from:8200,to:4000,duration:.38,gain:.027+tier*.004,delay:.08}]:
     [{wave:'noise',from:5400,to:1200,duration:.27,gain:.08+tier*.012},{wave:'triangle',from:600,to:140,duration:.18,gain:.025},{wave:'sine',from:135,to:52,duration:.24,gain:.044}]):
    cue('contact',h.impactAt/1000,[3],[{wave:'sine',from:280,to:130,duration:.08,gain:.016}]));
  }
  for(const b of plan.burns)result.push(cue('burn',b.at/1000,[4],[{wave:'noise',from:3600,to:1700,duration:.18,gain:.025+tier*.003},{wave:'sine',from:175,to:100,duration:.13,gain:.012}]));
  return result;
 });
}
export const synthesizeBatchAudio=(cues,duration,options)=>synthesizeCoreAudio(cues,duration,options);
