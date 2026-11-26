import test from 'node:test';
import assert from 'node:assert/strict';
import {NEXT_BALANCED_ALL,NEXT_BALANCED_WEAPON_CARDS,NEXT_BALANCED_LOCKED,NEXT_BALANCED_BY_ID,NEXT_BALANCED_FAMILIES} from './fleetNext/nextBalancedWeapons.js';
import {card,cardCopyLimit,cardRole,weaponNextEvolution} from './fleetNext/rules.js';
import {createFleetNextBattle,resolveFleetNextTurn} from './fleetNext/combat.js';
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
test('22 famiglie con valori espliciti; 20 collegate, 2 bloccate',()=>{
 assert.equal(new Set(NEXT_BALANCED_ALL.map(c=>c.weaponFamilyId)).size,22);
 assert.equal(Object.keys(NEXT_BALANCED_FAMILIES).length,20);
 assert.equal(new Set(NEXT_BALANCED_LOCKED.map(c=>c.weaponFamilyId)).size,2);
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
