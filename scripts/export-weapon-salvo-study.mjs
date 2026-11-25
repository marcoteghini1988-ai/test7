// Encodes a renderer study and synthesizes the exact scored projectile cues.
// Not browser capture. No changes to animation speed or number of rounds.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {playMetalWeaponSound} from '../src/metalWeaponSounds.js';
import {STUDY_SALVO_LABELS} from './weaponSalvoStudyLabels.mjs';
const root=resolve(process.argv[2]),target=resolve(process.argv[3]);
const study=JSON.parse(readFileSync(resolve(root,'salvo-study.json')));
const {default:audioEngine}=await import(process.env.ECLISSI_AUDIO_MODULE||'web-audio-engine');
const sampleRate=48000,length=Math.ceil(study.duration*sampleRate),context=new audioEngine.OfflineAudioContext(2,length,sampleRate);
const limiter=context.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=24;limiter.ratio.value=8;limiter.attack.value=.003;limiter.release.value=.12;limiter.connect(context.destination);
const bus=context.createGain();bus.gain.value=.65;bus.connect(limiter);
for(const chapter of study.cases)for(const cue of chapter.cues){
 const time=chapter.start+cue.at,clock=new Proxy(context,{get(o,key){if(key==='currentTime')return time;const value=o[key];return typeof value==='function'?value.bind(o):value;}});
 playMetalWeaponSound(clock,bus,cue.type,2**(cue.pitchSemitones/12),cue.pan,cue.level,cue.timeScale);
}
const rendered=await context.startRendering(),channels=[rendered.getChannelData(0),rendered.getChannelData(1)];
let peak=0,sum=0;const wav=Buffer.alloc(44+length*4);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(sampleRate,24);wav.writeUInt32LE(sampleRate*4,28);wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(length*4,40);
for(let i=0;i<length;i++)for(let c=0;c<2;c++){
 const value=channels[c][i];peak=Math.max(peak,Math.abs(value));sum+=value*value;
 wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,value))*32767),44+i*4+c*2);
}
writeFileSync(resolve(root,'salvo-audio.wav'),wav);
const concat=resolve(root,'concat.txt'),filters=[];
writeFileSync(concat,study.cases.map(c=>{
 const clip=resolve(root,'case-'+String(c.index).padStart(2,'0'),'video.mp4');if(!existsSync(clip))throw Error('Missing clip '+clip);return `file '${clip}'`;
}).join('\n')+'\n');
// Studio captions replace code identifiers with plain Italian. The image
// sequence and native flight timings are unchanged by this finishing pass.
for(const c of study.cases){
 const caption=resolve(root,'caption-'+c.index+'.txt');writeFileSync(caption,STUDY_SALVO_LABELS[c.style]||c.style);
 const enable=`between(t,${c.start.toFixed(6)},${(c.start+c.duration).toFixed(6)})`;
 filters.push(`drawbox=x=0:y=210:w=900:h=60:color=0x0d1723:t=fill:enable='${enable}'`,
  `drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:textfile=${caption}:fontcolor=0x99b1c0:fontsize=19:x=(w-text_w)/2:y=222:enable='${enable}'`);
}
const result=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',concat,'-i',resolve(root,'salvo-audio.wav'),'-map','0:v:0','-map','1:a:0','-vf',filters.join(','),'-c:v','libx264','-preset','veryfast','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-ar','48000','-b:a','192k','-movflags','+faststart','-shortest',target],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
const report={...study,video:target,source:'real combat event packets, offline renderer',audio:'same live scores and bus, offline synthesis',peakDb:20*Math.log10(peak),rmsDb:10*Math.log10(sum/(length*2)),timeScaling:1};
writeFileSync(resolve(root,'salvo-export.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({target,duration:study.duration,peakDb:report.peakDb,cases:study.cases.length}));
