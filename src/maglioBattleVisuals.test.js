import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {MAGLIO_CARD_ID,MAGLIO_VARIANTS,maglioArtwork,maglioShots,maglioPresentationBerths,
 maglioResolutionMs,weaponEffectProfile,weaponPortalOrigin,fleetWeaponShots} from './maglioBattleVisuals.js';
import {fleetResolutionFxMs,releaseFleetTurnAfterEffects} from './fleetNext/turnPresentation.js';
import {resolvePreparedFleetTurn,autoFleetTurn,createFleetNextBattle} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {createMaglioReviewBattle} from '../scripts/maglioReviewBattle.js';

const order={cards:[0],targetKind:'part',targetId:'weapons',partId:'weapons'};
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
test('Maglio bloccato: resta visibile la carta, senza sparo o impatto fittizio',()=>{
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
 assert.equal(maglioResolutionMs(r.events),4260);assert.equal(fleetResolutionFxMs(r.events),4260);
 assert.equal(fleetResolutionFxMs([...r.events,{kind:'trap-reveal'}]),4260);
 const chosen=[{id:MAGLIO_CARD_ID},{id:MAGLIO_CARD_ID}];
 assert.equal(fleetResolutionFxMs(r.events,chosen),4780,'Due carte devono finire il volo e il loro impatto');
 assert.equal(fleetResolutionFxMs([{kind:'impact'}]),1600);
 assert.equal(fleetResolutionFxMs([]),650);
});
test('Proiettili approvati: quattro ritagli diversi dello stesso PNG RGBA, con volo leggibile',()=>{
 const profiles=MAGLIO_VARIANTS.map(v=>weaponEffectProfile(v.id));
 assert.deepEqual(profiles.map(p=>p.spriteCell),[0,1,2,3]);
 assert.ok(profiles.every(p=>p.flightMs===1400&&p.impactMs===950));
 const bytes=readFileSync('public'+profiles[0].projectileArt);
 assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 assert.equal(bytes.readUInt32BE(16),1922);assert.equal(bytes.readUInt32BE(20),818);
 assert.equal(bytes[25],6,'Il fondo deve essere trasparente, senza rettangoli sulla plancia');
 assert.equal(weaponEffectProfile('weapon-confirmed-metallic-slitta').flightMs,720);
});
test('Tre carte e due Armi in campo: il turno non taglia il proiettile o l’ultimo impatto',()=>{
 const events=MAGLIO_VARIANTS.slice(0,2).map(v=>({kind:'weapon-base-shot',who:'A',
  cardId:v.id,machineSlot:0,actualDamage:18,targetKind:'part',targetId:'weapons'}));
 const cards=[{id:'energy-metallic'},{id:'energy-plasma'},{id:'energy-refrigerant'}];
 assert.equal(fleetResolutionFxMs(events,cards),6340);
 assert.ok(fleetResolutionFxMs(events,cards)>fleetResolutionFxMs(events));
 const release=releaseFleetTurnAfterEffects({phase:'playing'},6340);
 assert.equal(release.deadlineMs,36340,'Restano disponibili tutti i 30 secondi del turno seguente');
});
test('Rarità Maglio: un impatto per ogni rarità, rifiniture visive progressive',()=>{
 const profiles=MAGLIO_VARIANTS.map(v=>weaponEffectProfile(v.id));
 assert.deepEqual(profiles.map(p=>p.trailBands),[1,2,3,4]);
 assert.deepEqual(profiles.map(p=>p.impactRings),[1,2,3,4]);
 assert.ok(profiles.every(p=>p.kind==='gravity-maul'));
 assert.ok(profiles.every(p=>p.approved&&p.sound?.fire&&p.sound?.impact));
 assert.equal(new Set(profiles.map(p=>p.sound.fire)).size,4);
 assert.equal(new Set(profiles.map(p=>p.sound.impact)).size,4);
 const shot={kind:'weapon-base-shot',who:'A',cardId:MAGLIO_CARD_ID,
  actualDamage:18,targetKind:'part',targetId:'weapons',machineSlot:0};
 for(const variant of MAGLIO_VARIANTS){
  const shown=fleetWeaponShots([{...shot,cardId:variant.id}]);
  assert.equal(shown.length,1);assert.equal(shown[0].actualDamage,18);
 }
 assert.equal(fleetWeaponShots([{...shot,blocked:true,actualDamage:0}])[0].fires,false);
 assert.equal(maglioResolutionMs([{...shot,blocked:true,actualDamage:0}]),0);
});
test('Le altre Armi attendono un profilo approvato; i due spari partono dai bordi centrali',()=>{
 const ids=['weapon-confirmed-plasma-nucleo','weapon-confirmed-refrigerant-compression',
  'weapon-new-cryogenic-03','weapon-base-ionic-01','weapon-base-mineral-01',
  'weapon-base-aerial-01','weapon-base-radiant-01','weapon-base-void-01',
  'weapon-base-gravity-01'];
 const profiles=ids.map(weaponEffectProfile);
 assert.ok(profiles.every(p=>p.kind==='legacy-pulse'&&!p.approved&&p.sound===null));
 assert.deepEqual(weaponPortalOrigin('A'),{x:225,y:812,edge:'bottom-usb'});
 assert.deepEqual(weaponPortalOrigin('B'),{x:225,y:-12,edge:'top-opponent'});
 assert.equal(weaponPortalOrigin('C'),null);
});
test('Arma pluricolpo: ogni effetto conserva bersaglio e danno effettivo del motore',()=>{
 const shots=fleetWeaponShots([{kind:'weapon-designed-shot',who:'B',
  cardId:'weapon-confirmed-metallic-slitta',machineId:'review-weapon',machineSlot:1,
  impacts:[{targetKind:'escort',targetId:'guard-1',actualDamage:9},
   {targetKind:'part',targetId:'weapons',actualDamage:0}]}]);
 assert.deepEqual(shots.map(s=>[s.who,s.targetKind,s.targetId,s.actualDamage,s.fires]),[
  ['B','escort','guard-1',9,true],['B','part','weapons',0,false]]);
 assert.equal(shots[1].delayMs,260);
});
test('Armi avanzate e combinate usano gli impatti effettivi, senza colpi inventati',()=>{
 const events=[{kind:'weapon-provisional-shot',who:'A',
  cardId:'weapon-designed-plasma-mortaio-magmatico',machineSlot:0,
  impacts:[{targetKind:'escort',targetId:'guard-1',actualDamage:9},
   {targetKind:'part',targetId:'weapons',actualDamage:0}]},
  {kind:'impact',who:'B',independentWeaponShot:true,
   weaponContributors:['weapon-memory-plasma','weapon-sequence-1'],
   targets:[{kind:'part',id:'weapons',damage:21}]}];
 const shots=fleetWeaponShots(events);
 assert.equal(shots.length,3);
 assert.deepEqual(shots.map(s=>s.fires),[true,false,true]);
 assert.equal(shots[2].actualDamage,21);
 assert.deepEqual(shots[2].contributors,events[1].weaponContributors);
});
