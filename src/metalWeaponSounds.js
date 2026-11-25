// Partiture brevi per ID di famiglia e rarità, sul bus SFX del gioco.
// I piccoli arpeggi sono risonanze meccaniche, non altri colpi di danno.
import {chainWeaponSoundPlan} from './chainWeaponSounds.js';
import {precisionWeaponSoundPlan} from './precisionWeaponSounds.js';
import {maglioWeaponSoundPlan} from './maglioWeaponSounds.js';
const rarityNames=['common','rare','epic','legendary'];
function baseMetalWeaponSoundPlan(type){
 const match=/^(slitta|reclaimer)_(charge|fire|impact)_(common|rare|epic|legendary)$/.exec(type);
 if(!match)return maglioWeaponSoundPlan(type)||precisionWeaponSoundPlan(type)||chainWeaponSoundPlan(type);
 const [,family,phase,rarity]=match,tier=rarityNames.indexOf(rarity),thermal=family==='reclaimer';
 if(thermal&&tier<2)return null;
 const layers=[];
 const tone=(wave,from,to,duration,gain,delay=0)=>layers.push({wave,from,to,duration,gain,delay});
 if(phase==='charge'){
  if(thermal){
   tone('sine',135+tier*25,420+tier*60,.57,.075);
   for(let i=0;i<3;i++)tone('triangle',210+i*54,510+i*93,.42,.024,i*.045);
   if(tier===3)tone('sine',1120,1680,.48,.027,.06);
  }else{
   tone('triangle',280+tier*60,710+tier*100,.16+tier*.075,.045);
   if(tier>=1)tone('sine',900,430,.12,.028,.07);
   if(tier>=2)tone('sine',1200,1800,.23,.020,.09);
  }
 }else if(phase==='fire'){
  if(thermal){
   tone('sine',190,62,.25,.20);
   tone('triangle',680,145,.31,.068);
   tone('noise',1900,410,.22,.075);
   if(tier===3)for(let i=0;i<3;i++)tone('sine',1320+i*260,660+i*110,.24,.025,i*.028);
  }else{
   tone('triangle',520+tier*40,115,.16,.15);
   tone('noise',4000,630,.10,.085);
   if(tier>=1)tone('sine',720,220,.21,.048,.025);
   if(tier>=2)tone('sine',1250,490,.26,.033,.055);
   if(tier===3)for(let i=0;i<3;i++)tone('sine',1850+i*310,980+i*160,.30,.025,.06+i*.025);
  }
 }else{
  if(thermal){
   tone('sine',100,38,.33,.22);
   tone('noise',1700,240,.58,.11);
   for(let i=0;i<3;i++)tone('triangle',390+i*94,160+i*24,.33,.035,i*.04);
   if(tier===3)tone('sine',1640,840,.64,.047,.09);
  }else{
   tone('sine',150,48,.21,.20);
   tone('noise',5300,1200,.15+tier*.035,.085);
   tone('triangle',760+tier*190,280,.24+tier*.055,.055);
   if(tier>=2)tone('sine',1210,620,.36,.036,.08);
   if(tier===3)for(let i=0;i<3;i++)tone('sine',1720+i*360,940+i*170,.46,.026,.08+i*.065);
  }
 }
 return {family,phase,tier,layers};
}
export function metalWeaponSoundPlan(type){
 const plan=baseMetalWeaponSoundPlan(type);if(!plan)return null;
 const layers=[...plan.layers],{family,phase,tier}=plan;
 const add=(wave,from,to,duration,gain,delay=0,extra={})=>layers.push({wave,from,to,duration,gain,delay,...extra});
 // A quiet moving body gives each flight a material identity. These tails
 // end before contact; the contact score remains one impact, not a volley.
 if(phase==='fire'){
  if(family==='maglio')add('noise',280,95,1.20,.026,.10,{attack:.12,q:2.8});
  if(family==='slitta')add('noise',7100,1900,.95,.024,.08,{attack:.025,q:1.8});
  if(family==='reclaimer')add('noise',850,2300,1.32,.038,.12,{attack:.16,q:.55});
  if(family==='grapple'){
   add('noise',1100,650,1.20,.026,.10,{attack:.06,q:2.1});
   for(let i=0;i<3;i++)add('triangle',510+i*83,280+i*31,.045,.017,.70+i*.19);
  }
  if(family==='induction'){
   for(let i=0;i<3;i++)add('triangle',350+i*113,650+i*197,.45,.019,.22+i*.22,{attack:.10});
  }
  if(family==='cascade')add('noise',2850,5100,1.10,.025,.12,{q:3.2,attack:.08});
  if(family==='shard'){
   add('noise',2100,450,.96,.021,.09,{q:1.4,attack:.06});
   add('triangle',440,210,.25,.018,.34);add('triangle',340,170,.23,.015,.74);
  }
  if(tier===3&&family!=='collision')add('sine',2240,1190,.67,.012,.28,{attack:.04});
 }
 // Long resonances sound different from the common attack. They stay inside
 // the existing visual impact window and never postpone the next turn.
 if(phase==='impact'&&family==='reclaimer')add('noise',1700,280,.85,.037,.08,{attack:.05,q:.6});
 if(phase==='impact'&&family==='induction')add('triangle',540,126,.47,.028,.12,{attack:.01});
 if(phase==='impact'&&['maglio','collision'].includes(family))
  add('triangle',285,112,.32,.075,.025,{attack:.006});
 if(phase==='impact'&&family==='shard')for(let i=0;i<tier+2;i++)
  add('noise',2200+i*510,840,.055,.019,.14+i*.06,{q:2.6});
 return {...plan,layers};
}
export function playMetalWeaponSound(context,bus,type,pitchFactor=1,pan=0,level=1,timeScale=1){
 const plan=metalWeaponSoundPlan(type);if(!plan)return false;
 const now=context.currentTime;
 // Keep the low body audible on phone speakers, with the existing global
 // SFX volume, mute and limiter still in control of the final level.
 const punch=plan.phase==='impact'?2.1:plan.phase==='fire'?1.65:plan.phase==='charge'?1.35:1.45;
 let destination=bus,panner;
 if(context.createStereoPanner){panner=context.createStereoPanner();panner.pan.value=Math.max(-.6,Math.min(.6,pan));panner.connect(bus);destination=panner;}
 let remaining=plan.layers.length;
 const ended=()=>{remaining--;if(!remaining)panner?.disconnect();};
 const rate=Math.max(.2,Math.min(1.5,timeScale)),volume=Math.max(0,Math.min(1.5,level));
 for(const [index,original] of plan.layers.entries()){
  const layer={...original,delay:original.delay*rate,duration:original.duration*rate,
   attack:(original.attack||.004)*rate};
  const time=now+layer.delay,envelope=context.createGain();
  envelope.gain.setValueAtTime(.0001,time);
  envelope.gain.linearRampToValueAtTime(Math.max(.0001,layer.gain*punch*volume),time+Math.min(layer.duration*.6,layer.attack||.004));
  envelope.gain.exponentialRampToValueAtTime(.0001,time+layer.duration);
  envelope.connect(destination);
  if(layer.wave==='noise'){
   const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*layer.duration),context.sampleRate);
   const samples=buffer.getChannelData(0);let seed=711+plan.tier*1709+index*7919;
   for(const c of plan.family+plan.phase)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
   for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;samples[i]=seed/2147483648-1;}
   const source=context.createBufferSource(),filter=context.createBiquadFilter();
   source.buffer=buffer;filter.type='bandpass';filter.Q.value=layer.q||.6;
   filter.frequency.setValueAtTime(layer.from*pitchFactor,time);
   filter.frequency.exponentialRampToValueAtTime(layer.to*pitchFactor,time+layer.duration);
   source.connect(filter);filter.connect(envelope);source.start(time);source.stop(time+layer.duration);
   source.onended=()=>{source.disconnect();filter.disconnect();envelope.disconnect();ended();};
  }else{
   const source=context.createOscillator();source.type=layer.wave;
   source.frequency.setValueAtTime(layer.from*pitchFactor,time);
   source.frequency.exponentialRampToValueAtTime(layer.to*pitchFactor,time+layer.duration);
   source.connect(envelope);source.start(time);source.stop(time+layer.duration);
   source.onended=()=>{source.disconnect();envelope.disconnect();ended();};
  }
 }
 return true;
}
