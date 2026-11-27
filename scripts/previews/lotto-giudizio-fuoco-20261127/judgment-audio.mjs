import {synthesizeCoreAudio} from '../../../src/coreThunderAudio.js';
import {judgmentFramePlan,JUDGMENT_TIMING} from './judgment-spec.mjs';
export function judgmentAudioCues(sequence){
 return sequence.frames.flatMap((frame,i)=>judgmentFramePlan(frame,sequence.who).hits.flatMap(hit=>{
  const offset=i*JUDGMENT_TIMING.turnMs/1000,pan=sequence.who==='A'?-.18:.18;
  const cue=(phase,at,haptic,voices)=>({phase,at:offset+at,pan:phase==='fire'?pan:-pan,haptic,voices});
  const result=[cue('fire',hit.launchAt/1000,[8,16,5],[
   {wave:'sine',from:170,to:1850,duration:1.95,gain:.033},
   {wave:'triangle',from:490,to:2350,duration:1.9,gain:.016},
   {wave:'noise',from:1700,to:7200,duration:1.95,gain:.032}])];
  if(!hit.blocked&&hit.actualDamage>0)result.push(cue('alignment',hit.impactAt/1000-.22,[5],[
   {wave:'sine',from:2450,to:820,duration:.22,gain:.029},
   {wave:'triangle',from:1600,to:650,duration:.20,gain:.019}]));
  result.push(hit.blocked?cue('block',hit.impactAt/1000,[7,18,7],[
   {wave:'noise',from:6400,to:1300,duration:.19,gain:.075},
   {wave:'sine',from:1600,to:550,duration:.23,gain:.038}]):hit.actualDamage>0?
   cue('impact',hit.impactAt/1000,[38,12,9],[
    {wave:'noise',from:11000,to:780,duration:.21,gain:.17},
    {wave:'sine',from:145,to:35,duration:.47,gain:.092},
    {wave:'triangle',from:950,to:120,duration:.16,gain:.045},
    {wave:'sine',from:730,to:360,duration:.29,gain:.02,delay:.075}]):
   cue('contact',hit.impactAt/1000,[3],[{wave:'sine',from:450,to:180,duration:.09,gain:.017}]));
  return result;
 }));
}
export const synthesizeJudgmentAudio=(cues,duration,options)=>synthesizeCoreAudio(cues,duration,options);
