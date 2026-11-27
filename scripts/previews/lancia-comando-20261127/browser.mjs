import {drawLanceReview,caseNames} from './visuals.mjs';
import {commandLanceCues,synthesizeCommandLanceAudio} from '../../../src/commandLanceAudio.js';
const data=window.LANCE_REVIEW,canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d');ctx.scale(2,2);
const $=id=>document.getElementById(id),assets={cards:{},hulls:{}},reduced=matchMedia('(prefers-reduced-motion: reduce)');
await Promise.all(Object.entries(data.assets).map(async([key,url])=>{
 if(key.startsWith('base:'))return;
 const im=new Image();im.src=url;await im.decode();
 if(key.startsWith('card:'))assets.cards[key.slice(5)]=im;else if(key.startsWith('hull:'))assets.hulls[key.slice(5)]=im;else assets[key]=im;
}));
data.cases.forEach((s,i)=>{const o=document.createElement('option');o.value=i;o.textContent=s.rarity+' · '+s.who+' · '+caseNames[s.mode]+(s.supports?' · supporti':' · madre');$('case').append(o);});
function gallery(){
 $('cards').replaceChildren();const lang=$('locale').value;
 for(const c of data.cards){const a=document.createElement('article'),f=document.createElement('div'),img=document.createElement('img'),words=document.createElement('div'),p=document.createElement('p');
  f.className='face';img.src=data.assets['base:'+c.id];img.alt=c.names[lang];words.className='words';words.innerHTML=c.text[lang];p.textContent=c.descriptions[lang];f.append(img,words);a.append(f,p);$('cards').append(a);
 }
}
let current=0,started=0,elapsed=0,raf=0,source,context,gain,timers=[];
function stop(){cancelAnimationFrame(raf);source?.stop();source=null;timers.forEach(clearTimeout);timers=[];if($('haptic').checked)navigator.vibrate?.(0);}
function frame(ms){drawLanceReview(ctx,data.cases[current],ms,assets,{reducedMotion:reduced.matches});$('seek').value=ms;}
async function play(){
 stop();elapsed=0;started=performance.now();const s=data.cases[current],cues=commandLanceCues(s);
 if(!$('mute').checked&&cues.length){
  context??=new AudioContext();await context.resume();gain??=context.createGain();gain.disconnect();gain.connect(context.destination);gain.gain.value=Number($('volume').value);
  const pcm=synthesizeCommandLanceAudio(cues,5.4,{sampleRate:context.sampleRate}),buffer=context.createBuffer(2,pcm.channels[0].length,pcm.sampleRate);pcm.channels.forEach((ch,i)=>buffer.copyToChannel(ch,i));source=context.createBufferSource();source.buffer=buffer;source.connect(gain);source.start();
 }
 started=performance.now();
 for(const c of cues)timers.push(setTimeout(()=>{if($('haptic').checked&&!document.hidden)navigator.vibrate?.(c.haptic);},c.at*1000));
 function tick(now){elapsed=now-started;frame(elapsed);if(elapsed<5400)raf=requestAnimationFrame(tick);else stop();}raf=requestAnimationFrame(tick);
}
$('play').onclick=play;$('pause').onclick=stop;
$('case').onchange=()=>{stop();current=Number($('case').value);frame(0);};
$('seek').oninput=()=>{stop();frame(Number($('seek').value));};
$('locale').onchange=gallery;$('volume').oninput=()=>{if(gain)gain.gain.value=$('mute').checked?0:Number($('volume').value);};
$('mute').onchange=()=>{if(gain)gain.gain.value=$('mute').checked?0:Number($('volume').value);};
$('haptic').onchange=()=>{if(!$('haptic').checked)navigator.vibrate?.(0);};
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);
gallery();frame(0);window.LANCE_REVIEW_READY=true;
