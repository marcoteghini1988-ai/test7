import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SUPPORT_CATALOG,LEGACY_SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {supportHpAtLevel} from './fleetNext/supportProgression.js';
import {createFleetSide,createFleetNextBattle,resolveFleetNextTurn,
 fuseIndependentSupportWithShip,timeoutFleetTurn,validateFleetTurn} from './fleetNext/combat.js';
import {SUPPORT_SKILL_LABELS,SUPPORT_SKILL_ASSIGNMENTS,
 skillCount,trapsSuppressed,terrainHalf,terrainImmunity,
 effectiveSupportEnergyCost,supportSpecialBoost,supportNormalBoost,
 supportWeaponCardBoost,settleIndependentSupportDamage,
 advanceIndependentSupportTime,resolveIndependentSupportOwnTurn} from './fleetNext/supportAbilities.js';

const select=(skill,slot=0)=>{
 const def=SUPPORT_CATALOG.find(x=>x.skillId===skill)||
  LEGACY_SUPPORT_CATALOG.find(x=>x.skillId===skill);
 assert.ok(def,skill);
 return {id:def.id,instanceId:'copy-'+skill+'-'+slot,slot,level:1};
};
const battle=(skillA=null,skillB=null)=>createFleetNextBattle({
 shipA:'N00',levelA:20,shipB:'C02',levelB:18,
 deckA:[],deckB:[],mode:'pvp',ruleset:HP_SYNC_RULESET,seed:2026,nowMs:0,
 supportRosterA:skillA?[select(skillA)]:[],
 supportRosterB:skillB?[select(skillB)]:[]
});

test('Tredici modelli ufficiali e quindici abilità tecniche legacy ancora riconosciute',()=>{
 assert.equal(SUPPORT_CATALOG.length,13);
 assert.equal(Object.keys(SUPPORT_SKILL_LABELS).length,15);
 assert.equal(Object.keys(SUPPORT_SKILL_ASSIGNMENTS).length,12);
 assert.equal(new Set(SUPPORT_CATALOG.map(x=>x.skillId)).size,13);
 const first=select('regeneration');
 const side=createFleetSide('N00',1,[],100,{},[
  first,{...first,slot:1,instanceId:'second'}]);
 assert.equal(side.escorts.length,2);
 assert.equal(skillCount(side,'regeneration',0),2);
 assert.equal(side.escorts[0].parentShipId,null);
});

test('Bonus distinti: arma, attacco normale, Attacco Speciale e sconto solo su Attacco Speciale',()=>{
 const weapon=battle('weapon-double').sides.A;
 const normal=battle('normal-boost').sides.A;
 const special=battle('special-boost').sides.A;
 const discount=battle('energy-discount').sides.A;
 assert.equal(supportWeaponCardBoost(weapon,2,0),4);
 assert.equal(supportWeaponCardBoost(normal,2,0),2);
 assert.equal(supportNormalBoost(normal,4,0),5);
 assert.equal(supportSpecialBoost(normal,4,0),4);
 assert.equal(supportSpecialBoost(special,4,0),5);
 assert.equal(supportNormalBoost(special,4,0),4);
 assert.equal(effectiveSupportEnergyCost(discount,{kind:'attack',cost:4},0),3);
 assert.equal(effectiveSupportEnergyCost(discount,{kind:'effect',cost:4},0),4);
 assert.equal(effectiveSupportEnergyCost(discount,{kind:'attack',cost:1},0),1);
});

test('Trappole nemiche piazzabili ma inattive; immunità terreni e dimezzamento distinti',()=>{
 const b=battle('trap-silence');
 b.sides.B.defenses=[{hidden:true,id:'trap',trigger:'terrain'}];
 assert.equal(trapsSuppressed(b,b.sides.B),true);
 assert.equal(b.sides.B.defenses.length,1);
 b.sides.A.escorts[0].destroyed=true;
 assert.equal(trapsSuppressed(b,b.sides.B),false);
 assert.equal(b.sides.B.defenses.length,1);
 const half=battle('terrain-half'),immune=battle('terrain-immunity');
 assert.equal(terrainHalf(half.sides.A,0),true);
 assert.equal(terrainImmunity(half.sides.A,0),false);
 assert.equal(terrainImmunity(immune.sides.A,0),true);
});

test('Rigenerazione a 0,1 HP/s durante il turno nemico e tick idempotenti',()=>{
 const b=battle(null,'regeneration');
 b.sides.B.ships[0].hp=1;
 const tick=advanceIndependentSupportTime(b,10000);
 assert.equal(tick.changed,true);
 assert.equal(tick.battle.sides.B.ships[0].hp,2);
 assert.equal(advanceIndependentSupportTime(tick.battle,10000).changed,false);
 assert.equal(advanceIndependentSupportTime(tick.battle,15000).battle.sides.B.ships[0].hp,2.5);
 assert.equal(b.sides.B.ships[0].hp,1);
});

