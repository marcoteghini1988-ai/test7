import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createMaglioReviewBattle} from '../scripts/maglioReviewBattle.js';
import {resolvePreparedFleetTurn} from './fleetNext/combat.js';
import {probeHammerSequence,probeHammerCases} from '../scripts/previews/sonda-martello-20261127/sequence.mjs';
import {PROBE_HAMMER_CARD_IDS,probeHammerVariant,probeHammerVisualHit} from './probeHammerSpec.js';
import {fleetWeaponProjectiles,weaponEffectProfile,weaponResolutionMs,weaponVisualCards,weaponShotStartMs} from './maglioBattleVisuals.js';
import {weaponLaunchOrigin} from './weaponKinematics.js';
import {activeProbeMarks,probeMarkTimeline,probeMarkFade} from './probeHammerMarks.js';
import {probeHammerSoundPlan} from './probeHammerAudio.js';
import {weaponHapticPattern} from './weaponHaptics.js';
import {probeHammerFlightPosition,crescentLeadingPoint} from './probeHammerRenderer.js';
import {prepareCinematicEntry,drawCinematicWeapon} from './weaponCinematicRenderer.js';
import {weaponImpactHullFrame} from './weaponHullImpacts.js';
import {createProjectileCamera} from './maglioProjectile3D.js';
import {cardTextFields,localizedCardText,cardTextBasePath} from './cardTextPresentation.js';
import {card} from './fleetNext/rules.js';

