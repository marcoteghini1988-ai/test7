// Bilanciamento 19 novembre 2026: attacchi elementali e obiettivi di durata.
import test from 'node:test';
import assert from 'node:assert/strict';
import {FLEET_PACING_WINDOWS,matchPacingTarget} from './fleetNext/battlePacing.js';
import {createFleetNextBattle,resolveFleetNextTurn} from './fleetNext/combat.js';
import {ELEMENTAL_ABILITIES,elementalSpecialStrength} from './fleetNext/elementalAbilities.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';

const create=(shipA,shipB='L04')=>createFleetNextBattle({
 shipA,shipB,raritaA:'Leggendaria',raritaB:'Leggendaria',
 supportRosterA:[],supportRosterB:[],mode:'pvp',ruleset:HP_SYNC_RULESET,
 deckA:[],deckB:[],seed:20261119,nowMs:0
});
const fire=(b,special=false)=>{
 const side=b.sides.A,mother=side.ships[0],ability=ELEMENTAL_ABILITIES[mother.id];
 side.hand=[];side.deck=[];
 if(special)side.elementalCharges={[mother.element]:ability.cost};
 return resolveFleetNextTurn(b,'A',{
  cards:[],pass:false,targetKind:'part',targetId:'weapons',partId:'weapons',
  ...(special?{activateElemental:true,elementalElement:mother.element}:{})
 },1000);
};

test('PvP, campagna e boss: pari livello 5-6 minuti senza timer forzato',()=>{
 assert.deepEqual(FLEET_PACING_WINDOWS.pvp,{minSeconds:300,targetSeconds:330,maxSeconds:360});
 assert.deepEqual(FLEET_PACING_WINDOWS.boss,{minSeconds:300,targetSeconds:345,maxSeconds:360});
 const pvp=matchPacingTarget('pvp',null,30);
 assert.deepEqual(pvp.referenceTurns,{min:10,target:11,max:12});
 assert.deepEqual(matchPacingTarget('campaign','boss-01',30).referenceTurns,
  {min:10,target:12,max:12});
 assert.equal(pvp.enforcedTimeLimit,false);
 assert.deepEqual(pvp.typicalTurns,{min:17,target:19,max:20});
 assert.equal(create('C01').pacingTarget.category,'pvp');
 assert.equal(createFleetNextBattle({shipA:'C01',shipB:'L04',bossId:'boss-01',
  mode:'campaign',ruleset:HP_SYNC_RULESET,deckA:[],deckB:[],
  supportRosterA:[],supportRosterB:[]}).pacingTarget.category,'boss');
});

test('Tutti i sei Attacchi Speciali superano il colpo base ma consumano Energia senza secondo sparo',()=>{
 const attacks=Object.values(ELEMENTAL_ABILITIES).filter(a=>a.kind==='attack');
 assert.equal(attacks.length,6);
 for(const ability of attacks){
  const normal=fire(create(ability.shipId));
  const boosted=fire(create(ability.shipId),true);
  assert.equal(normal.ok,true,ability.shipId+': '+normal.reason);
  assert.equal(boosted.ok,true,ability.shipId+': '+boosted.reason);
  const fx=boosted.events.find(e=>e.kind==='elemental-special');
  assert.equal(fx?.cost,ability.cost,ability.shipId);
  assert.ok(boosted.shot.power>normal.shot.power,
   ability.shipId+': speciale deve aggiungere potenza misurabile');
  assert.equal(boosted.events.filter(e=>e.kind==='impact').length,1);
  assert.ok(boosted.shot.damage>=normal.shot.damage,
   ability.shipId+': danno effettivo non inferiore se gli altri fattori sono identici');
  assert.equal(Object.values(boosted.battle.sides.A.elementalCharges||{})
   .reduce((x,y)=>x+y,0),0);
 }
});

test('I sei Effetti Speciali restano alternativi all attacco, ma cura e disturbi sono proporzionati',()=>{
 const effect=Object.values(ELEMENTAL_ABILITIES).filter(a=>a.kind==='effect');
 assert.equal(effect.length,6);
 const prism=create('C02');prism.sides.A.elementalCharges={refrigerant:1};
 prism.sides.A.hand=[];
 const guard=resolveFleetNextTurn(prism,'A',{
  cards:[],pass:true,activateElemental:true,elementalElement:'refrigerant'
 },1000);
 assert.equal(guard.ok,true,guard.reason);
 assert.ok(guard.battle.sides.A.buffs.some(b=>b.kind==='guard'&&b.power>=20));
 assert.equal(guard.shot.damage||0,0);
 const ark=create('L04');ark.sides.A.elementalCharges={refrigerant:4};
 ark.sides.A.hand=[];ark.sides.A.ships[0].hp-=300;
 const before=ark.sides.A.ships[0].hp;
 const healed=resolveFleetNextTurn(ark,'A',{
  cards:[],pass:true,activateElemental:true,elementalElement:'refrigerant'
 },1000);
 assert.equal(healed.ok,true,healed.reason);
 assert.ok(healed.battle.sides.A.ships[0].hp>=before+100);
 assert.equal(healed.shot.damage||0,0);
});

test('Il bonus speciale e in proporzione alla madre e il modello tecnico legacy resta invariato',()=>{
 const ship=create('C01').sides.A.ships[0],ability=ELEMENTAL_ABILITIES.C01;
 const scaled=elementalSpecialStrength(ability,'plasma','refrigerant',ship);
 const legacy=elementalSpecialStrength(ability,'plasma','refrigerant');
 assert.ok(scaled.power>legacy.power);
 assert.equal(legacy.power,1);
 assert.equal(scaled.relation,legacy.relation);
});
