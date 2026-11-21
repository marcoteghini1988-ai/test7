// Audit diagnostico del bilanciamento tra flotte di PARI rarita'.
// Usa il vero motore, armi e carte esistenti; NON crea carte Difesa/Trappola nuove.
// I secondi sono stimati: scelta giocatore + animazioni, e vanno confermati su UI.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetNextBattle,autoFleetTurn,resolveFleetNextTurn,
 validateFleetTurn,protectingFleetUnits,effectUnavailableReason} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {SHIP_RARITIES,combatLevelForRarity} from './fleetNext/shipRarity.js';
import {activeFleetElements} from './fleetNext/elementalAffinities.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {ALL_WEAPON_CARDS} from './fleetNext/weaponRarityEvolutions.js';
import {NEXT_COMMON_CARDS} from './fleetNext/newCardRegistry.js';
import {ELEMENTAL_TERRAIN_CARDS} from './fleetNext/elementalTerrainCards.js';
import {GENERAL_CARDS,card,cardCopyLimit,eligibleExclusives} from './fleetNext/rules.js';
import {energyIdForRarity} from './fleetNext/energyCards.js';
import {nextGenericCapacity} from './fleetNext/nextDeckLoadout.js';
import {applyElementalDamage} from './fleetNext/elementalDamage.js';
import {limitedMotherDamage} from './fleetNext/motherBalance.js';
import {generatorCardCount,generatorAttackPreview,commitGeneratorFiring} from './fleetNext/motherGeneratorBalance.js';

const PRESETS=Object.freeze({
 Comune:[['N00','C01'],['C01','C02'],['C02','C03']],
 Rara:[['R01','R02'],['C01','R04'],['C03','R01']],
 Epica:[['E01','E02'],['R04','R02'],['C02','E01']],
 Leggendaria:[['L03','L04'],['C01','E02'],['R04','L01']]
});
const ARCHETYPES=Object.freeze([
 Object.freeze({name:'offensivo',weapon:16,energy:4,system:3,terrain:1}),
 Object.freeze({name:'equilibrato',weapon:11,energy:6,system:8,terrain:2}),
 Object.freeze({name:'controllo',weapon:8,energy:5,system:13,terrain:3})
]);
const SIMPLE=new Set(['base-shot','polarity-shot','double-shot',
 'repeat-shot','sweep-shot','energy-burst-shot']);
