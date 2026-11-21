// Audit diagnostico del bilanciamento tra flotte di PARI rarita'.
// Usa il vero motore, armi e carte esistenti; NON crea carte Difesa/Trappola nuove.
// I secondi sono stimati: scelta giocatore + animazioni, e vanno confermati su UI.
import test from 'node:test';
import assert from 'node:assert/strict';
import {createFleetNextBattle,autoFleetTurn,resolveFleetNextTurn,
 validateFleetTurn,protectingFleetUnits} from './fleetNext/combat.js';
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

const PRESETS=Object.freeze({
 Comune:[['N00','C01'],['C01','C02'],['C02','C03']],
 Rara:[['R01','R02'],['C01','R04'],['C03','R01']],
 Epica:[['E01','E02'],['R04','R02'],['C02','E01']],
 Leggendaria:[['L03','L04'],['C01','E02'],['R04','L01']]
});
// Valori ESPLORATIVI: non sono cambiamenti definitivi alle carte.
const TRIAL_FACTORS=Object.freeze({
 Comune:{mother:.52,weapon:.47},Rara:{mother:.72,weapon:.69},
 Epica:{mother:1.23,weapon:1.21},Leggendaria:{mother:1,weapon:1}
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
 const characters=Object.values(GENERAL_CARDS).filter(c=>
  rIdx(c.rarita)<=rIdx(rarity));
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
function simulate(rarity,arch,shipA,shipB,seed,bossId=null){
 let b=createFleetNextBattle({
  shipA,shipB,raritaA:rarity,raritaB:rarity,
  ruleset:HP_SYNC_RULESET,mode:bossId!=null?'campaign':'pvp',bossId,
  supportRosterA:roster(rarity,seed),
  supportRosterB:roster(rarity,seed+4),
  deckA:generator(shipA,rarity,arch,seed),
  deckB:generator(shipB,rarity,arch,seed+11),
  seed,nowMs:0
 });
 // Asset e cataloghi non vengono cambiati: i fattori vivono solo nello
 // stato di questa battaglia diagnostica e NON nel gioco del giocatore.
 if(bossId!=null)b.sides.B.ships[0].bossGuardPercent=0;
 for(const side of Object.values(b.sides)){
  side.ships[0].attackPower=Math.max(1,Math.round(
   side.ships[0].attackPower*TRIAL_FACTORS[rarity].mother));
  side.__weaponPacingAuditFactor=TRIAL_FACTORS[rarity].weapon;
 }
 let turns=0,invalid=0,played=0,weaponShots=0,blocks=0,damage=0,passes=0;
 const meanTurnMs=17000; // 17s tipici fino alla terza carta/PASSA + animazioni
 while(b.phase==='playing'&&turns<102){
  const who=b.turn;
  const at=b.turnStartedAtMs+meanTurnMs;
  let order=autoFleetTurn(b,who);
  if(validateFleetTurn(b,who,order)){invalid++;order=fallback(b);}
  let r=resolveFleetNextTurn(b,who,order,at);
  if(!r.ok){invalid++;order=fallback(r.battle);r=resolveFleetNextTurn(r.battle,who,order,at);}
  assert.equal(r.ok,true,shipA+'/'+shipB+'/'+rarity+': '+r.reason);
  played+=order.cards?.length||0;
  passes+=Number(!!order.pass);
  weaponShots+=r.events.filter(e=>e.kind.startsWith('weapon-')&&
   /shot|cryo|discard|sequence/.test(e.kind)).length;
  blocks+=r.events.filter(e=>e.kind==='block').length;
  damage+=r.shot?.damage||0;
  b=r.battle;turns++;
  assert.ok(b.sides.A.ships[0].hp>=0&&b.sides.B.ships[0].hp>=0);
 }
 return {rarity,deck:arch.name,shipA,shipB,seed,
  boss:bossId!=null,seconds:turns*meanTurnMs/1000,
  rounds:Math.ceil(turns/2),turns,draw:b.winner==='draw',
  winner:b.winner||'unfinished',invalid,played,weaponShots,blocks,passes,damage};
}
function stats(matches){
 const seconds=[...matches.map(m=>m.seconds)].sort((a,b)=>a-b);
 const n=seconds.length;
 return {n,mean:Math.round(seconds.reduce((s,v)=>s+v,0)/n),
  median:seconds[Math.floor((n-1)/2)],
  p10:seconds[Math.floor((n-1)*.10)],
  p90:seconds[Math.floor((n-1)*.9)],
  draw:matches.filter(x=>x.draw).length,
  within5to6:matches.filter(x=>x.seconds>=300&&x.seconds<=360).length,
  avgTurns:Math.round(matches.reduce((s,v)=>s+v.turns,0)/n),
  invalid:matches.reduce((s,v)=>s+v.invalid,0),
  avgWeaponShots:Math.round(matches.reduce((s,v)=>s+v.weaponShots,0)/n)
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
 const report={calibration:TRIAL_FACTORS,byRarity:Object.fromEntries(SHIP_RARITIES.map(r=>
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
 const report={calibration:TRIAL_FACTORS,overall:stats(cases),
  byRarity:Object.fromEntries(SHIP_RARITIES.map(r=>[r,stats(cases.filter(x=>x.rarity===r))])),
  cases:cases.map(({rarity,shipA,shipB,seconds,turns,draw,invalid,weaponShots})=>
   ({rarity,a:shipA,b:shipB,seconds,turns,draw,invalid,weaponShots}))};
 console.log('WEAPON_PACING_BOSS='+JSON.stringify(report));
});
