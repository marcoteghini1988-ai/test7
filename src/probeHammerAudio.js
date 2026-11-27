import {synthesizeCoreAudio} from './coreThunderAudio.js';
// One score in the live SFX bus, studio video and haptic scheduler.
export function probeHammerCue(kind,phase,{bonus=false,flightMs=kind==='probe'?1080:1220}={}){
 let haptic=[],voices=[];
 if(phase==='fire'){
  haptic=kind==='probe'?[5]:[8];voices=[{wave:'noise',from:kind==='probe'?6100:1200,to:kind==='probe'?2800:6500,duration:flightMs/1000,gain:kind==='probe'?.018:.030},{wave:'sine',from:kind==='probe'?1200:420,to:kind==='probe'?2100:1050,duration:.75,gain:.015}];
 }else if(phase==='block'){
  haptic=[5,15,5];voices=[{wave:'noise',from:4800,to:900,duration:.09,gain:.050},{wave:'sine',from:1100,to:420,duration:.08,gain:.025}];
 }else if(phase==='impact'&&kind==='probe'){
  haptic=[7];voices=[{wave:'triangle',from:1650,to:700,duration:.10,gain:.042},{wave:'noise',from:5600,to:2100,duration:.07,gain:.038}];
 }else if(phase==='impact'&&bonus){
  haptic=[34,16,16];voices=[{wave:'noise',from:8200,to:650,duration:.24,gain:.145},{wave:'sine',from:190,to:32,duration:.40,gain:.125},{wave:'triangle',from:1600,to:210,duration:.12,gain:.065},{wave:'noise',from:6500,to:1700,duration:.16,gain:.035,delay:.065}];
 }else if(phase==='impact'){
  haptic=[18];voices=[{wave:'noise',from:7200,to:1400,duration:.12,gain:.085},{wave:'triangle',from:1400,to:290,duration:.10,gain:.045},{wave:'sine',from:155,to:60,duration:.19,gain:.044}];
 }else if(phase==='mark')voices=[{wave:'sine',from:1000,to:1600,duration:.16,gain:.015}];
 else if(phase==='release'){haptic=[4];voices=[{wave:'sine',from:430,to:150,duration:.25,gain:.018}];}
 return {haptic,voices};
}
export function probeHammerSoundPlan(type){
 const m=/^probe-hammer_(fire|impact|block|mark|release)_(probe|hammer)_(common|rare|epic|legendary)(_bonus)?$/.exec(type||'');
 if(!m)return null;
 const [,phase,kind,rarity,bonus]=m,cue=probeHammerCue(kind,phase,{bonus:!!bonus});
 return {family:kind==='probe'?'ionic-probe':'thunder-hammer',phase,tier:['common','rare','epic','legendary'].indexOf(rarity),cue,layers:cue.voices};
}
const buffers=new WeakMap();
export function playProbeHammerSound(context,destination,type,pitchFactor=1,pan=0,level=1,timeScale=1){
 const plan=probeHammerSoundPlan(type);if(!plan)return false;
 let cache=buffers.get(context);if(!cache){cache=new Map();buffers.set(context,cache);}
 let buffer=cache.get(type);
 if(!buffer){
  const cue={...plan.cue,at:0},duration=Math.max(...cue.voices.map(v=>(v.delay||0)+v.duration));
  const pcm=synthesizeCoreAudio([cue],duration,{sampleRate:context.sampleRate});
  buffer=context.createBuffer(2,pcm.channels[0].length,pcm.sampleRate);
  pcm.channels.forEach((data,index)=>buffer.copyToChannel(data,index));cache.set(type,buffer);
 }
 const source=context.createBufferSource(),gain=context.createGain();source.buffer=buffer;
 source.playbackRate.value=pitchFactor/Math.max(.1,timeScale);gain.gain.value=level;source.connect(gain);
 let panner;
 if(context.createStereoPanner){panner=context.createStereoPanner();panner.pan.value=Math.max(-1,Math.min(1,pan));gain.connect(panner);panner.connect(destination);}
 else gain.connect(destination);
 source.onended=()=>{source.disconnect();gain.disconnect();panner?.disconnect();};source.start();return true;
}
