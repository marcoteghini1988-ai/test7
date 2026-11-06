import test from 'node:test';
import assert from 'node:assert/strict';
import {WEAPON_EFFECTS,weaponEffect,planWeaponSalvos,volleyTimeline,projectileFrame,projectileWidth,projectileSourceIndex} from './mathWeaponEffects.js';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {createShip,previewVolley} from './mathDuelEngine.js';
const cards=(value,suit,other=1)=>[{id:'a',value,suit},{id:'b',value:other,suit:'♣'}];

test('tutte le armi del duello hanno un effetto distinto, anche nello stesso seme',()=>{
 assert.deepEqual(Object.keys(WEAPON_EFFECTS),PHASE1_CATALOG.weapons.map(w=>w.id));
 assert.equal(new Set(Object.values(WEAPON_EFFECTS).map(f=>f.profile)).size,PHASE1_CATALOG.weapons.length);
 for(const [a,b] of [['W02','W07'],['W05','W06']]){
  assert.notEqual(weaponEffect(a).profile,weaponEffect(b).profile);
  assert.notEqual(weaponEffect(a).durationMs,weaponEffect(b).durationMs);
  assert.notEqual(weaponEffect(a).cadenceMs,weaponEffect(b).cadenceMs);
 }
 assert.equal(weaponEffect('future'),WEAPON_EFFECTS.W01);
});

test('da 1 a 26 munizioni: ogni colpo reale ha un solo proiettile e un arrivo finito',()=>{
 for(const weaponId of Object.keys(WEAPON_EFFECTS))for(let bullets=1;bullets<=26;bullets++){
  const input=[{weaponId,bullets}],before=structuredClone(input),[s]=planWeaponSalvos(input);
  assert.equal(s.rounds.length,bullets);
  for(const [i,r] of s.rounds.entries()){
   assert.equal(r.index,i);assert.equal(r.arrivalMs-r.launchMs,s.fx.durationMs);
   assert.ok(Number.isFinite(r.bend));assert.ok(r.launchMs>=0&&r.launchMs<=s.fx.burstMs);
   if(i)assert.ok(r.launchMs>s.rounds[i-1].launchMs);
  }
  assert.deepEqual(input,before);
 }
 assert.deepEqual(planWeaponSalvos([{},null,{bullets:0},{bullets:-1},{bullets:NaN},{bullets:.5},{bullets:Infinity}]),[]);
});

test('Prisma e Serbatoio: nessun falso sparo sotto soglia, una scarica e resto conservato',()=>{
 for(const [id,suit,threshold,remainder] of [['C02','♦',12,1],['C04','♥',10,3]]){
  const side=createShip(1,false,{fleetIds:[id]},()=>.5),first=previewVolley(side,cards(9,suit));
  assert.equal(first.totalDamage,0);assert.deepEqual(planWeaponSalvos(first.shots),[]);
  assert.deepEqual(volleyTimeline(first.shots),{arrivalMs:0,settleMs:550});
  side.fleet=first.fleet;
  const second=previewVolley(side,cards(4,suit)),before=structuredClone(second);
  const [salvo]=planWeaponSalvos(second.shots);
  assert.equal(salvo.rounds.length,threshold);assert.equal(salvo.shot.charge,remainder);
  assert.equal(second.totalDamage,threshold*salvo.shot.damagePerBullet);
  assert.deepEqual(second,before);
 }
});

test('munizioni non divise tra navi: il piano visivo conserva quantità e danni del motore',()=>{
 const side=createShip(1,false,{fleetIds:['N00','C01','C04']},()=>.5);
 const volley=previewVolley(side,[{id:'a',value:8,suit:'♥'},{id:'b',value:3,suit:'♥'}]),before=structuredClone(volley);
 const salvos=planWeaponSalvos(volley.shots);
 assert.deepEqual(salvos.map(s=>[s.shot.weaponId,s.rounds.length]),[['W01',11],['W02',11],['W07',10]]);
 assert.equal(salvos.reduce((sum,s)=>sum+s.rounds.length*s.shot.damagePerBullet,0),volley.totalDamage);
 assert.equal(salvos[2].shot.charge,1);assert.deepEqual(volley,before);
});

