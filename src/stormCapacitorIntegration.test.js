import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {STORM_CAPACITOR_VARIANTS,STORM_CAPACITOR_KIND,STORM_TIMING,stormContributionPlan} from './stormCapacitorSpec.js';
import {stormCue,stormCapacitorSoundPlan} from './stormCapacitorAudio.js';
import {card,cardDisplayFacePath} from './fleetNext/rules.js';
import {cardTextFields,localizedCardText,cardTextBasePath,cardTextSvgContents} from './cardTextPresentation.js';
import {weaponEffectProfile,fleetWeaponProjectiles,weaponResolutionMs,weaponShotStartMs,weaponVisualCards} from './maglioBattleVisuals.js';
import {weaponImpactHullFrame} from './weaponHullImpacts.js';
import {weaponHapticPattern} from './weaponHaptics.js';
import {weaponSalvoAudioCue} from './weaponSalvoAudio.js';
import {prepareCinematicEntry,drawCinematicWeapon} from './weaponCinematicRenderer.js';
import {createProjectileCamera} from './maglioProjectile3D.js';
import {weaponLaunchOrigin} from './weaponKinematics.js';
import {createMaglioReviewBattle} from '../scripts/maglioReviewBattle.js';
import {resolvePreparedFleetTurn} from './fleetNext/combat.js';
const hash=b=>createHash('sha256').update(b).digest('hex');
function run({id=STORM_CAPACITOR_VARIANTS[0].id,who='A',slot=0,supportCount=2,ownStage=1,stormMode='fed'}={}){
 let b=createMaglioReviewBattle({cardId:id,slot,supports:supportCount>0,supportCount,ownStage,stormMode,nowMs:0});
 if(who==='B')b=resolvePreparedFleetTurn(b,'A',{cards:[],pass:true},100).battle;
 const fresh=!['missing','old-only'].includes(stormMode)&&!(stormMode==='skip-middle'&&ownStage===2);
 const n=(fresh?1:0)+(ownStage===1?1:0);
 const r=resolvePreparedFleetTurn(b,who,{cards:Array.from({length:n},(_,i)=>i),pass:true,targetKind:'part',targetId:'weapons',partId:'weapons'},1000);
 assert.ok(r.ok,r.reason);return {...r,before:b,shots:fleetWeaponProjectiles(r.events).filter(s=>s.cardId===id)};
}
test('Storm approved PNGs and independent EN/IT layers preserve the exact four original files',()=>{
 const m=JSON.parse(readFileSync('asset-sources/card-text/condensatore-tempesta/manifest.json'));
 assert.equal(m.approvalQuote,'confermo');assert.equal(m.artworkRegenerated,false);
 for(const c of m.cards){
  const base=readFileSync(c.path),front=readFileSync('public/assets/fleet-weapon-fronts/'+c.id+'.png');
  assert.equal(hash(base),c.sha256);assert.equal(hash(front),c.approvedFrontSha256);
  assert.deepEqual([base.readUInt32BE(16),base.readUInt32BE(20),base[25]],[3072,4608,6]);
  assert.equal(cardDisplayFacePath(c.id),cardTextBasePath(c.id));
  for(const locale of ['en','it']){assert.equal(cardTextFields(c.id,locale).length,18);assert.match(cardTextSvgContents(c.id,locale,'storm'),/<path d="M/);}
  assert.equal(localizedCardText(card(c.id),'en').name,'Stellar Storm Capacitor Cannon');
  assert.match(localizedCardText(card(c.id),'it').description,/Energia/);
 }
});
test('Storm live resolver matches printed 31/45/59 and 43/62/81 nominal HP without multiplying rarity twice',()=>{
 for(const v of STORM_CAPACITOR_VARIANTS)for(const supportCount of [0,1,2]){
  const r=run({id:v.id,supportCount}),e=r.events.find(e=>e.kind==='weapon-provisional-shot'&&e.cardId===v.id);
  assert.equal(e.impacts.length,1);assert.equal(e.impacts[0].nominalDamage,(v.tier===2?[31,45,59]:[43,62,81])[supportCount]);
  assert.equal(e.energySpent,1);assert.equal(e.energyContributions.reduce((n,c)=>n+c.consumed,0),1);
  assert.equal(e.contributingSupportIds.length,supportCount);
  assert.deepEqual(r.battle.sides.A.escorts.map(e=>e.hp),r.before.sides.A.escorts.map(e=>e.hp));
 }
});
test('Storm launches from both real screen edges and both weapon slots and lets the impact finish',()=>{
 for(const v of STORM_CAPACITOR_VARIANTS)for(const who of ['A','B'])for(const slot of [0,1]){
  const r=run({id:v.id,who,slot}),s=r.shots.find(s=>s.fires),p=weaponEffectProfile(v.id,s);
  assert.ok(s);assert.equal(s.machineSlot,slot);assert.equal(p.kind,STORM_CAPACITOR_KIND);assert.equal(r.shots.filter(s=>s.fires).length,1);
  const origin=weaponLaunchOrigin(s);assert.equal(origin.edge,who==='A'?'player-launch-band':'opponent-launch-band');
  assert.ok(who==='A'?origin.y>800:origin.y<0);
  assert.ok(weaponResolutionMs(r.events)>=weaponShotStartMs(weaponVisualCards(r.shots,[]).length)+p.flightMs+p.impactMs);
 }
});
test('Storm skip/resume, old-only, disabled, third own turn and expiry all follow real machine turns',()=>{
 for(const stormMode of ['missing','old-only','disabled']){
  const r=run({stormMode});assert.equal(r.shots.filter(s=>s.fires||s.defenseBlocked).length,0,stormMode);
 }
 assert.equal(run({stormMode:'skip-middle',ownStage:2}).shots.filter(s=>s.fires).length,0);
 assert.equal(run({stormMode:'skip-middle',ownStage:3}).shots.filter(s=>s.fires).length,1);
 const expired=run({ownStage:4});assert.equal(expired.shots.length,0);assert.ok(expired.before.sides.A.discard.includes(STORM_CAPACITOR_VARIANTS[0].id));
});
test('Storm Defense intercepts the same single cloud with its shield score and zero hull recoil',()=>{
 const r=run({stormMode:'defense'}),s=r.shots[0],p=weaponEffectProfile(s.cardId,s);
 assert.equal(s.defenseBlocked,true);assert.equal(s.actualDamage,0);
 assert.equal(weaponImpactHullFrame(p,s,80).y,0);assert.equal(weaponImpactHullFrame(p,s,80).light,0);
 assert.equal(stormCapacitorSoundPlan(p.sound.block).phase,'block');
});
test('Storm live energy/support feedback, launch, thunder, lethal impacts and haptics share the approved score',()=>{
 for(const v of STORM_CAPACITOR_VARIANTS){
  const r=run({id:v.id}),s=r.shots[0],p=weaponEffectProfile(v.id,s),cues=stormContributionPlan(s,STORM_TIMING.launchAt);
  assert.deepEqual(cues.map(c=>[c.phase,c.at]),[['energy',260],['support',520],['support',600]]);
  assert.deepEqual(cues.filter(c=>c.id).map(c=>c.id),s.contributingSupportIds);
  for(const phase of ['energy','support','fire','impact','block']){
   assert.deepEqual(stormCapacitorSoundPlan(p.sound[phase]).layers,stormCue(phase,v.tier).voices);
   assert.deepEqual(weaponHapticPattern(p.kind,phase,v.tier),stormCue(phase,v.tier).haptic);
  }
  assert.equal(weaponSalvoAudioCue(p,{destroyed:true},'impact').type,p.sound.impact);
 }
});
test('Storm live Canvas cloud and contact stay finite, balanced, reduced-motion compatible and return hull pose to zero',()=>{
 let depth=0,commands=0;const gradient={addColorStop(){}};
 const ctx=new Proxy({globalAlpha:1,save(){depth++;},restore(){depth--;assert.ok(depth>=0);},createLinearGradient(){return gradient;},createRadialGradient(){return gradient;}},{get(o,k){return k in o?o[k]:(...args)=>{commands++;for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),String(k));};},set(o,k,v){o[k]=v;return true;}});
 for(const v of STORM_CAPACITOR_VARIANTS)for(const who of ['A','B'])for(const blocked of [false,true]){
  const shot={cardId:v.id,who,fires:!blocked,actualDamage:blocked?0:81,defenseBlocked:blocked,targetKind:'part',targetId:'weapons'},p=weaponEffectProfile(v.id,shot);
  const entry=prepareCinematicEntry({shot,profile:p,from:weaponLaunchOrigin(shot),to:{x:225,y:who==='A'?250:560},start:0},createProjectileCamera());assert.ok(entry);
  for(const age of [100,700,1499,1500,1700,2549])drawCinematicWeapon(ctx,ctx,entry,age);
  drawCinematicWeapon(ctx,ctx,entry,1550,{reduced:true});assert.equal(depth,0);assert.equal(weaponImpactHullFrame(p,shot,1051).y,0);
 }
 assert.ok(commands>1000);
});
