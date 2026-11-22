import test from 'node:test';
import assert from 'node:assert/strict';
import {MAGLIO_VARIANTS,maglioShots,maglioArtwork,maglioPresentationBerths} from './maglioBattleVisuals.js';
import {createMaglioReviewBattle} from '../scripts/maglioReviewBattle.js';
import {resolvePreparedFleetTurn,autoFleetTurn} from './fleetNext/combat.js';
import {WEAPON_NEAR_FINAL_BY_ID} from './fleetNext/weaponRarityEvolutions.js';

const other=who=>who==='A'?'B':'A';
function ready(options,who){
 let b=createMaglioReviewBattle({...options,nowMs:0});
 if(who==='B'){
  const r=resolvePreparedFleetTurn(b,'A',{cards:[],pass:true},1000);
  assert.equal(r.ok,true,r.reason);b=r.battle;
 }
 return b;
}
function play(b,who,target={kind:'part',id:'weapons'}){
 const r=resolvePreparedFleetTurn(b,who,{cards:[0],partId:'weapons',
  targetKind:target.kind,targetId:target.id,escortSlot:target.slot},2000+b.ply*3000);
 assert.equal(r.ok,true,r.reason);
 const shots=maglioShots(r.events);assert.equal(shots.length,1);
 return {r,shot:shots[0]};
}
for(const variant of MAGLIO_VARIANTS){
 for(const who of ['A','B'])for(const weaponSlot of [0,1])
 test(variant.rarity+' · lato '+who+' · alloggiamento '+(weaponSlot+1)+' · bersaglio madre',()=>{
  const b=ready({cardId:variant.id,slot:weaponSlot},who),original=JSON.stringify(b);
  const target=b.sides[other(who)],hp=target.ships[0].hp;
  const {r,shot}=play(b,who);
  assert.equal(shot.cardId,variant.id);assert.equal(shot.who,who);
  assert.equal(shot.machineSlot,weaponSlot);assert.equal(shot.targetKind,'part');
  assert.equal(shot.appliedPower,WEAPON_NEAR_FINAL_BY_ID[variant.id].effectSpec.baseDamage);
  assert.equal(shot.actualDamage,hp-r.battle.sides[other(who)].ships[0].hp);
  assert.ok(shot.fires&&shot.actualDamage>0);
  const shown=maglioPresentationBerths(b.sides[who],[],b.ply,[shot],r.battle.sides[who]);
  assert.equal(shown[weaponSlot].sourceCardId,variant.id);
  assert.ok(maglioArtwork(shown[weaponSlot].sourceCardId,who==='A'?'player':'enemy'));
  assert.equal(JSON.stringify(b),original);
 });
 for(const who of ['A','B'])for(const targetSlot of [0,1])for(const wounded of [false,true])
 test(variant.rarity+' · lato '+who+' · supporto '+(targetSlot+1)+(wounded?' · impatto letale':' · impatto normale'),()=>{
  const b=ready({cardId:variant.id,supports:true,wounded,focus:targetSlot},who);
  const enemy=b.sides[other(who)],victim=enemy.escorts[targetSlot],hp=victim.hp,
   motherHp=enemy.ships[0].hp,otherSupport=enemy.escorts[1-targetSlot].hp;
  const {r,shot}=play(b,who,{kind:'escort',id:victim.id,slot:targetSlot});
  const after=r.battle.sides[other(who)],hit=after.escorts.find(e=>e.id===victim.id);
  assert.equal(shot.targetKind,'escort');assert.equal(shot.targetId,victim.id);
  assert.equal(shot.actualDamage,hp-hit.hp);assert.ok(shot.fires);
  assert.equal(after.ships[0].hp,motherHp,'Il colpo al supporto non deve spostarsi alla madre');
  assert.equal(after.escorts[1-targetSlot].hp,otherSupport,'Nessun colpo all altro supporto');
  assert.equal(hit.hp===0,wounded);assert.equal(!!hit.destroyed,wounded);
 });
 test(variant.rarity+' · la vera IA usa la propria variante e colpisce un supporto reale',()=>{
  const b=createMaglioReviewBattle({cardId:variant.id,supports:true,nowMs:0});
  const {r}=play(b,'A',{kind:'escort',id:b.sides.B.escorts[0].id,slot:0});
  const ai=autoFleetTurn(r.battle,'B');assert.ok(ai.cards.includes(0));
  const reply=resolvePreparedFleetTurn(r.battle,'B',ai,5000);
  assert.equal(reply.ok,true,reply.reason);
  const [shot]=maglioShots(reply.events);
  assert.equal(shot.cardId,variant.id);assert.equal(shot.who,'B');assert.equal(shot.targetKind,'escort');
  const victim=r.battle.sides.A.escorts.find(e=>e.id===shot.targetId);
  assert.ok(victim);assert.equal(shot.actualDamage,victim.hp-reply.battle.sides.A.escorts.find(e=>e.id===victim.id).hp);
  assert.ok(reply.battle.sides.A.discard.includes(variant.id));
  assert.ok(!reply.battle.sides.A.machines.some(m=>m.sourceCardId===variant.id));
 });
 test(variant.rarity+' · bonus del supporto alle Carte Arma e blocco rispettati dal renderer',()=>{
  const normal=play(createMaglioReviewBattle({cardId:variant.id,nowMs:0}),'A').shot;
  const boosted=play(createMaglioReviewBattle({cardId:variant.id,boost:true,nowMs:0}),'A').shot;
  assert.ok(boosted.appliedPower>normal.appliedPower);
  assert.ok(boosted.actualDamage>normal.actualDamage);
  const b=createMaglioReviewBattle({cardId:variant.id,blocked:true,supports:true,nowMs:0});
  const hp=b.sides.B.escorts[0].hp;
  const {r,shot}=play(b,'A',{kind:'escort',id:b.sides.B.escorts[0].id,slot:0});
  assert.equal(shot.fires,false);assert.equal(shot.actualDamage,0);
  assert.equal(r.battle.sides.B.escorts[0].hp,hp);
 });
}
