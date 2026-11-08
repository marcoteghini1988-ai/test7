import test from 'node:test';
import assert from 'node:assert/strict';
import {createTacticalDuel,validateTacticalOrder,sealTacticalOrder,
 advanceTacticalDuel,TACTICAL_TIMING} from './simultaneousDuelEngine.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {planTacticalAi} from './tacticalDuelAi.js';
import {visibleTacticalSignature} from './tacticalIntelVisibility.js';
import {VITAL_IDS} from './vitalDefense.js';

const empty={numericIndices:[],specialIndices:[]};
function run(b,a=empty,z=empty){
 const at=b.deadlineMs-TACTICAL_TIMING.prepareMs+1;
 const one=sealTacticalOrder(b,'A',a,at);
 assert.equal(one.ok,true,one.reason);
 const two=sealTacticalOrder(one.battle,'B',z,at+1);
 assert.equal(two.ok,true,two.reason);
 return advanceTacticalDuel(two.battle,at+1);
}
test('La mira scelta espone solo dopo il passaggio reale della soglia, senza carte/danni gratis',()=>{
 const b=createTacticalDuel({shipA:'C01',shipB:'R04',levelA:1,levelB:1});
 b.sides.B.defense.shield.hp=47;
 const target='shieldGenerator';
 assert.equal(visibleTacticalSignature(b.sides.A,b.sides.B,target),null,
  'Nessun suggerimento prima che il vitale sia esposto');
 const a={...empty,exposureTarget:target};
 assert.equal(validateTacticalOrder(b,'A',a).ok,true);
 const out=run(b,a);
 assert.equal(out.sides.B.defense.parts[target].exposed,true,
  'La salva nativa deve aver superato la soglia, poi la mira apre la parte');
 assert.equal(out.history[0].hitsA,0,'La mira non ferisce');
 assert.equal(out.sides.B.defense.parts[target].hp,10,'Il vitale mantiene gli HP');
 assert.ok(visibleTacticalSignature(out.sides.A,out.sides.B,target),
  'La firma diventa visibile SOLO dopo esposizione reale');
 assert.equal(VITAL_IDS.filter(id=>out.sides.B.defense.parts[id].exposed).length,1);
 assert.ok(out.history[0].events.some(x=>x.includes('bersaglio '+target+' esposto')));
 assert.equal(out.sides.A.numeric.hand.length,7);
 assert.equal(out.sides.A.special.hand.length,5);
});
test('Barriera intatta non concede nessuna firma, neppure se il bersaglio viene marcato',()=>{
 const b=createTacticalDuel({shipA:'C01',shipB:'R04',levelA:1,levelB:1});
 b.sides.B.defense.shield={hp:200,max:200};
 const out=run(b,{...empty,exposureTarget:'engine'});
 assert.equal(out.sides.B.defense.parts.engine.exposed,false);
 assert.equal(visibleTacticalSignature(out.sides.A,out.sides.B,'engine'),null);
 assert.equal(out.history[0].hitsA,0);
 assert.equal(out.sides.B.defense.parts.engine.hp,10);
});
test('Ordini validati, nessun bersaglio inesistente o gia distrutto, parita A/B',()=>{
 const b=createTacticalDuel({shipA:'C01',shipB:'R04',levelA:1,levelB:1});
 for(const id of [null,...VITAL_IDS]){
  assert.equal(validateTacticalOrder(b,'A',{...empty,exposureTarget:id}).ok,true);
 }
 assert.equal(validateTacticalOrder(b,'A',{...empty,exposureTarget:'fake'}).reason,'invalid_exposure_target');
 b.sides.B.defense.parts.engine.hp=0;
 assert.equal(validateTacticalOrder(b,'A',{...empty,exposureTarget:'engine'}).reason,'invalid_exposure_target');
 b.sides.B.defense.parts.engine.hp=10;
 b.sides.A.defense.shield.hp=40;b.sides.B.defense.shield.hp=40;
 const out=run(b,{...empty,exposureTarget:'engine'},{
  ...empty,exposureTarget:'weapons'
 });
 assert.equal(out.sides.B.defense.parts.engine.exposed,true);
 assert.equal(out.sides.A.defense.parts.weapons.exposed,true);
 assert.equal(out.history[0].hitsA,0);
 assert.equal(out.history[0].hitsB,0);
});
test('IA senza Carta Scansione sceglie una mira anziche bloccarsi senza conoscere firme',()=>{
 const specials=createSpecialCollection();
 assert.ok(!specials.loadout.includes('tactic-scan'));
 const b=createTacticalDuel({shipA:'C01',shipB:'R04',levelA:3,levelB:3,
  specialDeckA:specials.loadout});
 assert.equal(b.sides.A.seen.length,0);
 for(const id of VITAL_IDS)
  assert.equal(visibleTacticalSignature(b.sides.A,b.sides.B,id),null);
 const plan=planTacticalAi(b,'A');
 assert.ok(VITAL_IDS.includes(plan.exposureTarget));
 assert.equal(plan.numericIndices.length,0,'La IA non indovina firme nascoste');
 assert.equal(validateTacticalOrder(b,'A',plan).ok,true);
 const out=run(b,plan);
 assert.equal(out.sides.B.defense.parts[plan.exposureTarget].exposed,true);
 assert.equal(out.sides.B.defense.parts[plan.exposureTarget].hp,10);
 assert.ok(visibleTacticalSignature(out.sides.A,out.sides.B,plan.exposureTarget));
});