const rIdx=r=>SHIP_RARITIES.indexOf(r);
function startingSupportCount(rarity){
 return ({Comune:0,Rara:1,Epica:2,Leggendaria:2})[rarity];
}
function roster(rarity,seed){
 const n=startingSupportCount(rarity),eligible=SUPPORT_CATALOG.filter(c=>
  rIdx(c.rarita)<=rIdx(rarity));
 return Array.from({length:n},(_,slot)=>{
  const c=eligible[(seed+slot*4)%eligible.length];
  return {id:c.id,instanceId:'balance:'+seed+':'+slot,slot,rarita:rarity};
 });
}
function generator(ship,rarity,arch,seed){
 const level=combatLevelForRarity(ship,rarity);
 const capacity=nextGenericCapacity(ship,level);
 const own=activeFleetElements(ship,level);
 const all=ALL_WEAPON_CARDS.filter(c=>c.rarita===rarity);
 const weapons=[...all].sort((a,b)=>{
  const score=c=>Number(own.includes(c.elementId))*4+
   Number(SIMPLE.has(c.effectSpec.damageMode))*3+
   Number(c.effectSpec.weaponProfile?.pattern==='single')*2;
  return score(b)-score(a)||a.id.localeCompare(b.id);
 });
 const rotate=(array,n)=>array.length?
  [...array.slice(n%array.length),...array.slice(0,n%array.length)]:[];
 const wanted=[];
 const push=(ids,amount)=>{
  let count=0;
  for(const id of ids){
   if(wanted.length>=capacity||count>=amount)break;
   if(!card(id)||wanted.filter(x=>x===id).length>=cardCopyLimit(id))continue;
   wanted.push(id);count++;
  }
 };
 push(rotate(weapons,seed%13).map(c=>c.id),arch.weapon);
 const energies=own.flatMap(element=>Array(4).fill(energyIdForRarity(element,rarity)));
 push(energies,arch.energy);
 const systems=NEXT_COMMON_CARDS.filter(c=>c.rarita===rarity&&
  c.effectSpec.type==='systemModifier');
 push(rotate(systems,seed%4).map(c=>c.id),arch.system);
 const terrains=ELEMENTAL_TERRAIN_CARDS.filter(c=>c.rarita===rarity&&
  own.includes(c.elementId));
 push(terrains.map(c=>c.id),arch.terrain);
 // Personaggi esclusi dall'audit: effetti e valori non sono ancora definitivi.
 const characters=[];
 push(rotate(characters,seed%5).map(c=>c.id),2);
 // Riempie il mazzo con una rotazione di Carte Arma e sistemi gia' registrati.
 // Nessuna carta inesistente, nessuna eccezione al limite copie.
 // Non usare armi come riempitivo universale: altrimenti persino il mazzo
 // "controllo" diventa ricco di cannoni e falsifica la durata media.
 // I sistemi esistenti possono essere presenti in piu' copie, entro i limiti.
 const fillers=[...rotate(systems,seed%5).map(c=>c.id),
  ...characters.map(c=>c.id),...terrains.map(c=>c.id),...energies,
  ...rotate(weapons,seed%7).map(c=>c.id)];
 for(let k=0;wanted.length<capacity&&k<capacity*12;k++)push(rotate(fillers,k),1);
 assert.equal(wanted.length,capacity,'Mazzo non completo '+ship+'/'+rarity+'/'+arch.name);
 return wanted;
}
function fallback(b){
 const enemy=b.sides[b.turn==='A'?'B':'A'];
 const guard=protectingFleetUnits(enemy,b.ply)[0];
 return guard?{cards:[],pass:false,targetKind:guard.kind,targetId:guard.id,
   ...(guard.kind==='escort'?{escortSlot:guard.slot}:{})}:
  {cards:[],pass:false,targetKind:'part',targetId:'weapons',partId:'weapons'};
}
function generatorOrder(b){
 const side=b.sides[b.turn],order=fallback(b);
 const hand=side.hand.map((id,i)=>({id,i,def:card(id)}));
 const available=hand.filter(x=>x.def&&
  !effectUnavailableReason(x.def,side,b));
 const weapons=available.filter(x=>x.def.effectSpec?.type==='deployMachine');
 const energy=available.filter(x=>x.def.effectSpec?.type==='energy');
 const selected=[];
 const empty=2-(side.machines||[]).filter(m=>m.hp>0&&!m.destroyed).length;
 if(empty>0&&weapons.length)selected.push(weapons[0].i);
 // Alimentazione condivisa: nessun consumo o sparo della madre senza prenotazione.
 for(const e of energy){
  if(selected.length>=3)break;
  selected.push(e.i);
 }
 for(const w of weapons.slice(1)){
  if(selected.length>=3||selected.filter(i=>weapons.some(e=>e.i===i)).length>=empty)break;
  selected.push(w.i);
 }
 let chosen=selected;
 while(chosen.length&&validateFleetTurn(b,b.turn,{...order,cards:chosen,pass:true}))
  chosen=chosen.slice(0,-1);
 return {...order,cards:chosen,pass:true};
}
function simulate(rarity,arch,shipA,shipB,seed,bossId=null,model='current'){
 let b=createFleetNextBattle({
  shipA,shipB,raritaA:rarity,raritaB:rarity,
  ruleset:HP_SYNC_RULESET,mode:bossId!=null?'campaign':'pvp',bossId,
  supportRosterA:roster(rarity,seed),
  supportRosterB:roster(rarity,seed+4),
  deckA:generator(shipA,rarity,arch,seed),
  deckB:generator(shipB,rarity,arch,seed+11),
  seed,nowMs:0
 });
 let turns=0,invalid=0,played=0,weaponShots=0,blocks=0,damage=0,passes=0,
  generatorShots=0,generatorHp=0;
 const meanTurnMs=17000; // 17s tipici fino alla terza carta/PASSA + animazioni
 while(b.phase==='playing'&&turns<102){
  const who=b.turn;
  const at=b.turnStartedAtMs+meanTurnMs;
  let order=model==='generator-v0'?generatorOrder(b):autoFleetTurn(b,who);
  if(model==='no-normal'){
   // Scenario diagnostico: nessun tiro GRATIS della madre; le armi sparano.
   order={...order,activateElemental:false,pass:true};
  }
  if(validateFleetTurn(b,who,order)){
   invalid++;order=fallback(b);
   if(model!=='current')order.pass=true;
  }
  let r=resolveFleetNextTurn(b,who,order,at);
  if(!r.ok){invalid++;order=fallback(r.battle);if(model!=='current')order.pass=true;r=resolveFleetNextTurn(r.battle,who,order,at);}
  assert.equal(r.ok,true,shipA+'/'+shipB+'/'+rarity+': '+r.reason);
  played+=order.cards?.length||0;
  passes+=Number(!!order.pass);
  weaponShots+=r.events.filter(e=>e.kind.startsWith('weapon-')&&
   /shot|cryo|discard|sequence/.test(e.kind)).length;
  blocks+=r.events.filter(e=>e.kind==='block').length;
  damage+=r.shot?.damage||0;
  b=r.battle;turns++;
  if(model==='generator-v0'&&b.phase==='playing'){
   const owner=b.sides[who],foe=b.sides[who==='A'?'B':'A'];
   const available=generatorCardCount(owner);
   const reserved=available>=4||
    arch.name==='offensivo'&&available>=2||
    arch.name==='equilibrato'&&available>=2&&turns%3===0;
   const preview=generatorAttackPreview(owner,reserved);
   if(preview.ready){
    const actual=commitGeneratorFiring(owner,preview);
    if(actual){
     const guard=protectingFleetUnits(foe,b.ply)[0];
     const target=guard?.unit||foe.ships[0];
     const element=owner.ships[0].element;
     const relationTarget=guard?.unit?.element||foe.ships[0].element;
     const afterElement=applyElementalDamage(foe,element,relationTarget,actual.nominalDamage).damage;
     const taken=guard?Math.min(target.hp,afterElement):
      limitedMotherDamage(target,afterElement,b.ply-1);
     target.hp=Math.max(0,target.hp-taken);
     if(guard&&target.hp===0){target.destroyed=true;target.linked=false;}
     if(!guard&&target.hp===0){
      b.phase='finished';b.winner=who;b.finishedAtMs=at;
      b.finishReason='Madre a zero HP (modello diagnostico Generatore)';
     }
     generatorShots++;generatorHp+=taken;
    }
   }
  }
  assert.ok(b.sides.A.ships[0].hp>=0&&b.sides.B.ships[0].hp>=0);
 }
 return {rarity,deck:arch.name,shipA,shipB,seed,model,
  boss:bossId!=null,seconds:turns*meanTurnMs/1000,
  rounds:Math.ceil(turns/2),turns,draw:b.winner==='draw',
  winner:b.winner||'unfinished',invalid,played,weaponShots,blocks,passes,damage,generatorShots,generatorHp};
}
function stats(matches){
 const seconds=[...matches.map(m=>m.seconds)].sort((a,b)=>a-b);
 const n=seconds.length;
 return {n,mean:Math.round(seconds.reduce((s,v)=>s+v,0)/n),
  median:seconds[Math.floor((n-1)/2)],
  p10:seconds[Math.floor((n-1)*.10)],
  p90:seconds[Math.floor((n-1)*.9)],
  draw:matches.filter(x=>x.draw).length,
  unfinished:matches.filter(x=>x.winner==='unfinished').length,
  within5to6:matches.filter(x=>x.seconds>=300&&x.seconds<=360).length,
  avgTurns:Math.round(matches.reduce((s,v)=>s+v.turns,0)/n),
  invalid:matches.reduce((s,v)=>s+v.invalid,0),
  avgWeaponShots:Math.round(matches.reduce((s,v)=>s+v.weaponShots,0)/n),
  avgGeneratorShots:Math.round(matches.reduce((s,v)=>s+(v.generatorShots||0),0)/n*10)/10
 };
}
test('Matrice PvP diagnostica: Comune, Rara, Epica, Leggendaria e tre archetipi',()=>{
 const rows=[];
 for(const rarity of SHIP_RARITIES)for(const arch of ARCHETYPES)
  for(const [index,[a,b]] of PRESETS[rarity].entries())
   for(const shift of [0,101])
    rows.push(simulate(rarity,arch,a,b,630+index*13+rIdx(rarity)*57+shift));
 assert.equal(rows.length,72);
 assert.equal(rows.filter(x=>x.winner==='unfinished').length,0);
 const report={calibration:'native-cards-v3',byRarity:Object.fromEntries(SHIP_RARITIES.map(r=>
   [r,stats(rows.filter(x=>x.rarity===r))])),
  byDeck:Object.fromEntries(ARCHETYPES.map(a=>[a.name,
   stats(rows.filter(x=>x.deck===a.name))])),
  overall:stats(rows),cases:rows.map(({rarity,deck,shipA,shipB,seconds,turns,draw,invalid,weaponShots})=>
   ({rarity,deck,a:shipA,b:shipB,seconds,turns,draw,invalid,weaponShots}))};
 console.log('WEAPON_PACING_MATRIX='+JSON.stringify(report));
});
test('Matrice boss diagnostica: parita rarita e boss di difficolta crescente',()=>{
 const cases=[];
 for(const rarity of SHIP_RARITIES)
  for(const [i,bossId] of [1,8,17].entries()){
   const [a,b]=PRESETS[rarity][i];
   for(const shift of [0,101])
    cases.push(simulate(rarity,ARCHETYPES[1],a,b,985+i*17+rIdx(rarity)*101+shift,bossId));
  }
 assert.equal(cases.length,24);
 const report={calibration:'native-cards-v3',overall:stats(cases),
  byRarity:Object.fromEntries(SHIP_RARITIES.map(r=>[r,stats(cases.filter(x=>x.rarity===r))])),
  cases:cases.map(({rarity,shipA,shipB,seconds,turns,draw,invalid,weaponShots})=>
   ({rarity,a:shipA,b:shipB,seconds,turns,draw,invalid,weaponShots}))};
 console.log('WEAPON_PACING_BOSS='+JSON.stringify(report));
});

