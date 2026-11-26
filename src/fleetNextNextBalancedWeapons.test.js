import test from 'node:test';
import assert from 'node:assert/strict';
import {NEXT_BALANCED_ALL,NEXT_BALANCED_WEAPON_CARDS,NEXT_BALANCED_LOCKED,NEXT_BALANCED_BY_ID,NEXT_BALANCED_FAMILIES} from './fleetNext/nextBalancedWeapons.js';
import {card,cardCopyLimit,cardRole,weaponNextEvolution} from './fleetNext/rules.js';
import {createFleetNextBattle,resolveFleetNextTurn,availableFleetTargets} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {arsenalBonus} from './fleetNext/newCardEffects.js';
import {canSelectNewGeneric,NEXT_WEAPON_COLLECTION_CARDS,buyNextCommonCard} from './fleetNext/nextDeckLoadout.js';
import {validateEffectSpec} from './fleetNext/simpleEffects.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {advanceTimedComponents} from './fleetNext/componentTimerPacing.js';
const lookup=(slug,rarita)=>NEXT_BALANCED_ALL.find(c=>c.effectSpec.weaponProfile.slug===slug&&(!rarita||c.rarita===rarita));
const id=(slug,rarita)=>lookup(slug,rarita).id;
const supports=SUPPORT_CATALOG.slice(0,2).map((s,i)=>({supportId:s.id,instanceId:'next-'+i,slot:i,rarita:'Leggendaria'}));
function game(guards=false){
 const b=createFleetNextBattle({shipA:'N00',shipB:'C01',raritaA:'Leggendaria',raritaB:'Leggendaria',
  supportRosterA:[],supportRosterB:guards?supports:[],mode:'pvp',ruleset:HP_SYNC_RULESET,
  deckA:[],deckB:[],seed:22119,nowMs:0});
 for(const s of Object.values(b.sides)){s.hand=[];s.deck=Array(25).fill('gen-216');s.discard=[];s.ships[0].hp=5000;s.ships[0].maxHp=5000;}
 b.sides.A.energyPile=Array(6).fill('energy-mineral').concat(Array(5).fill('energy-aerial'));
 b.sides.A.elementalCharges={mineral:6,aerial:5};return b;
}
function play(b,who,ids=[],opts={}){
 b.sides[who].hand=[...ids];
 const r=resolveFleetNextTurn(b,who,{pass:true,cards:ids.map((_,i)=>i),...opts},b.turnStartedAtMs+1000);
 assert.equal(r.ok,true,r.reason);return r;
}
const shot=(r,slug)=>r.events.find(e=>e.kind==='next-weapon-shot'&&e.cardId?.includes(slug));
test('22 famiglie con valori espliciti, tutte collegate',()=>{
 assert.equal(new Set(NEXT_BALANCED_ALL.map(c=>c.weaponFamilyId)).size,22);
 assert.equal(Object.keys(NEXT_BALANCED_FAMILIES).length,22);
 assert.equal(NEXT_BALANCED_LOCKED.length,0);
 for(const c of NEXT_BALANCED_WEAPON_CARDS){
  assert.equal(card(c.id),c);assert.ok(cardCopyLimit(c.id)>0);assert.equal(cardRole(c.id),'support');
  assert.equal(validateEffectSpec(c.effectSpec),null);assert.equal(canSelectNewGeneric(c.id),true);
  assert.ok(NEXT_WEAPON_COLLECTION_CARDS.includes(c));
  assert.equal(buyNextCommonCard({owned:{},credits:20000},c.id).ok,true);
  const next=weaponNextEvolution(c.id);if(next)assert.equal(next.weaponFamilyId,c.weaponFamilyId);
 }
 for(const c of NEXT_BALANCED_LOCKED){assert.equal(canSelectNewGeneric(c.id),false);assert.equal(buyNextCommonCard({owned:{},credits:20000},c.id).ok,false);}
});
test('nominali 26/11 non riscalati una seconda volta',()=>{
 const c=lookup('concentrazione-solare','Leggendaria'),m={...c.effectSpec,id:c.id,slot:0};
 const side={ruleset:HP_SYNC_RULESET,newGeneratorCombat:true,weaponBalanceFactor:1.85,ships:[{maxHp:1000,defensePercent:10}],machines:[m],escorts:[],systemCardEffects:[],componentTimers:{weapons:{expired:false}}};
 assert.equal(arsenalBonus(side,m,0,95),95);
});
test('concentrazione solare: valore massimo con una sola carta',()=>{
 const r=play(game(),'A',[id('concentrazione-solare','Epica')]);
 assert.equal(shot(r,'concentrazione-solare').impacts[0].nominalDamage,130);
});
test('Terra: terremoto e due assestamenti, consumo fisico 2/1/1',()=>{
 const a=id('sismico-tettonico');let r=play(game(true),'A',[a]);
 assert.equal(r.battle.sides.A.elementalCharges.mineral,4);
 assert.equal(shot(r,'sismico-tettonico').impacts.length,3);
 r=play(r.battle,'B');r=play(r.battle,'A');assert.equal(r.battle.sides.A.elementalCharges.mineral,3);
 assert.equal(shot(r,'sismico-tettonico').impacts[0].nominalDamage,15);
 r=play(r.battle,'B');r=play(r.battle,'A');assert.equal(r.battle.sides.A.elementalCharges.mineral,2);
});
test('convertitore senza A rifiutato; combo nello stesso turno',()=>{
 const b=game(),c=id('convertitore-cinetico'),a=id('boato-cosmico');b.sides.A.hand=[c];
 const invalid=resolveFleetNextTurn(b,'A',{pass:true,cards:[0]},1000);assert.equal(invalid.ok,false);
 const r=play(game(),'A',[c,a]);assert.equal(r.battle.sides.A.nextBoato.used,true);
 assert.equal(r.battle.sides.A.nextBoato.value,14);
 assert.equal(shot(r,'convertitore-cinetico').impacts[0].nominalDamage,14);
});
test('ombra e scarti non consumati; Tenebre solo al terzo turno',()=>{
 const a=id('oscurita-gravitazionale','Epica'),c=id('tenebre-infinite');let r=play(game(),'A',[a]);
 r=play(r.battle,'B');r=play(r.battle,'A');r=play(r.battle,'B');
 r.battle.sides.A.discard=['gen-216','gen-216'];r.battle.sides.B.discard=['gen-216'];
 r=play(r.battle,'A',[c]);const e=r.events.find(x=>x.kind==='next-weapon-shadow');
 assert.equal(e.coveragePercent,100);assert.equal(e.discardCards,3);assert.equal(e.partnerCardId,c);
 assert.equal(shot(r,'oscurita-gravitazionale').impacts[0].nominalDamage,(e.fieldCards+e.discardCards)*3);
 assert.ok(r.battle.sides.B.discard.includes('gen-216'));
});
test('timer Centralina: extra persistente, nessun extra su altri componenti',()=>{
 const side={componentElapsedSeconds:0,ships:[{hp:1000,maxHp:1000}],
  componentTimers:Object.fromEntries(['weapons','command','bridge'].map(k=>[k,{initialSeconds:200,remainingSeconds:200,expired:false}])),
  nextCommandExtraSeconds:15};
 advanceTimedComponents(side,20,{drainFraction:0});
 assert.equal(side.componentTimers.command.remainingSeconds,165);assert.equal(side.componentTimers.weapons.remainingSeconds,180);
});
test('Singolarità assorbe il colpo dell’altra arma senza HP immediati',()=>{
 const b=game(),a=id('implosore-singolarita','Epica'),z=id('concentrazione-solare','Epica');
 let r=play(b,'A',[a,z]);assert.ok(r.events.some(e=>e.kind==='next-weapon-absorb'&&e.absorbedCardId===z));
 assert.equal(r.battle.sides.B.ships[0].hp,5000);
 r=play(r.battle,'B');r=play(r.battle,'A');
 assert.ok(shot(r,'implosore-singolarita')?.actualDamage>0);
});

