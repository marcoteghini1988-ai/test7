// Offline score of the renderer study, with the same SFX plans and limiter.
// Optional dependency web-audio-engine via ECLISSI_AUDIO_MODULE.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {playMetalWeaponSound} from '../src/metalWeaponSounds.js';
import {weaponEffectProfile} from '../src/maglioBattleVisuals.js';
const {default:engine}=await import(process.env.ECLISSI_AUDIO_MODULE||'web-audio-engine');
const output=resolve(process.argv[2]),study=JSON.parse(readFileSync(resolve(output,'study.json')));
let cursor=0;const chapters=study.variants.map(v=>{const c={...v,start:cursor};cursor+=v.frames/30;return c;});
const rate=48000,length=Math.ceil(cursor*rate),ctx=new engine.OfflineAudioContext(2,length,rate);
const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-12;limiter.ratio.value=8;
limiter.knee.value=24;limiter.attack.value=.003;limiter.release.value=.12;limiter.connect(ctx.destination);
const bus=ctx.createGain();bus.gain.value=.65;bus.connect(limiter);
const cues=[];
function cue(p,phase,time){
 if(!p.sound[phase])return;
 const proxy=new Proxy(ctx,{get(target,key){if(key==='currentTime')return time;
  const value=target[key];return typeof value==='function'?value.bind(target):value;}});
 playMetalWeaponSound(proxy,bus,p.sound[phase],1,.08);cues.push({type:p.sound[phase],time});
}
for(const chapter of chapters){
 const p=weaponEffectProfile(chapter.id),fire=chapter.start+.650;
 cue(p,'charge',Math.max(chapter.start,fire-(p.chargeMs||0)/1000));
 cue(p,'fire',fire);cue(p,'impact',fire+p.flightMs/1000);
 if(p.kind==='alloy-collision')cue(p,'release',fire+p.flightMs/1000+.4);
}
const result=await ctx.startRendering(),channels=[result.getChannelData(0),result.getChannelData(1)];
let peak=0,sum=0;for(let i=0;i<length;i++)for(const c of channels){peak=Math.max(peak,Math.abs(c[i]));sum+=c[i]*c[i];}
const buffer=Buffer.alloc(44+length*4);buffer.write('RIFF');buffer.writeUInt32LE(buffer.length-8,4);
buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(2,22);
buffer.writeUInt32LE(rate,24);buffer.writeUInt32LE(rate*4,28);buffer.writeUInt16LE(4,32);buffer.writeUInt16LE(16,34);
buffer.write('data',36);buffer.writeUInt32LE(length*4,40);
for(let i=0;i<length;i++)for(let c=0;c<2;c++)buffer.writeInt16LE(Math.round(Math.max(-1,Math.min(1,channels[c][i]))*32767),44+i*4+c*2);
writeFileSync(resolve(output,'studio-audio.wav'),buffer);
writeFileSync(resolve(output,'studio-audio.json'),JSON.stringify({kind:'offline-synthesis',notBrowserAudio:true,rate,duration:cursor,
 peak,peakDb:20*Math.log10(peak),rmsDb:10*Math.log10(sum/(length*2)),chapters,cues},null,2));
console.log(JSON.stringify({duration:cursor,peakDb:20*Math.log10(peak),clips:chapters.length}));
