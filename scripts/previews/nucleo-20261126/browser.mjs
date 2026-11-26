import {drawCorePreview,TIMING} from './visuals.mjs';
import {coreCuePlan,synthesizeCoreAudio} from './audio.mjs';
const data=window.CORE_REVIEW_DATA,canvas=document.getElementById('battle'),ctx=canvas.getContext('2d');ctx.scale(2,2);
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
const select=document.getElementById('case'),play=document.getElementById('play'),mute=document.getElementById('mute'),haptic=document.getElementById('haptic'),status=document.getElementById('status');
const image=src=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src;});
const assets={cards:{},hulls:{}};
for(const [key,src]of Object.entries(data.assets)){
 const im=await image(src);if(key.startsWith('card:'))assets.cards[key.slice(5)]=im;
 else if(key.startsWith('hull:'))assets.hulls[key.slice(5)]=im;else assets[key]=im;
}
for(const [i,c]of data.cases.entries()){const option=document.createElement('option');option.value=i;
 option.textContent=c.title;select.append(option);}
let current=0,index=0,started=0,running=false,audioContext=null,audioSource=null,hapticTimers=[];
const stopAudio=()=>{audioSource?.stop();audioSource=null;hapticTimers.forEach(clearTimeout);hapticTimers=[];};
const stop=()=>{running=false;play.textContent='Riproduci sequenza';stopAudio();};
function reset(){stop();current=Number(select.value)||0;index=0;drawCorePreview(ctx,data.cases[current].frames[0],0,assets,{reducedMotion:motionPreference.matches});status.textContent='Pronto · anteprima isolata';}
async function sound(f){
 stopAudio();if(!mute.checked){audioContext??=new AudioContext();await audioContext.resume();
  const result=synthesizeCoreAudio(coreCuePlan(f),TIMING.total/1000),buffer=audioContext.createBuffer(2,result.channels[0].length,result.sampleRate);
  result.channels.forEach((channel,i)=>buffer.copyToChannel(channel,i));audioSource=audioContext.createBufferSource();audioSource.buffer=buffer;audioSource.connect(audioContext.destination);audioSource.start();}
 if(haptic.checked&&navigator.vibrate)for(const c of coreCuePlan(f))if(c.haptic.length)
  hapticTimers.push(setTimeout(()=>navigator.vibrate(c.haptic),c.at*1000));
}
async function begin(){if(running){stop();return;}index=0;running=true;play.textContent='Ferma';started=performance.now();await sound(data.cases[current].frames[index]);requestAnimationFrame(tick);}
function tick(now){if(!running)return;let elapsed=now-started;const c=data.cases[current];
 if(elapsed>=TIMING.total){index++;if(index>=c.frames.length){stop();status.textContent='Sequenza conclusa · nessuna modifica al gioco';return;}
  started=now;elapsed=0;sound(c.frames[index]);}
 drawCorePreview(ctx,c.frames[index],elapsed,assets,{last:index===c.frames.length-1&&c.expires,reducedMotion:motionPreference.matches});
 status.textContent=`${c.title} · turno ${c.frames[index].stage} · ${c.frames[index].energySpent} cariche consumate`;
 requestAnimationFrame(tick);
}
select.addEventListener('change',reset);play.addEventListener('click',begin);
mute.addEventListener('change',()=>{if(mute.checked)audioSource?.stop();audioSource=null;});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
document.getElementById('repeat').addEventListener('click',()=>{reset();begin();});
for(const card of data.cards){const a=document.createElement('a');a.href=data.assets['card:'+card.id];a.download=card.id+'-anteprima.png';
 const im=document.createElement('img');im.src=a.href;im.alt=card.rarity+' — '+card.name;a.append(im);document.getElementById('cards').append(a);}
reset();
