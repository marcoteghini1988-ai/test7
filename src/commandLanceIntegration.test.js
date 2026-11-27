import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp,mkdir,readFile,writeFile,symlink,unlink,rm,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {COMMAND_LANCE_CARD_IDS,COMMAND_LANCE_KIND,commandLanceVariant} from './commandLanceSpec.js';
import {commandLanceCue,commandLanceCues,commandLanceSoundPlan} from './commandLanceAudio.js';
import {cardTextFields,localizedCardText,cardTextBasePath} from './cardTextPresentation.js';
import {card,cardDisplayFacePath} from './fleetNext/rules.js';
import {weaponEffectProfile,fleetWeaponProjectiles,weaponResolutionMs,weaponShotStartMs,weaponVisualCards} from './maglioBattleVisuals.js';
import {createMaglioReviewBattle} from '../scripts/maglioReviewBattle.js';
import {resolvePreparedFleetTurn} from './fleetNext/combat.js';
import {weaponHapticPattern,requestWeaponHaptic} from './weaponHaptics.js';
import {prepareCinematicEntry,drawCinematicWeapon} from './weaponCinematicRenderer.js';
import {createProjectileCamera} from './maglioProjectile3D.js';
import {weaponLaunchOrigin} from './weaponKinematics.js';
import {weaponImpactHullFrame} from './weaponHullImpacts.js';
import {weaponSalvoAudioCue} from './weaponSalvoAudio.js';
import {restoreCommandLanceFronts} from '../scripts/restore-command-lance-fronts.mjs';
import {lanceSequence} from '../scripts/previews/lancia-comando-20261127/sequence.mjs';
const hash=data=>createHash('sha256').update(data).digest('hex');
const order={cards:[0],pass:true,targetKind:'part',targetId:'weapons',partId:'weapons'};
test('The three approved native PNG fronts and text bases retain their exact original bytes and 17 EN/IT fields',()=>{
 const m=JSON.parse(readFileSync('asset-sources/card-text/lancia-comando/manifest.json'));
 assert.equal(m.artworkRegenerated,false);assert.equal(m.cards.length,3);
 for(const c of m.cards){
  const base=readFileSync(c.path),front=readFileSync('public/assets/fleet-weapon-fronts/'+c.id+'.png');
  assert.equal(hash(base),c.sha256);assert.equal(hash(front),c.approvedFrontSha256);
  assert.deepEqual([base.readUInt32BE(16),base.readUInt32BE(20),base[25]],[3072,4608,6]);
  assert.equal(cardTextFields(c.id,'en').length,17);assert.equal(cardTextFields(c.id,'it').length,17);
  assert.equal(localizedCardText(card(c.id),'en').name,'Ionic Command Lance');
  assert.match(localizedCardText(card(c.id),'en').description,/Requires an active allied Character/);
  assert.equal(cardDisplayFacePath(c.id),cardTextBasePath(c.id));
 }
});
test('The official battle fixture uses a Character from real earlier turns and emits one actual lance from both sides and slots',()=>{
 for(const id of COMMAND_LANCE_CARD_IDS)for(const who of ['A','B'])for(const slot of [0,1]){
  let b=createMaglioReviewBattle({cardId:id,slot,supports:true,nowMs:0});
  if(who==='B')b=resolvePreparedFleetTurn(b,'A',{cards:[],pass:true},100).battle;
  assert.equal(b.sides[who].commander.id,'gen-216');assert.equal(b.sides[who].energyPile.length,0);
  const r=resolvePreparedFleetTurn(b,who,order,2000);assert.ok(r.ok,r.reason);
  const e=r.events.find(e=>e.cardId===id&&e.kind==='weapon-provisional-shot'),shots=fleetWeaponProjectiles(r.events).filter(s=>s.cardId===id);
  assert.equal(e.characterCardId,'gen-216');assert.equal(shots.length,1);assert.equal(shots[0].machineSlot,slot);assert.equal(shots[0].actualDamage,e.actualDamage);
  const p=weaponEffectProfile(id,shots[0]);assert.equal(p.kind,COMMAND_LANCE_KIND);assert.equal(p.tier,commandLanceVariant(id).tier);
  assert.ok(weaponResolutionMs(r.events)>=weaponShotStartMs(weaponVisualCards(shots,[]).length)+p.flightMs+p.impactMs);
 }
});
test('Missing, expired and disabled Character/weapon scenarios produce no visible launch; a same-turn Character enables it',()=>{
 for(const mode of ['missing','expired','disabled','same-turn']){
  const b=createMaglioReviewBattle({cardId:COMMAND_LANCE_CARD_IDS[0],lanceReviewMode:mode,nowMs:0});
  const r=resolvePreparedFleetTurn(b,'A',{...order,cards:mode==='same-turn'?[0,1]:[0]},2000);assert.ok(r.ok,r.reason);
  const shots=fleetWeaponProjectiles(r.events).filter(s=>commandLanceVariant(s.cardId)&&(s.fires||s.defenseBlocked));
  assert.equal(shots.length,mode==='same-turn'?1:0,mode);
 }
});
test('The Defense case produces one shield contact, zero damage and zero hull recoil',()=>{
 const b=createMaglioReviewBattle({cardId:COMMAND_LANCE_CARD_IDS[0],lanceReviewMode:'defense',nowMs:0});
 const r=resolvePreparedFleetTurn(b,'A',order,2000),s=fleetWeaponProjectiles(r.events).find(s=>commandLanceVariant(s.cardId));
 assert.ok(s.defenseBlocked);assert.equal(s.actualDamage,0);assert.equal(weaponImpactHullFrame(weaponEffectProfile(s.cardId,s),s,80).y,0);
 assert.equal(commandLanceSoundPlan(weaponEffectProfile(s.cardId,s).sound.block).phase,'block');
});
test('Studio and live audio/haptics use the same charge, flight and contact score, including lethal hits',()=>{
 for(const id of COMMAND_LANCE_CARD_IDS){
  const p=weaponEffectProfile(id),studio=commandLanceCues(lanceSequence({rarity:p.rarity}));
  for(const [i,phase]of ['charge','fire','impact'].entries()){
   const sound=commandLanceSoundPlan(p.sound[phase]);assert.deepEqual(sound.layers,studio[i].voices);
   assert.deepEqual(weaponHapticPattern(p.kind,phase,p.tier),studio[i].haptic);
  }
  assert.equal(weaponSalvoAudioCue(p,{destroyed:true},'impact').type,p.sound.impact);
  const result=requestWeaponHaptic(p.kind,'impact',p.tier,{destroyed:true,nav:{vibrate:()=>true},doc:{visibilityState:'visible'},storage:{getItem:()=>null}});
  assert.deepEqual(result.pattern,commandLanceCue('impact',p.tier).haptic);assert.equal(result.physicalVerified,false);
 }
});
test('Live renderer draws the same finite lance volume and shield/hull contacts, with balanced Canvas state and restored pose',()=>{
 let depth=0,commands=0;const gradient={addColorStop(){}};
 const ctx=new Proxy({globalAlpha:1,save(){depth++;},restore(){depth--;assert.ok(depth>=0);},createLinearGradient(){return gradient;},createRadialGradient(){return gradient;}},{get(o,k){return k in o?o[k]:(...args)=>{commands++;for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),String(k));};},set(o,k,v){o[k]=v;return true;}});
 for(const who of ['A','B'])for(const blocked of [false,true]){
  const shot={cardId:COMMAND_LANCE_CARD_IDS[2],who,fires:!blocked,actualDamage:blocked?0:120,defenseBlocked:blocked,targetKind:'part',targetId:'weapons'},p=weaponEffectProfile(shot.cardId,shot);
  const e=prepareCinematicEntry({shot,profile:p,from:weaponLaunchOrigin(shot),to:{x:225,y:who==='A'?250:560},start:0},createProjectileCamera());assert.ok(e);
  for(const age of [100,700,1380,1450,1800])drawCinematicWeapon(ctx,ctx,e,age);
  drawCinematicWeapon(ctx,ctx,e,1450,{reduced:true});assert.equal(depth,0);assert.equal(weaponImpactHullFrame(p,shot,1001).y,0);
 }
 assert.ok(commands>300);
});
test('A fresh checkout restores an approved lance PNG exactly and rejects a corrupted part before writing',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'eclissi-lance-restore-')),archive='asset-sources/weapon-fronts/lancia-comando-2026-11-27';
 try{
  const m=JSON.parse(await readFile(archive+'/manifest.json','utf8'));await mkdir(path.join(root,archive),{recursive:true});
  for(const c of m.cards){const dest=path.join(root,c.destination);await mkdir(path.dirname(dest),{recursive:true});await symlink(path.resolve(c.destination),dest);for(const p of c.parts)await symlink(path.resolve(archive,p.name),path.join(root,archive,p.name));}
  const c=m.cards[0],dest=path.join(root,c.destination),mp=path.join(root,archive,'manifest.json');await writeFile(mp,JSON.stringify(m));await unlink(dest);
  assert.deepEqual(await restoreCommandLanceFronts({root}),{verified:6,restored:1});assert.equal(hash(await readFile(dest)),c.sha256);
  await unlink(dest);c.parts[0].sha256='0'.repeat(64);await writeFile(mp,JSON.stringify(m));await assert.rejects(restoreCommandLanceFronts({root}),/Parte Lancia non integra/);await assert.rejects(access(dest));
 }finally{await rm(root,{recursive:true,force:true});}
});
