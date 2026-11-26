import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {card,cardDisplayFacePath} from './fleetNext/rules.js';
import {weaponEnergyContributions} from './fleetNext/weaponEnergyFeedback.js';
import {weaponEffectProfile,fleetWeaponProjectiles} from './maglioBattleVisuals.js';
import {metalWeaponSoundPlan} from './metalWeaponSounds.js';
import {weaponSalvoAudioCue} from './weaponSalvoAudio.js';
import {createMaglioReviewBattle} from '../scripts/maglioReviewBattle.js';
import {resolvePreparedFleetTurn} from './fleetNext/combat.js';

const integration=JSON.parse(readFileSync(new URL('./fleetNext/approvedWeaponIntegration.json',import.meta.url),'utf8'));
const order={cards:[0],targetKind:'part',targetId:'weapons',partId:'weapons'};
test('The 32 active fronts are the verified native RGBA files, with no pending Ganasce revision',()=>{
 assert.equal(integration.cards.length,32);
 assert.equal(integration.cards.filter(c=>c.elementId==='ionic').length,15);
 for(const c of integration.cards){
  assert.doesNotMatch(c.id,/ganasce|collassatore/);
  assert.equal(cardDisplayFacePath(c.id),'/'+c.path.replace(/^public\//,''));
  const png=readFileSync(c.path);
  assert.equal(png.length,c.bytes,c.id);
  assert.equal(createHash('sha256').update(png).digest('hex'),c.sha256,c.id);
  assert.equal(png.readUInt32BE(16),3072);assert.equal(png.readUInt32BE(20),4608);assert.equal(png[25],6);
 }
});
test('All 15 Fulmine variants use their own approved family, rarity and complete audio sequence',()=>{
 const kinds=new Set();
 for(const c of integration.cards.filter(c=>c.elementId==='ionic')){
  const p=weaponEffectProfile(c.id);assert.ok(p.approved);assert.equal(p.kind,c.kind);kinds.add(p.kind);
  for(const phase of ['charge','fire','impact','block']){
   const sound=metalWeaponSoundPlan(p.sound[phase]);assert.ok(sound,c.id+':'+phase);
   assert.equal(sound.family,p.kind);assert.equal(sound.tier,p.tier);assert.equal(sound.phase,phase);
   assert.ok(sound.layers.every(l=>l.duration>0&&l.gain>0));
  }
 }
 assert.equal(kinds.size,4);
});
test('Counted Energy keeps its real physical cards and charges; paid Energy reports only the consumed charges',()=>{
 const side={energyPile:['energy-ionic',{id:'energy-metallic',remaining:2},'energy-metallic']};
 const before=JSON.stringify(side);
 assert.deepEqual(weaponEnergyContributions(side,'metallic',{physicalCount:2},card),[
  {cardId:'energy-metallic',pileIndex:1,beforeCharges:2,afterCharges:2,consumed:0,discarded:false},
  {cardId:'energy-metallic',pileIndex:2,beforeCharges:1,afterCharges:1,consumed:0,discarded:false}
 ]);
 const [spent]=weaponEnergyContributions(side,'metallic',{cost:1},card);
 assert.deepEqual(spent,{cardId:'energy-metallic',pileIndex:1,beforeCharges:2,afterCharges:1,consumed:1,discarded:false});
 assert.equal(JSON.stringify(side),before);
 assert.deepEqual(weaponEnergyContributions({energyPile:[],elementalCharges:{metallic:5}},'metallic',{cost:1},card),[]);
});
test('Induction bypass leaves the actual Defense in place, identifies it, and counts Energy without spending',()=>{
 const id='weapon-designed-metallic-frantumatore-induzione';
 const b=createMaglioReviewBattle({cardId:id,supports:true,withDefense:true,energyCards:1,nowMs:0});
 const r=resolvePreparedFleetTurn(b,'A',order,2000);assert.ok(r.ok,r.reason);
 const event=r.events.find(e=>e.kind==='weapon-designed-shot'&&e.cardId===id);
 assert.equal(event.energyContributions.length,1);assert.equal(event.energyContributions[0].consumed,0);
 assert.deepEqual(r.battle.sides.A.energyPile,b.sides.A.energyPile);
 assert.deepEqual(r.battle.sides.B.defenses,b.sides.B.defenses);
 const bypass=r.events.find(e=>e.kind==='pierce'&&e.sourceWeaponCardId===id);
 assert.ok(bypass);assert.equal(bypass.defenseSource,b.sides.B.defenses[0].source);
});
test('A destroyed escort gets exactly one destruction cue, on the final actual projectile',()=>{
 const id='weapon-confirmed-metallic-maglio-rarity-l';
 const b=createMaglioReviewBattle({cardId:id,supports:true,nowMs:0});b.sides.B.escorts[0].hp=1;
 const r=resolvePreparedFleetTurn(b,'A',{...order,targetKind:'escort',targetId:b.sides.B.escorts[0].id,escortSlot:0},2000);
 assert.ok(r.ok,r.reason);
 const rounds=fleetWeaponProjectiles(r.events).filter(s=>s.cardId===id);
 assert.ok(rounds.every(s=>s.destroyed));
 const cues=rounds.map(s=>weaponSalvoAudioCue(weaponEffectProfile(id,s),s,'impact'));
 assert.equal(cues.filter(c=>c.type==='weapon_hull_destroyed').length,1);
 assert.equal(cues.at(-1).type,'weapon_hull_destroyed');
});