const pngHash=b=>createHash('sha256').update(b).digest('hex');
test('Seven approved fronts use their exact original HD bytes and separate English/Italian text bases',()=>{
 assert.equal(PROBE_HAMMER_CARD_IDS.length,7);
 for(const id of PROBE_HAMMER_CARD_IDS)assert.equal(probeHammerVariant(id).rarity,card(id).rarita);
 const manifest=JSON.parse(readFileSync('asset-sources/card-text/sonda-martello/manifest.json'));
 assert.equal(manifest.cards.length,7);
 for(const c of manifest.cards){
  const base=readFileSync(c.path),front=readFileSync('public/assets/fleet-weapon-fronts/'+c.id+'.png');
  assert.equal(pngHash(base),c.sha256);assert.equal(pngHash(front),c.approvedFrontSha256);
  assert.equal(base.readUInt32BE(16),3072);assert.equal(base.readUInt32BE(20),4608);assert.equal(base[25],6);
  const en=cardTextFields(c.id,'en'),it=cardTextFields(c.id,'it');assert.equal(en.length,17);assert.equal(it.length,17);
  assert.equal(en[2].text,'WEAPON');assert.equal(en[8].text,'TURN');
  assert.notEqual(en[0].text,it[0].text);assert.match(localizedCardText(card(c.id),'en').description,/Normal defenses and cover apply/);
  assert.ok(cardTextBasePath(c.id).endsWith(c.id+'-text-base.png'));
 }
});
test('Real combo impacts are sequenced visibly and the turn waits for the last contact, without changing damage',()=>{
 for(const who of ['A','B'])for(const rarity of ['Rara','Epica','Leggendaria']){
  const c=probeHammerSequence({who,rarity}),turn=c.turns.at(-1),shots=fleetWeaponProjectiles(turn.events);
  const hitShots=shots.filter(s=>probeHammerVariant(s.cardId));assert.equal(hitShots.length,3);
  const [probe,first,second]=hitShots,probeProfile=weaponEffectProfile(probe.cardId,probe);
  assert.equal(first.delayMs,probe.delayMs+probeProfile.flightMs+850);
  assert.equal(second.delayMs-first.delayMs,1420);assert.equal(second.impactIndex,1);
  assert.equal(hitShots.reduce((n,h)=>n+h.actualDamage,0),c.frames.reduce((n,f)=>n+f.event.actualDamage,0));
  const start=weaponShotStartMs(weaponVisualCards(shots,[]).length);
  assert.ok(weaponResolutionMs(turn.events)>=start+second.delayMs+1220+1000);
  assert.ok(hitShots.every(s=>weaponLaunchOrigin(s).y===(who==='A'?812:-12)));
  assert.notEqual(weaponLaunchOrigin(first).x,weaponLaunchOrigin(second).x);
 }
});
test('Persistent marks follow actual target/owner, survive the opposing turn, collapse once and expire',()=>{
 const seq=probeHammerSequence({mode:'next-turn',supports:true}),before=seq.frames.at(-1).before;
 assert.equal(activeProbeMarks(before).length,1);
 const shots=fleetWeaponProjectiles(seq.turns.at(-1).events),plan=probeMarkTimeline(before,shots,2000,weaponEffectProfile),mark=plan[0];
 assert.equal(mark.targetId,shots[0].targetId);assert.equal(mark.who,'A');
 assert.equal(mark.until,2000+shots[1].delayMs+1220);assert.equal(probeMarkFade(mark,mark.until+220),0);
 assert.equal(activeProbeMarks(seq.battle).length,0);
 const probe=probeHammerSequence({mode:'probe-only'});assert.equal(activeProbeMarks(probe.battle).length,1);
 const expired=structuredClone(probe.battle);expired.ply=3;assert.equal(activeProbeMarks(expired).length,0);
 for(const mode of ['probe-blocked','target-dies']){
  const c=probeHammerSequence({mode,supports:mode==='target-dies'});
  assert.equal(probeMarkTimeline(c.initial,fleetWeaponProjectiles(c.turns[0].events),0,weaponEffectProfile).length,0);
 }
});
test('Every live case has exactly the emitted contacts; blocked/disabled weapons never get a damage boom',()=>{
 for(const c of probeHammerCases())for(const turn of c.turns){
  const shots=fleetWeaponProjectiles(turn.events).filter(s=>probeHammerVariant(s.cardId));
  const events=turn.events.filter(e=>e.kind==='weapon-provisional-shot'&&probeHammerVariant(e.cardId));
  assert.equal(shots.length,events.reduce((n,e)=>n+e.impacts.length,0));
  for(const s of shots){
   const p=weaponEffectProfile(s.cardId,s),phase=s.defenseBlocked?'block':'impact';
   const sound=probeHammerSoundPlan(p.sound[phase]);assert.equal(sound.family,p.kind);
   if(s.defenseBlocked)assert.deepEqual(sound.cue.haptic,[5,15,5]);
   const pose=weaponImpactHullFrame(p,s,80);
   if(!s.fires||s.defenseBlocked)assert.deepEqual([pose.x,pose.y,pose.thrust],[0,0,0]);
   if(s.fires&&p.kind==='thunder-hammer'&&s.impactIndex===1)assert.deepEqual(weaponHapticPattern(p.kind,'impact',p.tier,1,true),[34,16,16]);
  }
 }
});
test('Both viewing directions have correct depth scaling, finite volume and a nose that reaches the target',()=>{
 for(const who of ['A','B']){
  const from={x:who==='A'?74:331,y:who==='A'?812:-12},to={x:180,y:who==='A'?240:540};
  const p=weaponEffectProfile('weapon-designed-ionic-martello-tuono'),h=probeHammerVisualHit(p,{who,impactIndex:1,fires:true,actualDamage:18},from);
  const a=probeHammerFlightPosition(h,0,to),b=probeHammerFlightPosition(h,p.flightMs,to);
  assert.deepEqual(b.point,to);assert.ok(who==='A'?a.scale>b.scale:a.scale<b.scale);
  const lead=crescentLeadingPoint(20,1.7,1,b.phi);assert.ok([lead.x,lead.y,lead.z].every(Number.isFinite));
 }
});
test('The actual cinematic renderer draws the shared blade/contact and balances Canvas state in each direction',()=>{
 let commands=0,depth=0;
 const gradient={addColorStop(){}};
 const ctx=new Proxy({globalAlpha:1,save(){depth++;},restore(){depth--;assert.ok(depth>=0);},createLinearGradient(){return gradient;},createRadialGradient(){return gradient;}},
  {get(o,k){return k in o?o[k]:(...args)=>{commands++;for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),String(k));};},set(o,k,v){o[k]=v;return true;}});
 for(const who of ['A','B'])for(const index of [0,1]){
  const shot={cardId:'weapon-designed-ionic-martello-tuono-rarity-l',who,impactIndex:index,fires:true,actualDamage:25,targetKind:'part',targetId:'weapons'};
  const p=weaponEffectProfile(shot.cardId,shot),entry=prepareCinematicEntry({profile:p,shot,from:weaponLaunchOrigin(shot),to:{x:225,y:who==='A'?250:560},start:0},createProjectileCamera());
  assert.ok(entry);for(const age of [100,650,1220,1300,1500])drawCinematicWeapon(ctx,ctx,entry,age);
  assert.equal(depth,0);
 }
 assert.ok(commands>400);
});

test('The official battle review prepares each combo case using real prior turns',()=>{
 const expected={'single':1,'combo':2,'next-turn':2,'reverse':1,'expired':1,'double-defense':2,'marked-dead':1,'first-hit-kills':1,'generator-mark':2};
 for(const [mode,count]of Object.entries(expected)){
  const b=createMaglioReviewBattle({cardId:'weapon-designed-ionic-martello-tuono',probeHammerMode:mode,supports:['marked-dead','first-hit-kills'].includes(mode),nowMs:0});
  const r=resolvePreparedFleetTurn(b,'A',{cards:['combo','reverse'].includes(mode)?[0,1]:[0],pass:true,targetKind:'part',targetId:'weapons',partId:'weapons'},2000);
  assert.ok(r.ok,r.reason);const hammer=r.events.find(e=>e.pattern==='thunder-hammer');assert.equal(hammer.hitCount,count,mode);
  if(mode==='double-defense')assert.equal(hammer.actualDamage,0);
  if(mode==='generator-mark')assert.ok(hammer.impacts.every(i=>i.targetId==='generator'));
 }
});
