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
 // For nonzero native guns: base ship reactor + square-root throughput.
 // With L1 figures, N00: 13, C01: 14, R04: 18, legendary L04 ~26;
 // all differences survive without a first-cycle automatic one-shot.
 const scaled=raw>0?Math.min(45,9+Math.floor(2*Math.sqrt(raw))):0;
 return {raw,scaled,contributions};
}
export function tacticalBarrierPower(side){
 const {raw,scaled,contributions}=tacticalArmamentProfile(side.weapons);
 let amount=scaled;
 const p=side.defense.parts;
 if(p.weapons.hp===0)amount=Math.floor(amount*.5);
 if(p.engine.hp===0)amount=Math.floor(amount*.75);
 return {raw,scaled,amount,contributions};
}
