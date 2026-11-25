// Partiture brevi per ID di famiglia e rarità, sul bus SFX del gioco.
// I piccoli arpeggi sono risonanze meccaniche, non altri colpi di danno.
const rarityNames=['common','rare','epic','legendary'];
export function metalWeaponSoundPlan(type){
 const match=/^(slitta|reclaimer)_(charge|fire|impact)_(common|rare|epic|legendary)$/.exec(type);
 if(!match)return null;
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
export function playMetalWeaponSound(context,bus,type,pitchFactor=1){
 const plan=metalWeaponSoundPlan(type);if(!plan)return false;
 const now=context.currentTime;
 for(const layer of plan.layers){
  const time=now+layer.delay,envelope=context.createGain();
  envelope.gain.setValueAtTime(.0001,time);
  envelope.gain.linearRampToValueAtTime(layer.gain,time+.009);
  envelope.gain.exponentialRampToValueAtTime(.0001,time+layer.duration);
  envelope.connect(bus);
  if(layer.wave==='noise'){
   const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*layer.duration),context.sampleRate);
   const samples=buffer.getChannelData(0);let seed=711+plan.tier*1709;
   for(let i=0;i<samples.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;samples[i]=seed/2147483648-1;}
   const source=context.createBufferSource(),filter=context.createBiquadFilter();
   source.buffer=buffer;filter.type='bandpass';filter.Q.value=.6;
   filter.frequency.setValueAtTime(layer.from*pitchFactor,time);
   filter.frequency.exponentialRampToValueAtTime(layer.to*pitchFactor,time+layer.duration);
   source.connect(filter);filter.connect(envelope);source.start(time);source.stop(time+layer.duration);
   source.onended=()=>{source.disconnect();filter.disconnect();envelope.disconnect();};
  }else{
   const source=context.createOscillator();source.type=layer.wave;
   source.frequency.setValueAtTime(layer.from*pitchFactor,time);
   source.frequency.exponentialRampToValueAtTime(layer.to*pitchFactor,time+layer.duration);
   source.connect(envelope);source.start(time);source.stop(time+layer.duration);
   source.onended=()=>{source.disconnect();envelope.disconnect();};
  }
 }
 return true;
}
