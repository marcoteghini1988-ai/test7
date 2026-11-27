import {synthesizeCoreAudio} from './coreThunderAudio.js';
import {commandLanceTimeline,commandLanceTier} from './commandLanceSpec.js';
export function commandLanceCue(phase,tier=1){
 const level=Math.max(0,tier-1);
 if(phase==='charge'||phase==='character')return {haptic:[4],voices:[{wave:'sine',from:850,to:1400,duration:.18,gain:.025}]};
 if(phase==='fire')return {haptic:[6],voices:[{wave:'triangle',from:520,to:1500,duration:1.16,gain:.025},{wave:'noise',from:2600,to:6500,duration:1.38,gain:.022}]};
 if(phase==='block')return {haptic:[6,18,6],voices:[{wave:'noise',from:5300,to:800,duration:.12,gain:.06},{wave:'sine',from:1200,to:460,duration:.1,gain:.04}]};
 if(phase==='impact')return {haptic:[15+level*3],voices:[{wave:'noise',from:8400,to:1700,duration:.16+level*.025,gain:.09+level*.01},{wave:'triangle',from:1800,to:330,duration:.12,gain:.05},{wave:'sine',from:165,to:60,duration:.2,gain:.04}]};
 if(phase==='contact')return {haptic:[3],voices:[{wave:'noise',from:2400,to:900,duration:.06,gain:.015}]};
 return {haptic:[],voices:[]};
}
export function commandLanceCues(sequence){
 const plan=commandLanceTimeline(sequence);if(!plan.hits.length)return [];
 const h=plan.hits[0],tier=commandLanceTier(h.rarity)+1,pan=h.who==='A'?-.18:.18;
 return [{phase:'character',at:plan.signal.at/1000,pan},
  {phase:'fire',at:h.launchAt/1000,pan},
  {phase:h.blocked?'block':h.actualDamage>0?'impact':'contact',at:h.impactAt/1000,pan:-pan}].map(c=>({...c,...commandLanceCue(c.phase,tier)}));
}
export const synthesizeCommandLanceAudio=(cues,duration,options)=>synthesizeCoreAudio(cues,duration,options);
export function commandLanceSoundPlan(type){
 const m=/^command-lance_(charge|fire|impact|block)_(rare|epic|legendary)$/.exec(type||'');if(!m)return null;
 const tier=['common','rare','epic','legendary'].indexOf(m[2]),cue=commandLanceCue(m[1],tier);
 return {family:'ionic-command-lance',phase:m[1],tier,cue,layers:cue.voices};
}
const buffers=new WeakMap();
const playing=new Set();
export function cancelCommandLanceSounds(){for(const source of playing){try{source.stop();}catch{}}playing.clear();}
export function playCommandLanceSound(context,destination,type,pitchFactor=1,pan=0,level=1,timeScale=1){
 const plan=commandLanceSoundPlan(type);if(!plan)return false;
 let cache=buffers.get(context);if(!cache){cache=new Map();buffers.set(context,cache);}let buffer=cache.get(type);
 if(!buffer){const duration=Math.max(...plan.layers.map(v=>(v.delay||0)+v.duration));
  const pcm=synthesizeCoreAudio([{...plan.cue,at:0}],duration,{sampleRate:context.sampleRate});
  buffer=context.createBuffer(2,pcm.channels[0].length,pcm.sampleRate);pcm.channels.forEach((data,i)=>buffer.copyToChannel(data,i));cache.set(type,buffer);}
 const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;source.playbackRate.value=pitchFactor/Math.max(.1,timeScale);gain.gain.value=level;source.connect(gain);let panner;
 if(context.createStereoPanner){panner=context.createStereoPanner();panner.pan.value=Math.max(-1,Math.min(1,pan));gain.connect(panner);panner.connect(destination);}else gain.connect(destination);
 source.onended=()=>{playing.delete(source);source.disconnect();gain.disconnect();panner?.disconnect();};playing.add(source);source.start();return true;
}
