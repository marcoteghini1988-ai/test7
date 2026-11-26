import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CHAIN_WEAPON_VARIANTS,GRAPPLE_ID,COLLISION_ID,INDUCTION_ID,chainWeaponEffectProfile,
 collisionGroups,collisionFrame,collisionMotionPlan,collisionHullFrame,activeGrappleLinks} from './chainWeaponBattleVisuals.js';
import {fleetWeaponShots,weaponEffectProfile,weaponResolutionMs,weaponShotStartMs,weaponVisualCards} from './maglioBattleVisuals.js';
import {createMaglioReviewBattle} from '../scripts/maglioReviewBattle.js';
import {resolvePreparedFleetTurn,autoFleetTurn} from './fleetNext/combat.js';
import {cardFacePath} from './fleetNext/rules.js';
import {metalWeaponSoundPlan} from './metalWeaponSounds.js';
import {createChainWeaponModel,articulateChainWeapon} from './chainWeaponProjectile3D.js';
import {createProjectileCamera,worldPointToBoard,disposeProjectile} from './maglioProjectile3D.js';
import {metalProjectileFlightFrame} from './metalWeaponProjectile3D.js';
import {requestWeaponHaptic,weaponHapticPattern,HAPTICS_KEY} from './weaponHaptics.js';

const order={cards:[0],targetKind:'part',targetId:'weapons',partId:'weapons'};
for(const v of CHAIN_WEAPON_VARIANTS){
 test(v.id+' · fronte approvato HD, sequenza e suoni dedicati',()=>{
  const art=cardFacePath(v.id);assert.equal(art,'/assets/fleet-weapon-fronts/'+v.id+'.png');
  const png=readFileSync('public'+art);assert.equal(png.readUInt32BE(16),3072);assert.equal(png.readUInt32BE(20),4608);
  const p=weaponEffectProfile(v.id);assert.equal(p.kind,v.kind==='induction'?'induction':'magnetic-grapple');assert.ok(p.approved);
  for(const phase of ['charge','fire','impact']){
   const plan=metalWeaponSoundPlan(p.sound[phase]);assert.ok(plan?.layers.length);
   assert.equal(plan.tier,v.tier);assert.equal(plan.phase,phase);
   assert.ok(weaponHapticPattern(v.kind,phase,v.tier).length);
  }
 });
 for(const who of ['A','B'])for(const slot of [0,1])
 test(v.id+' · '+who+' slot '+(slot+1)+' · stessi bersagli e HP del motore',()=>{
  let b=createMaglioReviewBattle({cardId:v.id,slot,supports:true,nowMs:0});
  if(who==='B')b=resolvePreparedFleetTurn(b,'A',{cards:[],pass:true},1000).battle;
  const snapshot=JSON.stringify(b),r=resolvePreparedFleetTurn(b,who,order,2000);assert.ok(r.ok,r.reason);
  const event=r.events.find(e=>e.cardId===v.id&&e.kind.endsWith('-shot'));assert.ok(event);
  const shots=fleetWeaponShots(r.events).filter(s=>s.cardId===v.id);
  assert.equal(shots.length,1);
  assert.deepEqual(shots.map(s=>s.targetId),event.impacts.map(h=>h.targetId));
  assert.deepEqual(shots.map(s=>s.actualDamage),event.impacts.map(h=>h.actualDamage));
  assert.ok(shots.every(s=>s.machineSlot===slot));
  const start=weaponShotStartMs(weaponVisualCards(shots,[]).length),p=weaponEffectProfile(v.id);
  assert.ok(weaponResolutionMs(r.events)>=start+p.flightMs+p.impactMs);
  if(v.kind==='alloy-collision'){
   assert.equal(collisionGroups(shots).length,0);
   assert.equal(activeGrappleLinks(r.battle).filter(l=>l.who===who).length,1);
  }
  assert.equal(JSON.stringify(b),snapshot,'La presentazione non altera il combattimento');
 });
 test(v.id+' · blocco non produce proiettili o collisioni fittizi',()=>{
  const b=createMaglioReviewBattle({cardId:v.id,supports:true,blocked:true,nowMs:0});
  const r=resolvePreparedFleetTurn(b,'A',order,1000);assert.ok(r.ok,r.reason);
  const shots=fleetWeaponShots(r.events).filter(s=>s.cardId===v.id);
  assert.ok(shots.every(s=>!s.fires));assert.equal(collisionGroups(shots).length,0);
 });
}
test('Ganasce: presa singola persistente, nuova trazione nel secondo turno e consumo della combo',()=>{
 let b=createMaglioReviewBattle({cardId:GRAPPLE_ID,supports:true,nowMs:0});
 let r=resolvePreparedFleetTurn(b,'A',order,1000);assert.ok(r.ok);
 const ids=r.events.find(e=>e.pattern==='magnetic-grapple').impacts.map(h=>h.targetId);
 assert.deepEqual(activeGrappleLinks(r.battle).filter(l=>l.who==='A').map(l=>l.targetId),ids);
 r=resolvePreparedFleetTurn(r.battle,'B',autoFleetTurn(r.battle,'B'),2000);assert.ok(r.ok,r.reason);
 assert.equal(activeGrappleLinks(r.battle).filter(l=>l.who==='A').length,1);
 r=resolvePreparedFleetTurn(r.battle,'A',order,3000);assert.ok(r.ok,r.reason);
 assert.equal(r.events.filter(e=>e.cardId===GRAPPLE_ID&&e.kind==='weapon-provisional-shot').length,1);
 assert.equal(collisionGroups(fleetWeaponShots(r.events)).length,1);
 assert.equal(activeGrappleLinks(r.battle).filter(l=>l.who==='A').length,0);
});
test('Ganasce: non lascia catene sullo scafo realmente distrutto',()=>{
 const b=createMaglioReviewBattle({cardId:GRAPPLE_ID,supports:true,wounded:true,focus:0,nowMs:0});
 const first=resolvePreparedFleetTurn(b,'A',order,1000);
 assert.equal(activeGrappleLinks(first.battle).filter(l=>l.who==='A').length,0);
 assert.equal(collisionGroups(fleetWeaponShots(first.events)).length,0);
});
test('Ganascia B: dopo la scadenza di A funziona ancora da sola, senza una falsa combo',()=>{
 const b=createMaglioReviewBattle({cardId:COLLISION_ID,supports:true,expiredCombo:true,jawCombo:true,nowMs:0});
 assert.equal(activeGrappleLinks(b).length,0);
 const r=resolvePreparedFleetTurn(b,'A',{...order,targetKind:'escort',targetId:b.sides.B.escorts[0].id},2000);assert.ok(r.ok);assert.ok(!r.invalidPrepared);assert.equal(collisionGroups(fleetWeaponShots(r.events)).length,0);
});
test('Collassatore: supporto e madre, due scafi reali, una sola collisione e ripristino esatto',()=>{
 const b=createMaglioReviewBattle({cardId:COLLISION_ID,supports:true,supportCount:1,jawCombo:true,nowMs:0});
 const r=resolvePreparedFleetTurn(b,'A',order,2000);assert.ok(r.ok,r.reason);
 const [g]=collisionGroups(fleetWeaponShots(r.events));assert.ok(g);assert.deepEqual(new Set(g.map(s=>s.targetKind)),new Set(['escort','part']));
 const p=chainWeaponEffectProfile(COLLISION_ID,{jawCombo:true}),plan=collisionMotionPlan({x:90,y:240,radius:27},{x:225,y:220,radius:55});
 assert.ok(plan.offsets[0].x>0&&plan.offsets[1].x<0);
 assert.equal(plan.offsets[0].x+plan.offsets[1].x,0);
 const clear=collisionMotionPlan({x:90,y:240,radius:27},{x:225,y:220,radius:55},{forward:78});
 assert.equal(clear.contact.y,plan.contact.y+78);
 assert.equal(clear.offsets[0].y+clear.offsets[1].y,156,'Entrambi gli scafi avanzano sul tavolo senza attraversare la madre ferma');
 assert.equal(collisionFrame(p.flightMs,p).phase,'contact');assert.equal(collisionFrame(p.flightMs,p).pull,1);
 assert.equal(collisionFrame(p.flightMs+p.impactMs,p).pull,0);
 assert.equal(collisionFrame(p.flightMs+p.impactMs,p).phase,'restored');
});
test('Collassatore: prima libera il corridoio, poi accelera fino al contatto senza frenare',()=>{
 const p=chainWeaponEffectProfile(COLLISION_ID,{jawCombo:true});
 assert.ok(p.flightMs<=1000,'Lo strappo non resta una lenta traslazione');
 const staging=collisionFrame(p.flightMs*.62,p);
 assert.equal(staging.advance,1);assert.ok(staging.pull<.1,'Gli scafi escono davanti alla madre prima di chiudere');
 const step=40,end=collisionFrame(p.flightMs,p).pull;
 const last=end-collisionFrame(p.flightMs-step,p).pull;
 const before=collisionFrame(p.flightMs-step,p).pull-collisionFrame(p.flightMs-step*2,p).pull;
 assert.ok(last>before*1.1,'Il tratto finale accelera: niente ease-out prima dello schianto');
 assert.equal(collisionFrame(p.flightMs+80,p).phase,'release','Non congela gli scafi per 230 ms dopo il contatto');
});
test('Collassatore: torsione speculare, reattori in spinta, reazione e ritorno neutro',()=>{
 const p=chainWeaponEffectProfile(COLLISION_ID,{jawCombo:true});
 const a=collisionHullFrame(p.flightMs-25,p,{direction:1}),b=collisionHullFrame(p.flightMs-25,p,{direction:-1});
 assert.ok(Math.abs(a.roll)>10&&a.thrust>.8);assert.equal(a.roll,-b.roll);
 const hit=collisionHullFrame(p.flightMs+70,p);
 assert.ok(hit.recoil>15&&hit.light>.8&&Math.abs(hit.pitch)>5,'Lo scafo reagisce, si illumina e rincula');
 for(const elapsed of [-1,p.flightMs-25,p.flightMs+70,p.flightMs+p.impactMs]){
  const pose=collisionHullFrame(elapsed,p,{reduced:true});assert.ok(Object.values(pose).every(n=>n===0));
 }
 const final=collisionHullFrame(p.flightMs+p.impactMs,p);assert.ok(Object.values(final).every(n=>n===0));
 for(const id of [COLLISION_ID,COLLISION_ID+'-rarity-l']){
  const profile=chainWeaponEffectProfile(id),sound=metalWeaponSoundPlan(profile.sound.fire);
  assert.ok(sound.layers.every(layer=>(layer.delay+layer.duration)*1000<=profile.flightMs),'Il risucchio termina prima del BOOM');
 }
});
for(const count of [0,1,2])test('Induzione: '+count+' Energie fisiche, Difesa e nessun consumo',()=>{
 const b=createMaglioReviewBattle({cardId:INDUCTION_ID,supports:true,energyCards:count,withDefense:true,nowMs:0});
 const r=resolvePreparedFleetTurn(b,'A',order,1000);assert.ok(r.ok,r.reason);
 const e=r.events.find(e=>e.kind==='weapon-designed-shot');
 assert.equal(e.energyCardsSeen,count);assert.equal(e.energyConsumed,0);
 assert.equal(r.battle.sides.A.energyPile.length,count);
 assert.equal(r.events.filter(e=>e.kind==='weapon-break-defense').length,count>=2?1:0);
 if(count===0)assert.equal(e.actualDamage,0);else assert.ok(e.actualDamage>0);
 assert.equal(e.impacts[0].targetKind,'escort','Non oltrepassa il supporto per colpire la madre');
});
test('Induzione bloccata: conserva la Difesa e non produce danni o rimozioni',()=>{
 const b=createMaglioReviewBattle({cardId:INDUCTION_ID,supports:true,energyCards:2,withDefense:true,blocked:true,nowMs:0});
 const r=resolvePreparedFleetTurn(b,'A',order,1000);assert.ok(r.ok,r.reason);
 assert.equal(fleetWeaponShots(r.events).filter(s=>s.fires).length,0);
 assert.equal(r.events.filter(e=>e.kind==='weapon-break-defense').length,0);
 assert.deepEqual(r.battle.sides.B.defenses,b.sides.B.defenses);
});
test('Modello ganasce: articolazione, dettagli cumulativi e viste fisiche A/B',()=>{
 const camera=createProjectileCamera();let previous=0;
 for(const tier of [1,2,3]){
  const m=createChainWeaponModel('magnetic-grapple',tier);let count=0;m.traverse(o=>{if(o.isMesh)count++;});
  assert.ok(count>previous);previous=count;
  articulateChainWeapon(m,0);assert.ok(m.userData.jaws[0].rotation.y<-.5);
  articulateChainWeapon(m,1);assert.ok(Math.abs(m.userData.jaws[0].rotation.y)<.001);
  for(const [from,to,end] of [[{x:225,y:812},{x:100,y:230},'rear'],[{x:225,y:-12},{x:340,y:580},'front']]){
   const pose=metalProjectileFlightFrame(from,to,.5,camera,m.userData.frontZ);
   assert.equal(pose.visibleEnd,end);
   const final=metalProjectileFlightFrame(from,to,1,camera,m.userData.frontZ),nose=worldPointToBoard(final.nose,camera);
   assert.ok(Math.hypot(nose.x-to.x,nose.y-to.y)<.001);
  }
  disposeProjectile(m);
 }
});
test('Aptica: preferenza, visibilità, attivazione e richiesta distinta dalla verifica fisica',()=>{
 const calls=[],nav={vibrate:p=>{calls.push(p);return true;},userActivation:{hasBeenActive:true}};
 const env={nav,doc:{visibilityState:'visible'},storage:{getItem:()=>null}};
 assert.equal(requestWeaponHaptic('alloy-collision','impact',2,env).status,'requested');
 assert.equal(calls.length,1);assert.equal(requestWeaponHaptic('alloy-collision','impact',2,env).physicalVerified,false);
 assert.equal(requestWeaponHaptic('induction','fire',2,{...env,storage:{getItem:key=>key===HAPTICS_KEY?'false':null}}).status,'muted');
 assert.equal(requestWeaponHaptic('induction','fire',2,{...env,doc:{visibilityState:'hidden'}}).status,'hidden');
 assert.equal(requestWeaponHaptic('induction','fire',2,{...env,nav:{}}).status,'unsupported');
 assert.equal(requestWeaponHaptic('induction','fire',2,{...env,nav:{vibrate:()=>true,userActivation:{hasBeenActive:false}}}).status,'needs-activation');
 assert.equal(calls.length,2,'Le richieste mute/nascoste/incompatibili non toccano il dispositivo');
});
