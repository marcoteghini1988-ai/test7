import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {MAGLIO_CARD_ID,MAGLIO_VARIANTS,maglioArtwork,maglioShots,maglioPresentationBerths,maglioAttackMotion,
 maglioResolutionMs} from './maglioBattleVisuals.js';
import {fleetResolutionFxMs,releaseFleetTurnAfterEffects} from './fleetNext/turnPresentation.js';
import {resolvePreparedFleetTurn,autoFleetTurn,createFleetNextBattle} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {createMaglioReviewBattle} from '../scripts/maglioReviewBattle.js';

const order={cards:[0],targetKind:'part',targetId:'weapons',partId:'weapons'};
for(const [name,from,to] of [
 ['giocatore verso supporto sinistro',{x:150,y:400},{x:75,y:145}],
 ['giocatore verso supporto destro',{x:150,y:400},{x:375,y:145}],
 ['giocatore verso madre',{x:300,y:400},{x:225,y:145}],
 ['avversario verso supporto sinistro',{x:150,y:200},{x:75,y:550}],
 ['avversario verso supporto destro',{x:300,y:200},{x:375,y:550}],
 ['avversario verso madre',{x:300,y:200},{x:225,y:550}]
])test('Affondo Maglio: '+name,()=>{
 const {step,recoil,fireFrom}=maglioAttackMotion(from,to);
 const dx=to.x-from.x,dy=to.y-from.y;
 assert.ok(Math.abs(step.x*dy-step.y*dx)<1e-8,'Affondo sulla linea del bersaglio');
 assert.ok(step.x*dx+step.y*dy>0,'Il dispositivo si avvicina al bersaglio');
 assert.ok(Math.abs(Math.hypot(step.x,step.y)-14)<1e-8,'Ingombro massimo 14 px');
 assert.ok(Math.hypot(to.x-fireFrom.x,to.y-fireFrom.y)<Math.hypot(dx,dy));
 assert.ok(recoil.x*dx+recoil.y*dy<0,'Rinculo opposto al bersaglio');
});
test('Affondo Maglio: bersaglio vicino o coincidente non viene oltrepassato',()=>{
 const close=maglioAttackMotion({x:100,y:100},{x:103,y:104});
 assert.ok(Math.hypot(close.step.x,close.step.y)<5);
 const same=maglioAttackMotion({x:100,y:100},{x:100,y:100});
 assert.deepEqual(same.step,{x:0,y:0});assert.deepEqual(same.fireFrom,{x:100,y:100});
});
test('Maglio: otto veri sprite RGBA distinti per quattro rarità e due viste',()=>{
 const paths=MAGLIO_VARIANTS.flatMap(v=>['player','enemy'].map(side=>maglioArtwork(v.id,side)));
 assert.equal(new Set(paths).size,8);
 for(const path of paths){
  assert.ok(existsSync('public'+path));
  const bytes=readFileSync('public'+path);
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.ok(bytes.includes(Buffer.from('ALPH')),'Alpha reale mancante');
 }
 assert.equal(maglioArtwork(MAGLIO_CARD_ID+'-rarity-inventata','enemy'),null);
 assert.equal(maglioArtwork('weapon-confirmed-metallic-slitta','player'),null);
});
for(const slot of [0,1])test('Maglio: giocatore e vera IA sparano dallo slot '+slot+' e sottraggono HP reali',()=>{
 const before=createMaglioReviewBattle({slot,nowMs:0});
 const json=JSON.stringify(before),hpEnemy=before.sides.B.ships[0].hp;
 const r=resolvePreparedFleetTurn(before,'A',order,1000);
 assert.equal(r.ok,true,r.reason);
 const [shot]=maglioShots(r.events);
 assert.ok(shot.fires);assert.equal(shot.who,'A');assert.equal(shot.machineSlot,slot);
 assert.equal(shot.actualDamage,hpEnemy-r.battle.sides.B.ships[0].hp);
 assert.equal(shot.actualDamage,18);
 const displayed=maglioPresentationBerths(before.sides.A,[MAGLIO_CARD_ID],0,[shot],r.battle.sides.A);
 assert.equal(displayed[slot].pending,false);assert.equal(displayed[slot].maglioShot,shot);
 assert.equal(displayed[slot].sourceCardId,MAGLIO_CARD_ID);
 assert.equal(JSON.stringify(before),json,'Il renderer non muta lo stato del combattimento');
 const hpPlayer=r.battle.sides.A.ships[0].hp;
 const ai=autoFleetTurn(r.battle,'B');
 assert.ok(ai.cards.includes(0),'La vera IA deve scegliere il Maglio');
 const reply=resolvePreparedFleetTurn(r.battle,'B',ai,4000);
 assert.equal(reply.ok,true,reply.reason);
 const [enemy]=maglioShots(reply.events);
 assert.ok(enemy.fires);assert.equal(enemy.who,'B');assert.equal(enemy.machineSlot,slot);
 assert.ok(enemy.actualDamage>0);
 const weaponImpact=reply.events.find(e=>e.kind==='impact'&&e.cardId===MAGLIO_CARD_ID);
 assert.equal(enemy.actualDamage,weaponImpact.damage);
 assert.equal(enemy.actualDamage,hpPlayer-reply.battle.sides.A.ships[0].hp);
 assert.equal(reply.battle.sides.A.machines.some(m=>m.sourceCardId===MAGLIO_CARD_ID),false);
 assert.ok(reply.battle.sides.A.discard.includes(MAGLIO_CARD_ID),'Arma scaduta realmente negli scarti');
 const released=releaseFleetTurnAfterEffects(reply.battle,9000);
 assert.equal(released.deadlineMs,39000,'I 30 secondi iniziano dopo gli effetti');
});
test('Maglio bloccato: compare il dispositivo, senza sparo o impatto fittizio',()=>{
 const b=createMaglioReviewBattle({blocked:true,nowMs:0}),hp=b.sides.B.ships[0].hp;
 const r=resolvePreparedFleetTurn(b,'A',order,1000);
 assert.equal(r.ok,true,r.reason);
 const [shot]=maglioShots(r.events);
 assert.equal(shot.fires,false);assert.equal(shot.actualDamage,0);
 assert.equal(r.battle.sides.B.ships[0].hp,hp);
 assert.ok(maglioPresentationBerths(b.sides.A,[],0,[shot],r.battle.sides.A)[0]);
});
test('Maglio: il bersaglio visivo segue il supporto intercettore deciso dal motore',()=>{
 const b=createFleetNextBattle({shipA:'N00',shipB:'C01',raritaA:'Comune',raritaB:'Comune',
  supportRosterA:[],supportRosterB:[{id:'support-c01-01',instanceId:'review-guard',slot:0,level:1}],
  deckA:[],deckB:[],ruleset:HP_SYNC_RULESET,newGeneratorCombat:true,strategicNoDeterioration:true,nowMs:0});
 b.sides.A.hand=[MAGLIO_CARD_ID];b.sides.A.energyPile=['energy-metallic'];
 const r=resolvePreparedFleetTurn(b,'A',order,1000);
 assert.equal(r.ok,true,r.reason);
 const [shot]=maglioShots(r.events);
 assert.equal(shot.targetKind,'escort');assert.equal(shot.targetId,b.sides.B.escorts[0].id);
 assert.equal(shot.actualDamage,b.sides.B.escorts[0].hp-r.battle.sides.B.escorts[0].hp);
});
test('Nessuno sparo in preparazione; due Magli separati e attesa fino alla fine degli effetti',()=>{
 assert.deepEqual(maglioShots([{kind:'machine-deploy',cardId:MAGLIO_CARD_ID,who:'A',machineSlot:0}]),[]);
 const b=createMaglioReviewBattle({nowMs:0});b.sides.A.hand=[MAGLIO_CARD_ID,MAGLIO_CARD_ID];
 const r=resolvePreparedFleetTurn(b,'A',{...order,cards:[0,1]},1000);
 assert.equal(r.ok,true,r.reason);
 const shots=maglioShots(r.events);
 assert.equal(shots.length,2);assert.equal(shots[1].delayMs,260);
 assert.equal(maglioResolutionMs(r.events),2460);assert.equal(fleetResolutionFxMs(r.events),2460);
 assert.equal(fleetResolutionFxMs([...r.events,{kind:'trap-reveal'}]),4200);
 assert.equal(fleetResolutionFxMs([{kind:'impact'}]),1600);
 assert.equal(fleetResolutionFxMs([]),650);
});
