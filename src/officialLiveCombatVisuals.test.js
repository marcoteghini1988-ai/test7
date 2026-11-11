import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTacticalDuel} from './simultaneousDuelEngine.js';
import {applyOfficialLiveAction,createOfficialLiveDuel} from './officialLiveDuelEngine.js';
import {WEAPON_EFFECTS} from './mathWeaponEffects.js';
import {LIVE_AMMO_FEED_MS,LIVE_FX_SPRITES,liveCombatCues,liveDefenseContact,
 liveMountedWeaponEffect,liveShotContacts} from './officialLiveCombatVisuals.js';

function liveGame(levelB=1){
 return createOfficialLiveDuel(createTacticalDuel({
  shipA:'N00',shipB:'N00',levelA:1,levelB,nowMs:0
 }),0);
}
function move(battle,intent,atMs=100){
 const result=applyOfficialLiveAction(battle,'A',intent,atMs);
 assert.equal(result.ok,true,result.reason);
 return result.battle;
}

test('LIVE grafica: impatti mostrano HP effettivi su barriera e su ogni scudiera',()=>{
 let b=liveGame(5);
 b.sides.A.numeric.hand[0].value=10;
 b.sides.B.defense.shield.hp=5;
 b.sides.B.escorts[0].hp=1;
 b=move(b,{type:'numeric',target:'ship',index:0});
 const event=b.history.find(({kind})=>kind==='shot');
 assert.equal(event.shieldBefore,5);
 assert.equal(event.shieldAfter,0);
 assert.deepEqual(liveShotContacts(event),[
  {owner:'B',escortIndex:null,kind:'shield-break',delta:-5},
  {owner:'B',escortIndex:0,kind:'escort-break',delta:-1},
  {owner:'B',escortIndex:1,kind:'escort-hit',delta:-2}
 ]);
 assert.deepEqual(liveShotContacts({...event,damage:0}).map(contact=>contact.kind),
  ['escort-break','escort-hit']);
 assert.equal(liveShotContacts({by:'A',damage:0,shieldBefore:0})[0].kind,'shield-empty');
 assert.equal(liveShotContacts({by:'B',damage:0,shieldBefore:1})[0].kind,'shield-guard');
});

test('LIVE grafica: riparazione speciale registra solo i punti realmente recuperati',()=>{
 let b=liveGame();
 b.sides.A.defense.shield.hp=56;
 b.sides.A.special.hand[0].type='support-shield-repair';
 b=move(b,{type:'special',slot:'open-0',index:0});
 const event=b.history.find(({kind})=>kind==='special');
 assert.deepEqual(event.defenseChanges.map(liveDefenseContact),[
  {owner:'A',escortIndex:null,kind:'shield-repair',delta:4}
 ]);
});

test('LIVE grafica: trappola rivelata al contatto, combinazione completa lascia spazio al KO',()=>{
 const entries=[
  {by:'B',kind:'trap_placed',turn:1,atMs:1,slot:'trap-0'},
  {by:'A',kind:'trap',trigger:'shield',turn:2,atMs:100,type:'tactic-reactive',owner:'B',slot:'trap-0'},
  {by:'A',kind:'shot',turn:2,atMs:100,weaponId:'W01',shipId:'mother',bullets:6},
  {by:'A',kind:'vital_card',turn:2,atMs:200,vitalId:'engine',completed:true},
  {by:'A',kind:'vital_destroyed',turn:2,atMs:200,vitalId:'engine'}
 ];
 const cues=liveCombatCues(entries,250);
 assert.deepEqual(cues.map(cue=>cue.event.kind),['trap_placed','trap','shot','vital_destroyed']);
 assert.equal(cues[0].event.type,undefined);
 assert.equal(cues[1].delay,LIVE_AMMO_FEED_MS+WEAPON_EFFECTS.W01.durationMs-210);
 assert.equal(liveCombatCues(entries,4000).length,0);
});

test('LIVE grafica: carica e rinculo seguono i tempi delle 42 armi e i due lanci W08',()=>{
 for(const weaponId of Object.keys(WEAPON_EFFECTS)){
  const event={kind:'shot',by:'A',shipId:'mother',weaponId,bullets:4};
  const effect=liveMountedWeaponEffect([{event,index:6}],'A');
  const rounds=effect.salvos[0].rounds;
  assert.equal(rounds.length,4,weaponId);
  assert.equal(rounds[0].launchMs,LIVE_AMMO_FEED_MS,weaponId);
  assert.equal(effect.volleys[0].animationKey,6);
  if(weaponId==='W08')assert.deepEqual(rounds.map(round=>round.muzzleIndex),[0,1,0,1]);
  assert.equal(liveMountedWeaponEffect([{event,index:6}],'B'),null);
 }
 const charging={kind:'weapon_charge',by:'A',shipId:'mother',weaponId:'W03',charge:8};
 const effect=liveMountedWeaponEffect([{event:charging,index:9}],'A');
 assert.equal(effect.volleys[0].charging,true);
 assert.equal(effect.salvos.length,0);
});

test('LIVE grafica: tutti gli sprite sono PNG RGBA per la composizione in plancia',()=>{
 assert.equal(LIVE_FX_SPRITES.length,8);
 for(const name of LIVE_FX_SPRITES){
  const png=readFileSync(new URL('../public/assets/battle-fx/'+name+'.png',import.meta.url));
  assert.equal(png.subarray(1,4).toString(),'PNG',name);
  assert.equal(png[25],6,name);
  assert.equal(png.readUInt32BE(16),192,name);
  assert.equal(png.readUInt32BE(20),192,name);
 }
});
