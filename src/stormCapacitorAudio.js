import {synthesizeCoreAudio} from './coreThunderAudio.js';
import {stormTimeline,STORM_TIMING} from './stormCapacitorSpec.js';
export function stormCue(phase,tier=2){
 if(phase==='energy')return {haptic:[5],voices:[{wave:'sine',from:190,to:720,duration:.42,gain:.035},{wave:'triangle',from:1200,to:1650,duration:.09,gain:.02}]};
 if(phase==='support')return {haptic:[3],voices:[{wave:'sine',from:960,to:1350,duration:.10,gain:.018}]};
 if(phase==='fire')return {haptic:[8,20,8],voices:[{wave:'noise',from:1200,to:5200,duration:1.5,gain:.045},{wave:'sine',from:95,to:160,duration:1.3,gain:.025}]};
 if(phase==='impact')return {haptic:tier===3?[34,12,10]:[26],voices:[{wave:'noise',from:9000,to:500,duration:.31,gain:tier===3?.13:.11},{wave:'sine',from:120,to:39,duration:.42,gain:.075},{wave:'triangle',from:650,to:110,duration:.18,gain:.035}]};
 if(phase==='block')return {haptic:[7,18,7],voices:[{wave:'noise',from:6500,to:1300,duration:.18,gain:.07},{wave:'sine',from:1450,to:570,duration:.20,gain:.04}]};
 return {haptic:[3],voices:[{wave:'sine',from:230,to:170,duration:.08,gain:.018}]};
}
export function stormAudioCues(sequence){
 const timeline=stormTimeline(sequence),tier=sequence.rarity==='Leggendaria'?3:2;
 return timeline.turns.flatMap((turn,i)=>{
  const offset=i*STORM_TIMING.turnMs/1000,pan=sequence.who==='A'?-.18:.18,cues=[];
  if(turn.energySpent)cues.push({phase:'energy',at:offset+turn.energyAt/1000,pan});
  if(turn.hits.length){
   turn.supportIds.forEach((_,n)=>cues.push({phase:'support',at:offset+(turn.supportAt+n*80)/1000,pan}));
   for(const hit of turn.hits){cues.push({phase:'fire',at:offset+hit.launchAt/1000,pan});
    cues.push({phase:hit.blocked?'block':hit.actualDamage>0?'impact':'contact',at:offset+hit.impactAt/1000,pan:-pan});}
  }else cues.push({phase:'skip',at:offset+.95,pan});
  return cues.map(c=>({...c,...stormCue(c.phase,tier)}));
 });
}
export const synthesizeStormAudio=(cues,duration,options)=>synthesizeCoreAudio(cues,duration,options);
