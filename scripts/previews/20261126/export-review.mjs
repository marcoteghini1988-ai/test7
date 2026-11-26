import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
import {playMetalWeaponSound} from '../../../src/metalWeaponSounds.js';
import {ionicSoundPlan,reviewHapticPattern} from './review-audio.mjs';
const folder=path.resolve(process.argv[2]),target=path.resolve(process.argv[3]),study=JSON.parse(fs.readFileSync(path.join(folder,'review-fx.json')));
const {default:engine}=await import(process.env.ECLISSI_AUDIO_MODULE||'web-audio-engine');
const sr=48000,length=Math.ceil(study.duration*sr),context=new engine.OfflineAudioContext(2,length,sr);
const limiter=context.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=24;limiter.ratio.value=8;limiter.attack.value=.003;limiter.release.value=.12;limiter.connect(context.destination);
const bus=context.createGain();bus.gain.value=.65;bus.connect(limiter);
const layer=(entry,time,pan,level)=>{
 const gain=context.createGain(),start=time+(entry.delay||0),end=start+entry.duration;
 gain.gain.setValueAtTime(.00001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.00002,entry.gain*level),start+.003);gain.gain.exponentialRampToValueAtTime(.00001,end);
 const stereo=context.createStereoPanner();stereo.pan.value=pan;gain.connect(stereo);stereo.connect(bus);
 if(entry.wave==='noise'){
  const size=Math.ceil(sr*entry.duration),buf=context.createBuffer(1,size,sr),data=buf.getChannelData(0);let seed=19753;
  for(let i=0;i<size;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296)*2-1;}
  const source=context.createBufferSource();source.buffer=buf;const filter=context.createBiquadFilter();filter.type='bandpass';filter.Q.value=1.1;filter.frequency.setValueAtTime(entry.from,start);filter.frequency.exponentialRampToValueAtTime(entry.to,end);source.connect(filter);filter.connect(gain);source.start(start);source.stop(end);
 }else{
  const osc=context.createOscillator();osc.type=entry.wave;osc.frequency.setValueAtTime(entry.from,start);osc.frequency.exponentialRampToValueAtTime(entry.to,end);osc.connect(gain);osc.start(start);osc.stop(end);
 }
};
for(const c of study.cases)for(const cue of c.cues){
 const time=c.start+cue.at;cue.hapticPattern=reviewHapticPattern(cue.type?.startsWith('collision')?'alloy-collision':c.kind,cue.phase);
 if(c.kind.startsWith('ionic'))for(const l of ionicSoundPlan(c.kind,cue.phase,['Comune','Rara','Epica','Leggendaria'].indexOf(c.rarity)))layer(l,time,cue.pan||0,(cue.level||1)*8.5);
 else if(cue.type){const clock=new Proxy(context,{get(o,k){if(k==='currentTime')return time;const v=o[k];return typeof v==='function'?v.bind(o):v;}});if(!playMetalWeaponSound(clock,bus,cue.type,2**((cue.pitchSemitones||0)/12),cue.pan||0,cue.level??1,cue.timeScale||1))throw Error('Partitura mancante: '+cue.type);}
}
const rendered=await context.startRendering(),channels=[rendered.getChannelData(0),rendered.getChannelData(1)],wav=Buffer.alloc(44+length*4);
wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(sr,24);wav.writeUInt32LE(sr*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(length*4,40);
let peak=0,sum=0;for(let i=0;i<length;i++)for(let ch=0;ch<2;ch++){const v=channels[ch][i];peak=Math.max(peak,Math.abs(v));sum+=v*v;wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*4+ch*2);}
const audio=path.join(folder,'review-audio.wav');fs.writeFileSync(audio,wav);const concat=path.join(folder,'concat.txt');
fs.writeFileSync(concat,study.cases.map(c=>"file '"+path.join(folder,'case-'+String(c.index).padStart(2,'0'),'video.mp4')+"'").join('\n')+'\n');
const ff=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',concat,'-i',audio,'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000','-movflags','+faststart','-shortest',target],{stdio:'inherit'});
if(ff.status)throw Error('Esportazione video '+ff.status);
const report={...study,video:target,audio:{sampleRate:sr,channels:2,peakDb:20*Math.log10(peak),rmsDb:10*Math.log10(sum/(length*2)),physicalHapticsVerified:false}};
fs.writeFileSync(path.join(folder,'review-export.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({target,cases:study.cases.length,duration:study.duration,peakDb:report.audio.peakDb}));