test('Eclissi Quantistica: scelte bloccate, non pubblicate; riappare al turno scelto',()=>{
 const a=id('eclissi-quantistica','Rara');let r=play(game(),'A',[a],{nextEclipseTurn:2});
 assert.equal(r.battle.sides.A.machines.length,0);
 const hidden=r.events.find(e=>e.kind==='next-weapon-eclipse-hidden');assert.ok(hidden);
 assert.equal(hidden.chosenDelay,undefined);assert.equal(hidden.releasePly,undefined);
 r=play(r.battle,'B',[],{nextEclipseGuess:1});
 assert.equal(r.battle.sides.A.nextEclipsePending.guess,1);
 const locked=r.events.find(e=>e.kind==='next-weapon-eclipse-guess-locked');assert.ok(locked);
 assert.equal(locked.guess,undefined);
 r=play(r.battle,'A');assert.equal(r.events.some(e=>e.kind==='next-weapon-eclipse-reveal'),false);
 r=play(r.battle,'B',[],{nextEclipseGuess:2});assert.equal(r.battle.sides.A.nextEclipsePending.guess,1);
 r=play(r.battle,'A');
 const reveal=r.events.find(e=>e.kind==='next-weapon-eclipse-reveal');
 assert.equal(reveal.chosenDelay,2);assert.equal(reveal.guess,1);assert.equal(reveal.correct,false);assert.ok(reveal.actualDamage>0);
 assert.equal(r.battle.sides.A.nextEclipsePending,null);
});
test('Eclissi Quantistica: previsione corretta conserva danno base',()=>{
 let r=play(game(),'A',[id('eclissi-quantistica','Rara')],{nextEclipseTurn:1});
 r=play(r.battle,'B',[],{nextEclipseGuess:1});r=play(r.battle,'A');
 const e=r.events.find(x=>x.kind==='next-weapon-eclipse-reveal');assert.equal(e.correct,true);assert.equal(e.nominalDamage,38);
});

