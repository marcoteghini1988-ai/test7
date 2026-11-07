// Scala preliminare di assedio: tutte le 42 armi conservano danno, tipo,
// livello e bocca di fuoco propri. Rendimento decrescente per evitare che
// quattro cannoni leggendari azzerino automaticamente 60 HP in un solo ciclo.
// Non modifica il catalogo, i potenziamenti o altre modalità.
import {weaponEffect} from './mathWeaponEffects.js';

export function nativeWeaponCycleWeight(weapon){
 if(weapon.kind==='Accumulo')return 3;
 if(weapon.kind?.startsWith('Combo'))return 3;
 return 4;
}
export function tacticalWeaponTechnology(weapon){
 const fx=weaponEffect(weapon.id);
 const label=(weapon.name+' '+fx.profile).toLowerCase();
 if(/ion|arc|magnet|fulmine|impuls|onde|ciclone/.test(label))return 'ionico';
 if(/laser|raggio|fot|luce|stella|solare|corona|ecliss/.test(label))return 'laser';
 if(/plasma|fenice|scarlatto|cremisi|ardente|reattor|fuoco/.test(label))return 'plasma';
 if(/obice|cannone|pungigl|mitrag|lancia|ago|dardo|titan|diamante|artigli|lama/.test(label))return 'cinetico';
 return 'esplosivo';
}
export function tacticalArmamentProfile(weapons=[]){
 const contributions=weapons.map(weapon=>{
  const damage=Math.max(0,Number(weapon.damage)||0);
  const weight=nativeWeaponCycleWeight(weapon);
  return Object.freeze({
   weaponId:weapon.id,name:weapon.name,technology:tacticalWeaponTechnology(weapon),
   kind:weapon.kind,damage,weight,raw:Math.floor(damage*weight),
   visual:weaponEffect(weapon.id).profile
  });
 });
 const raw=contributions.reduce((sum,w)=>sum+w.raw,0);
 // Rendimento decrescente degli armamenti originali: la nave più pesante
 // resta più potente, ma non cancella 60 HP in una sola risoluzione.
 // Il contributo del REATTORE L1 viene completato da un bonus misurabile L2..L5
 // in tacticalBarrierPower, non da nuove munizioni generiche.
 const scaled=raw>0?Math.min(41,7+Math.floor(2*Math.sqrt(raw))):0;
 return {raw,scaled,contributions};
}
export function tacticalBarrierPower(side){
 const {raw,scaled,contributions}=tacticalArmamentProfile(side.weapons);
 const level=Number.isInteger(side.level)?Math.max(1,Math.min(5,side.level)):1;
 let amount=scaled>0?Math.min(45,scaled+level-1):0;
 const p=side.defense.parts;
 if(p.weapons.hp===0)amount=Math.floor(amount*.5);
 if(p.engine.hp===0)amount=Math.floor(amount*.75);
 return {raw,scaled,amount,contributions};
}

export function dominantTacticalTechnology(weapons=[]){
 const profile=tacticalArmamentProfile(weapons);
 const totals=new Map();
 for(const shot of profile.contributions)
  totals.set(shot.technology,(totals.get(shot.technology)||0)+shot.raw);
 if(!totals.size)return null;
 // On equal damage, pick first existing native armament order. No arbitrary roulette.
 return [...totals.entries()].sort((a,b)=>b[1]-a[1])[0][0];
}

export function focusedTacticalTechnology(side,weaponFocusId=null){
 const weapons=Array.isArray(side?.weapons)?side.weapons:[];
 const selected=weapons.find(w=>w.id===weaponFocusId)??weapons[0];
 return selected?{weaponId:selected.id,technology:tacticalWeaponTechnology(selected)}:null;
}
