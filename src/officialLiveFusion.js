// Fusioni via Carte Speciali vere, Sincronia reale e scudiere esistenti.
// Difesa nel PROSSIMO turno avversario: la scudiera usa propri HP, mai HP fittizi.
import {escortInterceptionEfficiency} from './fleetSystems.js';
const OPTIONS=Object.freeze({
 'fusion-barrier':{required:1,defense:.60,assault:0},
 'fusion-strike':{required:1,defense:0,assault:.25},
 'fusion-twin':{required:2,defense:.55,assault:0},
 'fusion-triad':{required:2,defense:.40,assault:.35}
});
export const isLiveFusion=type=>Object.hasOwn(OPTIONS,type);
export function beginLiveFusion(side,type,turn){
 const settings=OPTIONS[type];
 if(!settings)return {ok:false,reason:'fusion_unknown'};
 if(side.sync<100||side.escorts.filter(e=>e.hp>0).length<settings.required||
  side.defense.parts.command.hp<=0||side.defense.parts.engine.hp<=0)
  return {ok:false,reason:'fusion_unavailable'};
 if(side.liveFusion&&side.liveFusion.untilTurn>=turn)
  return {ok:false,reason:'fusion_already_active'};
 side.sync-=100;
 side.liveFusion={type,untilTurn:turn+1,required:settings.required,
  defense:settings.defense,assault:settings.assault};
 return {ok:true,fusion:side.liveFusion};
}
export function liveFusionExpires(side,turn){
 if(side.liveFusion&&turn>side.liveFusion.untilTurn)side.liveFusion=null;
}
export function liveFusionBlocksEscort(side,turn){
 return !!side.liveFusion&&side.liveFusion.untilTurn>=turn;
}
export function interceptWithLiveFusion(side,incoming,turn){
 const fusion=side.liveFusion;
 if(!(incoming>0)||!fusion||fusion.untilTurn<turn||!(fusion.defense>0))
  return {active:false,absorbed:0,remaining:incoming};
 const escorts=side.escorts.filter(e=>e.hp>0);
 if(escorts.length<1)return {active:false,absorbed:0,remaining:incoming};
 const efficiency=escortInterceptionEfficiency(side.defense);
 if(efficiency<=0)return {active:false,absorbed:0,remaining:incoming};
 let remaining=Math.floor(incoming*fusion.defense*efficiency);
 let absorbed=0;
 // Nella Fusione Gemellare/Trina le due scudiere pagano entrambe quando
 // hanno HP disponibili; Barriera usa soltanto la prima.
 const active=escorts.slice(0,fusion.required);
 for(let index=0;index<active.length;index++){
  const escort=active[index];
  const share=index===active.length-1?remaining:Math.ceil(remaining/(active.length-index));
  const taken=Math.min(escort.hp,share);
  escort.hp-=taken;remaining-=taken;absorbed+=taken;
 }
 return {active:true,absorbed,remaining:Math.max(0,incoming-absorbed),type:fusion.type};
}
