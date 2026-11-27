import {drawStormReview,modeNames} from './visuals.mjs';
import {stormTimeline} from '../../../src/stormCapacitorSpec.js';
import {stormAudioCues,synthesizeStormAudio} from '../../../src/stormCapacitorAudio.js';
const data=window.STORM_REVIEW,canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),
 select=document.querySelector('#case'),seek=document.querySelector('#seek'),mute=document.querySelector('#mute'),
 volume=document.querySelector('#volume'),haptic=document.querySelector('#haptic'),locale=document.querySelector('#locale');
const assets={cards:{},hulls:{}};
await Promise.all(Object.entries(data.assets).map(async([key,url])=>{
 if(key.startsWith('base:'))return;const image=new Image();image.src=url;await image.decode();
 if(key.startsWith('card:'))assets.cards[key.slice(5)]=image;else if(key.startsWith('hull:'))assets.hulls[key.slice(5)]=image;else assets[key]=image;
}));
for(const [i,s]of data.cases.entries()){const o=document.createElement('option');o.value=i;o.textContent=`${s.rarity} · ${s.who} · ${s.supportCount} supporti · ${modeNames[s.mode]}`;select.append(o);}
let current=2,playing=false,request=0,started=0,position=0,audio=null,source=null,timers=[];
select.value=current;
function stop(){playing=false;cancelAnimationFrame(request);timers.forEach(clearTimeout);timers=[];try{source?.stop();}catch{}source=null;try{navigator.vibrate?.(0);}catch{}}
function draw(){ctx.setTransform(2,0,0,2,0,0);drawStormReview(ctx,data.cases[current],position,assets,{reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});seek.value=position;}
function updateCards(){document.querySelector('#cards').replaceChildren(...data.cards.map(c=>{
 const a=document.createElement('article'),face=document.createElement('div'),base=document.createElement('img'),words=document.createElement('div'),p=document.createElement('p');face.className='face';words.className='words';
 base.src=data.assets['base:'+c.id];base.alt=c.names[locale.value];words.innerHTML=c.text[locale.value];face.append(base,words);p.textContent=c.descriptions[locale.value];a.append(face,p);return a;
}));}
async function play(){
 stop();position=0;const s=data.cases[current],duration=stormTimeline(s).duration,cues=stormAudioCues(s);
 seek.max=duration;started=performance.now();playing=true;
 if(!mute.checked){audio??=new AudioContext();await audio.resume();const pcm=synthesizeStormAudio(cues,duration/1000,{sampleRate:audio.sampleRate});
  const buffer=audio.createBuffer(2,pcm.channels[0].length,pcm.sampleRate);pcm.channels.forEach((v,i)=>buffer.copyToChannel(v,i));
  source=audio.createBufferSource();source.buffer=buffer;const gain=audio.createGain();gain.gain.value=Number(volume.value);source.connect(gain);gain.connect(audio.destination);source.start();}
 if(haptic.checked&&document.visibilityState==='visible')for(const c of cues)timers.push(setTimeout(()=>{try{navigator.vibrate?.(c.haptic);}catch{}},c.at*1000));
 const tick=()=>{if(!playing)return;position=Math.min(duration-1,performance.now()-started);draw();if(position<duration-1)request=requestAnimationFrame(tick);else stop();};tick();
}
select.onchange=()=>{stop();current=Number(select.value);position=0;seek.max=stormTimeline(data.cases[current]).duration;draw();};
seek.oninput=()=>{stop();position=Number(seek.value);draw();};document.querySelector('#play').onclick=play;document.querySelector('#pause').onclick=stop;
mute.onchange=()=>{if(mute.checked)stop();};haptic.onchange=()=>{if(!haptic.checked)navigator.vibrate?.(0);};locale.onchange=updateCards;
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
seek.max=stormTimeline(data.cases[current]).duration;updateCards();draw();
