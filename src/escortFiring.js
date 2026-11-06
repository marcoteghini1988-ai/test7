// Calcolo di scarica: in presenza di scudiere una carta alimenta una sola arma.
// I colpi in carica mantengono la propria munizione fino alla soglia di sparo.
import {routedAmmo} from './escortArmory.js';
import {effectiveGunDamage} from './fleetSystems.js';
import {tacticalEscortDamage} from './escortTactics.js';
function accumulate(weapon,loaded,threshold){
 const ammo=(weapon.charge||0)+loaded;
 if(ammo<threshold){weapon.charge=ammo;return {bullets:0,charging:true};}
 weapon.charge=ammo-threshold;return {bullets:threshold,charging:false};
}
function memoryVolley(weapon,routing){
 const [part,times]=(weapon.combo||'').split('@'),required=part.split('+'),limit=Math.max(1,Number(times)||1);
 const current={H:0,D:0,C:0,S:0};
 for(const route of routing)if(route.weaponId===weapon.id)current[route.suit]+=route.value;
 const sequence=[...(weapon.memory||[]),current].slice(-limit);
 const totals={H:0,D:0,C:0,S:0};
 for(const row of sequence)for(const suit of required)totals[suit]+=row[suit]||0;
 const ready=required.every(suit=>totals[suit]>0);
 weapon.memory=ready?[]:sequence;
 return {bullets:ready?(totals[weapon.seme_trigger]||0):0,charging:!ready};
}
export function previewEscortedVolley(side,cards,focus='auto',context=null){
 const routing=routedAmmo(side,cards,focus);
 const fleet=side.fleet.map(v=>({...v,weapons:v.weapons.map(w=>({...w}))}));
 const escorts=(side.escorts||[]).map(e=>({...e,weapon:{...e.weapon}}));
 const shots=[];let memoryPending=false;
 const usedSuits=new Set(routing.routing.filter(r=>r.weaponId).map(r=>r.suit));
 for(let vesselIndex=0;vesselIndex<fleet.length;vesselIndex++){
  const vessel=fleet[vesselIndex];
  if(vessel.defense?.kind==='mother'&&Object.values(vessel.defense.parts).every(p=>p.hp===0))continue;
  for(const weapon of vessel.weapons){
   let bullets=routing.ammo[weapon.id]||0;if(!bullets)continue;
   let charging=false;
   if(weapon.tipo==='Combo simultanea'&&!(weapon.combo||'').split('+').every(suit=>usedSuits.has(suit)))continue;
   if(weapon.tipo==='Combo a memoria'){
    const status=memoryVolley(weapon,routing.routing);
    bullets=status.bullets;charging=status.charging;
    if(charging)memoryPending=true;
   }else if(weapon.tipo==='Accumulo'){
    const status=accumulate(weapon,bullets,Math.max(1,weapon.soglia_munizioni||1));
    bullets=status.bullets;charging=status.charging;
   }
   shots.push({vesselIndex,shipId:vessel.id,weaponId:weapon.id,weapon:weapon.nome,
    suit:weapon.seme_trigger,bullets,damagePerBullet:weapon.damage,
    damage:effectiveGunDamage(vessel.defense,'mother',bullets*weapon.damage),
    charging,charge:weapon.charge||0,kind:weapon.tipo,visual:weapon.effetto_visivo});
  }
 }
 for(const escort of escorts){
  if(escort.defense.destroyed)continue;
  const weapon=escort.weapon,loaded=routing.ammo[weapon.id]||0;
  if(!loaded)continue;
  const status=weapon.tipo==='Accumulo'?accumulate(weapon,loaded,Math.max(1,weapon.threshold||1)):
   {bullets:loaded,charging:false};
  const suit=routing.routing.find(item=>item.weaponId===weapon.id)?.suit||weapon.suits[0];
  const base=effectiveGunDamage(side.fleet[0]?.defense,'escort',status.bullets*weapon.damage);
  const tactic=tacticalEscortDamage(weapon.role,base,context,escort,side.fleet[0]?.defense);
  shots.push({vesselIndex:0,escortSlot:escort.slot,shipId:escort.parentShipId,
   weaponId:weapon.sourceWeaponId,escortWeaponId:weapon.id,weapon:weapon.name,
   suit,bullets:status.bullets,damagePerBullet:weapon.damage,
   damage:tactic.damage,bonusDamage:tactic.bonus,tacticalRole:weapon.role,tacticalDoctrine:tactic.doctrine,
   charging:status.charging,
   charge:weapon.charge||0,kind:weapon.tipo,visual:'escort'});
 }
 return {fleet,escorts,shots,totalDamage:shots.reduce((sum,shot)=>sum+shot.damage,0),
  memoryPending,routing:routing.routing};
}