test('impatto e applicazione HP seguono tutti gli arrivi, anche in una flotta mista',()=>{
 const shots=[{weaponId:'W03',bullets:0},{weaponId:'W04',bullets:26},{weaponId:'W05',bullets:26},{weaponId:'W06',bullets:13},{weaponId:'W07',bullets:10}];
 const salvos=planWeaponSalvos(shots),timeline=volleyTimeline(shots);
 assert.equal(timeline.arrivalMs,Math.max(...salvos.flatMap(s=>s.rounds.map(r=>r.arrivalMs))));
 assert.equal(timeline.settleMs,timeline.arrivalMs+650);
 for(const s of salvos){assert.equal(s.arrivalMs,s.rounds.at(-1).arrivalMs);assert.ok(s.arrivalMs+600<timeline.settleMs);}
 assert.deepEqual(volleyTimeline([{weaponId:'W02',bullets:1}]),{arrivalMs:560,settleMs:1210});
});

test('tutte le traiettorie partono dalla bocca e finiscono sul centro esatto del motore',()=>{
 for(const [dx,dy] of [[-153,-310],[218,-208],[-187,291],[0,0]])for(const bend of [-38,0,38]){
  const start=projectileFrame(dx,dy,bend,0),end=projectileFrame(dx,dy,bend,1);
  assert.ok(Math.abs(start.x)<1e-9&&Math.abs(start.y)<1e-9);
  assert.equal(end.x,dx);assert.equal(end.y,dy);
  for(const t of [0,.25,.5,.75,1])for(const n of Object.values(projectileFrame(dx,dy,bend,t)))assert.ok(Number.isFinite(n));
 }
 assert.equal(projectileFrame(0,200,0,.5).angle,90);
 assert.equal(projectileFrame(0,-200,0,.5).angle,-90);
});

test('schegge curve alternate e ventaglio stretto degli aghi convergono senza rimbalzi',()=>{
 const [arc,needles,pulse]=planWeaponSalvos([{weaponId:'W05',bullets:7},{weaponId:'W06',bullets:7},{weaponId:'W01',bullets:7}]);
 assert.ok(arc.rounds[0].bend>0&&arc.rounds[1].bend<0);
 assert.ok(needles.rounds[0].bend<0&&needles.rounds.at(-1).bend>0);
 assert.equal(needles.rounds[3].bend,0);
 assert.ok(pulse.rounds.every(r=>r.bend===0));
 for(const s of [arc,needles])for(const r of s.rounds){
  const middle=projectileFrame(0,-300,r.bend,.5),end=projectileFrame(0,-300,r.bend,1);
  assert.equal(middle.y,-150);assert.equal(end.x,0);assert.equal(end.y,-300);
  assert.ok(Math.abs(middle.x)<=19);
 }
});

test('ritmo meccanico a terzine distinto dagli impulsi laser e durata della raffica limitata',()=>{
 const [dart]=planWeaponSalvos([{weaponId:'W04',bullets:7}]);
 assert.deepEqual(dart.rounds.slice(0,4).map(r=>r.launchMs),[0,18,36,92]);
 for(const weaponId of Object.keys(WEAPON_EFFECTS)){
  const [s]=planWeaponSalvos([{weaponId,bullets:26}]);
  assert.ok(s.lastLaunchMs<=s.fx.burstMs);assert.ok(s.arrivalMs<1500);
 }
});

test('i segmenti laser restano separati anche a corta distanza e con 26 munizioni',()=>{
 for(const weaponId of ['W02','W08','W22'])for(const bullets of [2,13,26])for(const distance of [150,250,450]){
  const [s]=planWeaponSalvos([{weaponId,bullets}]),width=projectileWidth(s,distance);
  assert.ok(width>0&&width<=s.fx.width);
  for(let i=1;i<s.rounds.length;i++){
   const spacing=distance*(s.rounds[i].launchMs-s.rounds[i-1].launchMs)/s.fx.durationMs;
   assert.ok(width<spacing*.6);
  }
 }
 const [pulse]=planWeaponSalvos([{weaponId:'W01',bullets:26}]);
 assert.equal(projectileWidth(pulse,150),pulse.fx.width);
});

test('scudiera con singola bocca riutilizza correttamente gli effetti doppi',()=>{
 assert.equal(projectileSourceIndex({escortSlot:0},{muzzleIndex:1}),0);
 assert.equal(projectileSourceIndex({escortSlot:1},{muzzleIndex:1}),0);
 assert.equal(projectileSourceIndex({vesselIndex:0},{muzzleIndex:1}),1);
 assert.equal(projectileSourceIndex({vesselIndex:0},{muzzleIndex:0}),0);
});
