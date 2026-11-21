import test from 'node:test';
import assert from 'node:assert/strict';
import {card,cardRole} from './fleetNext/rules.js';
import {PROVISIONAL_ADVANCED_WEAPONS} from './fleetNext/provisionalWeaponProfiles.js';
import {NEXT_NEW_WEAPON_CARDS,canSelectNewGeneric,buyNextCommonCard,buildNextBaseDeck}
 from './fleetNext/nextDeckLoadout.js';
import {createFleetInventory} from './fleetNext/collection.js';
import {createFleetNextBattle,resolveFleetNextTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
const lookup=name=>PROVISIONAL_ADVANCED_WEAPONS.find(x=>x.name===name)?.id;
const supports=SUPPORT_CATALOG.slice(0,2).map((s,i)=>({
 supportId:s.id,instanceId:'provisional-'+i,slot:i,rarita:'Leggendaria'
}));
function game(guards=true){
 const b=createFleetNextBattle({shipA:'N00',shipB:'C01',raritaA:'Leggendaria',
  raritaB:'Leggendaria',supportRosterA:[],supportRosterB:guards?supports:[],
  mode:'pvp',ruleset:HP_SYNC_RULESET,deckA:[],deckB:[],seed:4419,nowMs:0});
 for(const s of Object.values(b.sides)){s.hand=[];s.deck=Array(25).fill('gen-216');s.discard=[];}
 b.sides.B.ships[0].hp=5000;b.sides.B.ships[0].maxHp=5000;
 b.sides.A.ships[0].hp=5000;b.sides.A.ships[0].maxHp=5000;
 b.sides.A.energyPile=['energy-ionic','energy-plasma','energy-plasma','energy-metallic','energy-ionic'];
 b.sides.A.elementalCharges={ionic:2,plasma:2,metallic:1};
 return b;
}
function play(b,who,ids=[],order={}){
 b.sides[who].hand=[...ids];
 const r=resolveFleetNextTurn(b,who,{pass:true,cards:ids.map((_,i)=>i),...order},
  b.turnStartedAtMs+1000);
 assert.equal(r.ok,true,r.reason);
 return r;
}
const shots=(r,id)=>r.events.filter(x=>x.kind==='weapon-provisional-shot'&&x.cardId===id);
test('69 nuove armi ufficiali: 21 con bilanciamento temporaneo, acquistabili e equipaggiabili',()=>{
 assert.equal(PROVISIONAL_ADVANCED_WEAPONS.length,21);
 assert.equal(NEXT_NEW_WEAPON_CARDS.length,69);
 const inv=createFleetInventory();
 const ids=new Set();
 for(const d of PROVISIONAL_ADVANCED_WEAPONS){
  assert.equal(ids.has(d.id),false,d.id);ids.add(d.id);
  const c=card(d.id);
  assert.ok(c,d.id);assert.equal(c.playable,true,d.id);
  assert.equal(c.provisionalBalance,true,d.id);assert.equal(cardRole(d.id),'support');
  assert.equal(c.effectSpec.damageMode,'designed-shot');
  assert.equal(c.effectSpec.durationTurns,d.profile.durationTurns);
  assert.ok(canSelectNewGeneric(d.id),d.id);
  assert.equal(inv.owned[d.id]||0,0);
  const bought=buyNextCommonCard({...inv,credits:20000},d.id);
  assert.equal(bought.ok,true,d.id);assert.equal(bought.inventory.owned[d.id],1);
  const built=buildNextBaseDeck(bought.inventory,'N00',20,[d.id]);
  assert.deepEqual(built.baseDeck,[d.id]);
 }
});
test('Tutte le 21 Armi con parametri provvisori eseguono un effetto nella battaglia HP',()=>{
 for(const d of PROVISIONAL_ADVANCED_WEAPONS){
  const b=game(true),who='A',s=b.sides.A,e=b.sides.B;
  if(d.profile.pattern==='thermal-coupler'){
   s.machines=[{id:'machine:binary-test',slot:0,sourceCardId:lookup('Sistema Binario a Sovraccarico'),
    hp:1,maxHp:1,destroyed:false,deployedPly:-2,untilPly:8,
    damageMode:'designed-shot',weaponElementId:'plasma',
    weaponProfile:{pattern:'binary-overload',provisional:true,durationTurns:5,
     damageStages:[8,0,16,0,20],motherCostPercent:6,allyCostPercent:4}}];
  }
  if(d.profile.pattern==='high-tide')s.provisionalWeaponStatus={lowTide:{ply:-2,power:24}};
  if(d.profile.pattern==='alloy-collision')
   s.provisionalWeaponStatus={grapple:{ply:-2,ids:e.escorts.slice(0,2).map(x=>x.id)}};
  const r=play(b,who,[d.id]);
  const ev=shots(r,d.id);
  assert.equal(ev.length,1,d.name);
  assert.ok(ev[0].pattern===d.profile.pattern,d.name);
  assert.ok(r.battle.sides.A.machines.some(m=>m.sourceCardId===d.id),d.name);
  if(!['storm-capacitor','wind-cycloreactor'].includes(d.profile.pattern))
   assert.ok(ev[0].hitCount>0||ev[0].actualDamage===0,d.name);
 }
});
test('Bassa e Alta Marea: effetto concatenato nel turno proprio successivo',()=>{
 let b=game(true);
 b.sides.A.discard=['sys-black-hole'];
 const low=lookup('Bassa Marea'),high=lookup('Alta Marea');
 b=play(b,'A',[low]).battle;
 assert.ok(b.sides.A.provisionalWeaponStatus.lowTide);
 b=play(b,'B').battle;
 const r=play(b,'A',[high]);
 assert.ok(shots(r,high)[0].actualDamage>0);
 assert.equal(r.battle.sides.A.provisionalWeaponStatus.lowTide,null);
});
test('Ganasce e Collassatore: due bersagli agganciati, collisione successiva',()=>{
 let b=game(true);
 const g=lookup('Ganasce Magnetiche'),c=lookup('Collassatore di Lega');
 b=play(b,'A',[g]).battle;
 assert.equal(b.sides.A.provisionalWeaponStatus.grapple.ids.length,2);
 b=play(b,'B').battle;
 const result=play(b,'A',[c]);
 assert.equal(shots(result,c)[0].hitCount,2);
});
test('Sonda e Martello: colpo di combinazione sulla stessa nave',()=>{
 const b=game(true),probe=lookup('Sonda Ionica'),hammer=lookup('Martello del Tuono');
 const r=play(b,'A',[probe,hammer]);
 assert.equal(shots(r,probe)[0].hitCount,1);
 assert.equal(shots(r,hammer)[0].hitCount,2);
 assert.equal(r.battle.sides.A.provisionalWeaponStatus.ionProbe,null);
});
test('Mortaio: assorbe solo Fuoco prima della Speciale e lascia invariato altro elemento',()=>{
 const b=game(false),id=lookup('Mortaio Magmatico');
 const r=play(b,'A',[id]),events=shots(r,id);
 assert.equal(events.length,1);
 assert.equal(events[0].hitCount,3);
 assert.ok(r.battle.sides.A.energyPile.every(x=>x!=='energy-plasma'));
 assert.equal(r.battle.sides.A.elementalCharges.plasma,undefined);
 assert.ok(r.battle.sides.A.energyPile.includes('energy-metallic'));
});
test('Inceneritore: applica bruciatura e mantiene i danni per il numero di turni deciso',()=>{
 let b=game(false),id=lookup('Inceneritore a Plasma Rotante');
 const r=play(b,'A',[id]);
 assert.ok(shots(r,id)[0].hitCount>=1);
 assert.ok(r.battle.sides.B.provisionalBurns.length===1);
 const hp=r.battle.sides.B.ships[0].hp;
 b=play(r.battle,'B').battle;
 assert.ok(b.sides.B.ships[0].hp<hp);
});
test('Cicloreattore: la mano si sblocca dopo i secondi mentre il turno prosegue',()=>{
 const b=game(true),id=lookup('Cicloreattore Grandinifero');
 const r=play(b,'A',[id]);
 assert.ok(r.battle.sides.B.provisionalHandFrozenUntilMs>r.battle.turnStartedAtMs);
 const next=r.battle;
 next.sides.B.hand=['weapon-base-ionic-01'];
 const denied=resolveFleetNextTurn(next,'B',{pass:true,cards:[0]},next.turnStartedAtMs+500);
 assert.equal(denied.ok,false);assert.match(denied.reason,/Mano congelata/);
 const unblocked=resolveFleetNextTurn(next,'B',{pass:true,cards:[0]},next.turnStartedAtMs+2500);
 assert.equal(unblocked.ok,true,unblocked.reason);
});