test('Audit senza attacco gratuito madre, esclusi Personaggi (12 scenari)',()=>{
 const matches=[];
 for(const rarity of SHIP_RARITIES)for(let k=0;k<3;k++){
  const [a,b]=PRESETS[rarity][k];
  matches.push(simulate(rarity,ARCHETYPES[k],a,b,
   2401+rIdx(rarity)*71+k*17,null,'no-normal'));
 }
 const report={byRarity:Object.fromEntries(SHIP_RARITIES.map(r=>
  [r,stats(matches.filter(m=>m.rarity===r))])),
  byDeck:Object.fromEntries(ARCHETYPES.map(a=>
   [a.name,stats(matches.filter(m=>m.deck===a.name))])),
  overall:stats(matches),matches};
 console.log('WEAPON_PACING_NO_MOTHER='+JSON.stringify(report));
 assert.equal(matches.length,12);
});

test('Matrice diagnostica: due attacchi madre a 2/4 Energie fisiche, senza Personaggi',()=>{
 const cases=[];
 for(const rarity of SHIP_RARITIES)
  for(const [i,[a,b]] of PRESETS[rarity].entries()){
   const arch=ARCHETYPES[i];
   for(const shift of [0,101])
    cases.push(simulate(rarity,arch,a,b,2707+i*29+rIdx(rarity)*83+shift,null,'generator-v0'));
  }
 const report={byRarity:Object.fromEntries(SHIP_RARITIES.map(r=>
   [r,stats(cases.filter(c=>c.rarity===r))])),
  byDeck:Object.fromEntries(ARCHETYPES.map(a=>[a.name,
   stats(cases.filter(c=>c.deck===a.name))])),
  overall:stats(cases),examples:cases.slice(0,12)};
 console.log('WEAPON_PACING_GENERATOR='+JSON.stringify(report));
 assert.equal(cases.length,24);
});