test('Veleno reattivo avviato dopo ferita, per il prossimo turno del colpevole',()=>{
 const b=battle('reactive-poison','last-shield');
 b.turn='B';b.ply=1;
 const source=b.sides.A.escorts[0];
 source.hp--;
 const notes=settleIndependentSupportDamage(b,'B');
 assert.ok(notes.some(e=>e.kind==='support-poison'));
 assert.equal(source.poisonReadyPly,3);
 b.ply=3;b.turn='B';b.turnStartedAtMs=0;b.supportSecondsProcessed=0;
 const m=b.sides.B.ships[0].hp,e=b.sides.B.escorts[0].hp;
 const tick=advanceIndependentSupportTime(b,10000);
 assert.equal(tick.battle.sides.B.ships[0].hp,m-1);
 assert.equal(tick.battle.sides.B.escorts[0].hp,e-1);
});

test('Scudiera resistente: HP scalati per rarita e cura alla distruzione una sola volta',()=>{
 const b=battle('last-shield'),mother=b.sides.A.ships[0],e=b.sides.A.escorts[0];
 assert.equal(e.maxHp,supportHpAtLevel(50,e.supportLevel));
 mother.hp=1;e.hp=0;e.destroyed=true;
 const notes=settleIndependentSupportDamage(b,'B');
 assert.equal(notes.length,1);
 assert.equal(mother.hp,Math.min(mother.maxHp,26));
 assert.equal(settleIndependentSupportDamage(b,'B').length,0);
});

test('Pioggia di fulmini alla distruzione elimina Attacchi e Personaggio avversari',()=>{
 const b=battle('death-storm');
 b.sides.B.attackSlots=['a1','a2'];b.sides.B.commander={id:'ex-c02-01'};
 const e=b.sides.A.escorts[0];e.hp=0;e.destroyed=true;
 const notes=settleIndependentSupportDamage(b,'B');
 assert.equal(notes[0].clearedAttacks,2);
 assert.equal(notes[0].clearedCharacter,true);
 assert.equal(b.sides.B.commander,null);
 assert.deepEqual(b.sides.B.attackSlots,[]);
});

test('Conversione alla distruzione crea due cariche anche oltre quattro, senza carte finte',()=>{
 const b=battle('death-energy'),side=b.sides.A;
 side.elementalCharges={ionic:7};
 side.energyPile=['energy-ionic'];
 side.escorts[0].hp=0;side.escorts[0].destroyed=true;
 const events=settleIndependentSupportDamage(b,'B');
 assert.equal(events[0].charge,2);
 assert.equal(side.elementalCharges.ionic,9);
 assert.deepEqual(side.energyPile,['energy-ionic'],
  'una passiva che genera cariche non inventa Carte Energia fisiche');
});

test('Condensatore: al terzo proprio turno scarica fulmini, mai uno sparo per turno',()=>{
 const b=battle('capacitor','last-shield'),before=b.sides.B.ships[0].hp;
 assert.equal(resolveIndependentSupportOwnTurn(b,'A').length,0);
 b.ply=2;assert.equal(resolveIndependentSupportOwnTurn(b,'A').length,0);
 b.ply=4;
 assert.ok(resolveIndependentSupportOwnTurn(b,'A').some(e=>e.kind==='support-lightning'));
 assert.equal(b.sides.B.ships[0].hp,before-1);
});

test('Sacrificio volontario: preparazione senza effetto e soglia 80% alla risoluzione',()=>{
 const b=battle('sacrifice'),escort=b.sides.A.escorts[0];
 const order={cards:[],pass:true,sacrificeEscortId:escort.id};
 escort.hp=escort.maxHp*.79;
 const invalid=resolveFleetNextTurn(b,'A',order,0);
 assert.equal(invalid.ok,true,invalid.reason);
 assert.equal(invalid.battle.sides.A.escorts[0].destroyed,false);
 assert.ok(invalid.events.some(e=>e.kind==='support-sacrifice-skipped'));
 escort.hp=escort.maxHp*.8;
 assert.equal(validateFleetTurn(b,'A',order),null);
 assert.equal(b.sides.A.escorts[0].destroyed,false);
 const result=resolveFleetNextTurn(b,'A',order,0);
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.battle.sides.A.escorts[0].destroyed,true);
 assert.ok(result.shot.sacrificeDamage>0);
 assert.equal(result.battle.turn,'B');
 assert.equal(b.sides.A.escorts[0].destroyed,false);
});

