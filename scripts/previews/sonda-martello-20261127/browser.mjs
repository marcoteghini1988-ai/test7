import {drawProbeHammer} from './visuals.mjs';
import {reviewTimeline} from './timeline.mjs';
import {reviewCuePlan,synthesizeReviewAudio} from './audio.mjs';
const data=window.PROBE_HAMMER_REVIEW,canvas=document.getElementById('battle'),ctx=canvas.getContext('2d');ctx.scale(2,2);
const select=document.getElementById('case'),play=document.getElementById('play'),mute=document.getElementById('mute'),haptic=document.getElementById('haptic'),volume=document.getElementById('volume'),status=document.getElementById('status'),locale=document.getElementById('locale');
const motion=matchMedia('(prefers-reduced-motion: reduce)'),assets={cards:{},hulls:{}};
const image=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
for(const [key,src]of Object.entries(data.assets)){const im=await image(src);if(key.startsWith('card:'))assets.cards[key.slice(5)]=im;else if(key.startsWith('hull:'))assets.hulls[key.slice(5)]=im;else assets[key]=im;}
for(const [i,s]of data.cases.entries()){const o=document.createElement('option');o.value=i;o.textContent=s.title;select.append(o);}
let current=0,running=false,started=0,frame=0,audio=null,source=null,gain=null,timers=[];
function stop(){running=false;cancelAnimationFrame(frame);if(source){try{source.stop();}catch{}source.disconnect();source=null;}gain?.disconnect();gain=null;timers.forEach(clearTimeout);timers=[];if(haptic.checked&&navigator.vibrate)navigator.vibrate(0);play.textContent='Riproduci';}
function reset(){stop();current=Number(select.value)||0;drawProbeHammer(ctx,data.cases[current],0,assets,{reducedMotion:motion.matches});status.textContent='Pronto';}
async function begin(){if(running){stop();return;}const s=data.cases[current],plan=reviewCuePlan(s),duration=reviewTimeline(s).total/1000;
 if(!mute.checked){audio??=new AudioContext();await audio.resume();const pcm=synthesizeReviewAudio(plan,duration),b=audio.createBuffer(2,pcm.channels[0].length,pcm.sampleRate);pcm.channels.forEach((ch,i)=>b.copyToChannel(ch,i));source=audio.createBufferSource();source.buffer=b;gain=audio.createGain();gain.gain.value=Number(volume.value);source.connect(gain);gain.connect(audio.destination);const active=source;active.onended=()=>active.disconnect();}
 running=true;started=performance.now();source?.start();play.textContent='Ferma';
 if(haptic.checked&&navigator.vibrate)for(const cue of plan)if(cue.haptic.length)timers.push(setTimeout(()=>{if(running&&!document.hidden)navigator.vibrate(cue.haptic);},cue.at*1000));
 const tick=now=>{if(!running)return;const ms=now-started;drawProbeHammer(ctx,s,ms,assets,{reducedMotion:motion.matches});status.textContent=ms>=reviewTimeline(s).total?'Sequenza conclusa':`${s.title} · ${(ms/1000).toFixed(1)} s`;if(ms>=reviewTimeline(s).total){stop();return;}frame=requestAnimationFrame(tick);};frame=requestAnimationFrame(tick);
}
select.addEventListener('change',reset);play.addEventListener('click',begin);document.getElementById('repeat').addEventListener('click',()=>{reset();begin();});
mute.addEventListener('change',()=>{if(mute.checked&&source){try{source.stop();}catch{}source.disconnect();source=null;}});volume.addEventListener('input',()=>{if(gain)gain.gain.value=Number(volume.value);});haptic.addEventListener('change',()=>{if(!haptic.checked){timers.forEach(clearTimeout);timers=[];navigator.vibrate?.(0);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);motion.addEventListener('change',()=>{if(!running)reset();});
function showCards(){document.getElementById('cards').replaceChildren();for(const c of data.cards){const article=document.createElement('article'),face=document.createElement('span'),im=document.createElement('img');face.className='face';face.dataset.cardId=c.id;face.dataset.locale=locale.value;im.src=data.assets['base:'+c.id];im.alt=c.names[locale.value];face.append(im);const text=document.createElement('span');text.className='words';text.innerHTML=c.text[locale.value];face.append(text);const description=document.createElement('p');description.textContent=c.descriptions[locale.value];article.append(face,description);document.getElementById('cards').append(article);}}
locale.addEventListener('change',showCards);select.value='5';current=5;showCards();reset();
