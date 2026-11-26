import {TIMING} from './visuals.mjs';
// Stessa partitura deterministica nell'HTML e nel video. Nessuna API esterna.
export function coreCuePlan(f){
 const level=f.currentStage,tier=['Rara','Epica','Leggendaria'].indexOf(f.rarity),plan=[];
 const cue=(phase,at,haptic,voices)=>plan.push({phase,at,haptic,voices});
 if(f.recharge)cue('energy-spent',.02,[7],
  [{wave:'sine',from:190,to:510+level*75,duration:.50,gain:.045},
   {wave:'noise',from:2100,to:4500,duration:.48,gain:.022}]);
 if(f.broken&&f.stage===2)cue('charge-lost',.02,[4,25,4],
  [{wave:'triangle',from:690,to:130,duration:.36,gain:.04}]);
 cue('launch',TIMING.charge/1000,[],[
  {wave:'sine',from:320+level*80,to:570+level*160,duration:1.20,gain:.019+level*.004},
  {wave:'noise',from:2500,to:4900,duration:1.20,gain:.016+level*.003}]);
 cue(f.blocked?'block':'impact',(TIMING.charge+TIMING.flight)/1000,
  f.blocked?[7,14,7]:[10+level*6+tier*2],f.blocked?
   [{wave:'noise',from:5100,to:1200,duration:.09,gain:.075},
    {wave:'sine',from:990,to:400,duration:.08,gain:.035}]:
   [{wave:'noise',from:6200,to:900,duration:.12+level*.018,gain:.085+level*.015},
    {wave:'triangle',from:1230+level*110,to:190,duration:.11,gain:.035},
    {wave:'sine',from:155+level*22,to:55,duration:.20+level*.035,gain:.035+level*.016}]);
 if(f.expires)cue('release',3.40,[5],[{wave:'sine',from:430,to:150,duration:.25,gain:.018}]);
 return plan;
}
export function synthesizeCoreAudio(cues,duration,{sampleRate=48000}={}){
 const channels=[new Float32Array(Math.ceil(duration*sampleRate)),new Float32Array(Math.ceil(duration*sampleRate))];
 for(const [ci,cue]of cues.entries())for(const [vi,v]of cue.voices.entries()){
  const count=Math.ceil(v.duration*sampleRate),offset=Math.round(cue.at*sampleRate),pan=Math.max(-1,Math.min(1,cue.pan||0));
  const left=Math.sqrt((1-pan)/2),right=Math.sqrt((1+pan)/2);let phase=0,seed=9317+ci*231+vi*13,previous=0,low=0;
  for(let n=0;n<count;n++){
   const u=n/count,freq=v.from*(v.to/v.from)**u;phase+=TAU*freq/sampleRate;
   let wave;
   if(v.wave==='noise'){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const raw=seed/2147483648-1;
    const high=raw-previous;previous=raw;low+=Math.min(.95,freq/sampleRate*3)*(high-low);wave=low;}
   else wave=v.wave==='triangle'?2/Math.PI*Math.asin(Math.sin(phase)):Math.sin(phase);
   const envelope=Math.min(1,n/(sampleRate*.004))*Math.min(1,(count-n)/(sampleRate*.006))*Math.exp(-u*(v.wave==='noise'?2.8:3.6));
   const value=wave*envelope*v.gain*3.4,index=offset+n;if(index<0||index>=channels[0].length)continue;
   channels[0][index]+=value*left;channels[1][index]+=value*right;
  }
 }
 return {channels,sampleRate,duration};
}
const TAU=Math.PI*2;