test('Sacrificio non consuma una delle tre carte e si risolve con i loro effetti',()=>{
 const b=battle('sacrifice'),escort=b.sides.A.escorts[0],hp=b.sides.B.ships[0].hp;
 b.sides.A.hand=['energy-ionic','sys-weapons-plus-c'];
 const order={cards:[0,1],pass:true,sacrificeEscortId:escort.id};
 assert.equal(validateFleetTurn(b,'A',order),null);
 assert.equal(b.sides.B.ships[0].hp,hp);
 const result=resolveFleetNextTurn(b,'A',order,1000);
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.battle.sides.A.elementalCharges.ionic,1);
 assert.ok(result.battle.sides.A.systemCardEffects.some(e=>e.id==='sys-weapons-plus-c'));
 assert.ok(result.battle.sides.B.ships[0].hp<hp);
 assert.equal(result.battle.sides.A.escorts[0].destroyed,true);
 assert.equal(result.battle.turn,'B');
});

test('Sacrificio preparato: al timeout si attiva senza una quarta carta',()=>{
 const b=battle('sacrifice'),escort=b.sides.A.escorts[0];
 const result=timeoutFleetTurn(b,b.deadlineMs,{cards:[],pass:true,sacrificeEscortId:escort.id});
 assert.equal(result.ok,true,result.reason);
 assert.ok(result.events.some(e=>e.kind==='support-sacrifice'));
 assert.equal(result.battle.turn,'B');
});

test('Una scudiera senza Sacrificio non può essere scelta',()=>{
 const b=battle('regeneration'),escort=b.sides.A.escorts[0];
 assert.match(validateFleetTurn(b,'A',{cards:[],pass:true,sacrificeEscortId:escort.id}),
  /non possiede Sacrificio/);
});

test('Supporto pescata: mano riempita fino a 8 senza usare altre carte del mazzo',()=>{
 const b=battle('extra-draw');
 b.sides.A.hand=[];b.sides.A.deck=Array(12).fill('energy-ionic');
 const done=resolveFleetNextTurn(b,'A',{cards:[],pass:true},0);
 assert.equal(done.ok,true,done.reason);
 assert.equal(done.battle.sides.A.hand.length,8);
 assert.equal(done.battle.sides.A.deck.length,4);
});

test('Plancia ufficiale aggiorna gli HP al secondo e rende il Sacrificio cliccabile',()=>{
 const ui=readFileSync(new URL('./OfficialFleetBattle3D.jsx',import.meta.url),'utf8');
 assert.match(ui,/advanceIndependentSupportTime\(current,timestamp\)/);
 assert.match(ui,/sacrificeEscortId:preparedSacrifice/);
 assert.match(ui,/PREPARA SACRIFICIO/);
 assert.doesNotMatch(ui,/sacrificeIndependentFleetSupport\(battle,'A'/);
 assert.match(ui,/actualEnergyCost=effectiveSupportEnergyCost/);
});


test('La fusione con una carta-navicella conserva entrambe le passive senza sommare HP',()=>{
 const b=createFleetNextBattle({
  shipA:'C01',levelA:1,shipB:'N00',levelB:20,deckA:[],deckB:[],
  mode:'pvp',ruleset:HP_SYNC_RULESET,seed:98,nowMs:0,
  supportRosterA:[{id:'support-l04-01',instanceId:'arka-energy',slot:0,level:5}], // Arca Astrale MAX
  supportRosterB:[]
 });
 const side=b.sides.A, original=side.escorts[0];
 original.hp=Math.max(1,original.maxHp-3);
 const before={hp:original.hp,maxHp:original.maxHp};
 const result=fuseIndependentSupportWithShip(side,'L04',0,0);
 assert.equal(result.ok,true,result.reason);
 assert.equal(side.escorts.length,1);
 assert.deepEqual(result.fused.supportSkillIds,['death-energy','capacitor']);
 assert.equal(result.fused.hp,before.hp);
 assert.equal(result.fused.maxHp,before.maxHp);
 assert.equal(skillCount(side,'death-energy',0),1);
 assert.equal(skillCount(side,'capacitor',0),1);
 assert.equal(result.fused.supportObservedHp,result.fused.hp);
 result.fused.hp=0;result.fused.destroyed=true;
 const notes=settleIndependentSupportDamage(b,'B');
 assert.ok(notes.some(event=>event.skillId==='death-energy'));
 assert.equal(side.elementalCharges[side.ships[0].element],2);
});
