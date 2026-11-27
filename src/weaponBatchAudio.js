import {judgmentAudioCues} from './judgmentTemporalAudio.js';
import {batchFramePlan,batchTurnMs,BATCH_WEAPON_VARIANTS,BATCH_KINDS} from './weaponBatchSpec.js';
import {synthesizeCoreAudio} from './coreThunderAudio.js';
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
const scoreCache=new Map();
export function batchWeaponCue(kind,phase,tier){
 const short=Object.keys(BATCH_KINDS).find(k=>BATCH_KINDS[k]===kind)||kind,burn=short==='burn',source=burn?'incinerator':short,key=short+':'+phase+':'+tier;
 if(scoreCache.has(key))return scoreCache.get(key);
 const c=BATCH_WEAPON_VARIANTS.find(c=>c.kind===source&&c.tier===tier);if(!c)return null;
 // Sample the approved score, not a new audio implementation. These are score
 // parameters only; live playback is requested solely for actual combat events.
 const s={...c,who:'A',cardId:c.id,frames:[{stage:1,disabledBefore:false,event:{impacts:[{actualDamage:['contact','block'].includes(phase)?0:1,defenseBlocked:phase==='block'}]},events:[{kind:'weapon-burn',cardId:c.id,who:'B',actualDamage:1}],betweenEvents:[],energyBefore:['energy-plasma'],energyAfter:[]}]};
 const cue=batchAudioCues(s).find(c=>c.phase===(burn?'burn':phase))||null;scoreCache.set(key,cue);return cue;
}
export function batchWeaponSoundPlan(type){
 const m=/^batch-(judgment|mortar|incinerator|burn)_(fire|impact|block|contact|alignment|energy|burn)_([123])$/.exec(type||'');if(!m)return null;
 const tier=Number(m[3]),kind=BATCH_KINDS[m[1]],cue=batchWeaponCue(kind,m[2],tier);if(!cue)return null;
 return {family:kind,phase:m[2],tier,cue,layers:cue.voices};
}
const buffers=new WeakMap(),playing=new Set();
export function cancelBatchWeaponSounds(){for(const s of playing){try{s.stop();}catch{}}playing.clear();}
export function playBatchWeaponSound(context,destination,type,pitchFactor=1,pan=0,level=1,timeScale=1){
 const plan=batchWeaponSoundPlan(type);if(!plan)return false;
 let cache=buffers.get(context);if(!cache){cache=new Map();buffers.set(context,cache);}let buffer=cache.get(type);
 if(!buffer){const duration=Math.max(...plan.layers.map(v=>(v.delay||0)+v.duration)),pcm=synthesizeBatchAudio([{...plan.cue,at:0}],duration,{sampleRate:context.sampleRate});
  buffer=context.createBuffer(2,pcm.channels[0].length,pcm.sampleRate);pcm.channels.forEach((data,i)=>buffer.copyToChannel(data,i));cache.set(type,buffer);}
 const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.playbackRate.value=pitchFactor/Math.max(.1,timeScale);gain.gain.value=level;source.connect(gain);let panner;
 if(context.createStereoPanner){panner=context.createStereoPanner();panner.pan.value=Math.max(-1,Math.min(1,pan));gain.connect(panner);panner.connect(destination);}else gain.connect(destination);
 source.onended=()=>{playing.delete(source);source.disconnect();gain.disconnect();panner?.disconnect();};playing.add(source);source.start();return true;
}