test('Replicatore: ultima arma fisica, 70%, cambio dinamico e niente carte extra',()=>{
 const a=id('replicatore-olografico','Epica'),first='weapon-base-ionic-01',second='weapon-base-ionic-02';
 let r=play(game(),'A',[first]);r=play(r.battle,'B',[a]);
 let copy=r.events.find(e=>e.kind==='next-weapon-holo-copy');
 assert.equal(copy.copiedCardId,first);assert.equal(copy.multiplier,.7);
 const original=r.events.find(e=>e.kind==='weapon-base-shot'&&e.cardId===first);
 assert.equal(original.appliedPower,Math.round(card(first).effectSpec.baseDamage*.7));
 assert.equal(r.battle.sides.B.machines.length,1);
 assert.equal(r.battle.sides.B.machines[0].sourceCardId,a);
 assert.equal(r.battle.sides.B.discard.includes(first),false);
 r=play(r.battle,'A',[second]);r=play(r.battle,'B');
 copy=r.events.find(e=>e.kind==='next-weapon-holo-copy');assert.equal(copy.copiedCardId,second);
 r=play(r.battle,'A');r=play(r.battle,'B');
 assert.equal(r.events.find(e=>e.kind==='next-weapon-holo-copy').copiedCardId,second);
 r=play(r.battle,'A');r=play(r.battle,'B');r=play(r.battle,'A');
 assert.equal(r.battle.sides.B.machines.length,0);
 assert.equal(r.battle.sides.B.discard.filter(x=>x===a).length,1);
});
test('Proiettore: tre posizioni, un solo ologramma, 70% HP, rigenerazione per tre turni',()=>{
 const b=game(true),p=id('proiettore-olografico','Epica'),a='weapon-base-ionic-01';
 let r=play(b,'A');r=play(r.battle,'B',[p]);
 for(let turn=1;turn<=3;turn++){
  const side=r.battle.sides.B,projection=side.nextHologram;
  assert.ok(projection);assert.equal(side.escorts.length,2);
  const targets=availableFleetTargets(side,r.battle.ply).filter(t=>t.kind==='escort');
  assert.equal(targets.length,3);assert.ok(targets.every(t=>t.id.startsWith('holo-position:')&&!t.unit.nextHoloDecoy));
  const decoy=projection.decoy,real=side.escorts.find(u=>u.id===decoy.nextHoloSourceId);
  assert.equal(decoy.hp,real.hp);
  const before=side.escorts.map(e=>e.hp),mother=side.ships[0].hp;
  r=play(r.battle,'A',[a],{targetKind:'escort',targetId:decoy.id});
  const hit=r.events.find(e=>e.kind==='next-weapon-holo-counter');assert.ok(hit);
  assert.equal(hit.nominalDamage,Math.round(decoy.hp*.7));
  assert.equal(r.battle.sides.B.ships[0].hp,mother);
  assert.deepEqual(r.battle.sides.B.escorts.map(e=>e.hp),before);
  if(turn<3)r=play(r.battle,'B');
 }
 assert.equal(availableFleetTargets(r.battle.sides.B,r.battle.ply).filter(t=>t.kind==='escort').length,2);
});
test('Ologrammi insieme, anche rarità diverse: 100% e bersaglio reale conserva danni',()=>{
 const a=id('replicatore-olografico','Epica'),p=id('proiettore-olografico','Leggendaria'),base='weapon-base-ionic-01';
 let r=play(game(true),'A',[base]);r=play(r.battle,'B',[a,p]);
 assert.equal(r.events.find(e=>e.kind==='next-weapon-holo-copy').multiplier,1);
 const projection=r.battle.sides.B.nextHologram,real=projection.positions.find(p=>p.realId);
 const hp=r.battle.sides.B.escorts.find(e=>e.id===real.realId).hp;
 r=play(r.battle,'A',[base],{targetKind:'escort',targetId:real.key});
 assert.equal(r.events.some(e=>e.kind==='next-weapon-holo-counter'),false);
 assert.ok(r.battle.sides.B.escorts.find(e=>e.id===real.realId).hp<hp);
 r=play(r.battle,'B');
 const decoy=r.battle.sides.B.nextHologram.decoy;
 r=play(r.battle,'A',[base],{targetKind:'escort',targetId:decoy.id});
 assert.equal(r.events.find(e=>e.kind==='next-weapon-holo-counter').nominalDamage,decoy.hp);
});
test('Replica consuma le energie del replicante, non dell’avversario, e non ricopia se stessa',()=>{
 const a=id('replicatore-olografico','Epica'),quake=id('sismico-tettonico','Rara');
 let b=game();b.sides.B.elementalCharges={mineral:2};b.sides.B.energyPile=['energy-mineral','energy-mineral'];
 let r=play(b,'A',[quake]);r=play(r.battle,'B',[a]);
 assert.equal(r.battle.sides.A.elementalCharges.mineral,4);
 assert.equal(r.battle.sides.B.elementalCharges.mineral||0,0);
 assert.ok(r.events.some(e=>e.kind==='next-weapon-energy'&&e.cardId===quake));
 r=play(r.battle,'A',[a]);assert.equal(r.events.some(e=>e.kind==='next-weapon-holo-copy'),false);
});
