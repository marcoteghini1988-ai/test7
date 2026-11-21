import test from 'node:test';
import assert from 'node:assert/strict';
import {card} from './fleetNext/rules.js';
import {createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {PROVISIONAL_ADVANCED_WEAPONS} from './fleetNext/provisionalWeaponProfiles.js';
import {projectMachineBerths} from './fleetNext/battlePresentation.js';
const id=x=>'weapon-designed-'+x;
function game(supports=false){
 const roster=supports?SUPPORT_CATALOG.slice(0,2).map((s,i)=>({
  supportId:s.id,instanceId:'edge-'+i,slot:i,rarita:'Leggendaria'})):[];
 const b=createFleetNextBattle({shipA:'N00',shipB:'C01',raritaA:'Leggendaria',
  raritaB:'Leggendaria',mode:'pvp',ruleset:HP_SYNC_RULESET,supportRosterA:[],
  supportRosterB:roster,deckA:[],deckB:[],seed:211121,nowMs:0});
 for(const side of Object.values(b.sides)){
  side.hand=[];side.deck=Array(100).fill('gen-216');side.discard=[];
  side.ships[0].hp=5000;side.ships[0].maxHp=5000;
  for(const e of side.escorts){e.hp=300;e.maxHp=300;
   e.skill={requires:[],action:'none'};e.supportSkillIds=[];e.supportSkillId=null;}
 }
 return b;
}
function play(b,who,ids=[],more={}){
 b.sides[who].hand=[...ids];
 const result=resolveFleetNextTurn(b,who,{pass:true,cards:ids.map((_,i)=>i),...more},b.turnStartedAtMs+7000);
 assert.equal(result.ok,true,result.reason);return result;
}
const next=(b,ids=[])=>play(play(b,'B').battle,'A',ids);
const shot=(r,c)=>r.events.find(e=>e.kind==='weapon-provisional-shot'&&e.cardId===c);
test('Mortaio conserva il limite confermato di due colpi extra per turno',()=>{
 const c=id('plasma-mortaio-magmatico'),b=game();
 b.sides.A.energyPile=Array(4).fill('energy-plasma');b.sides.A.elementalCharges={plasma:4};
 const r=play(b,'A',[c]);assert.equal(shot(r,c).hitCount,3);
 assert.equal(r.battle.sides.A.elementalCharges.plasma,2);
 assert.equal(r.battle.sides.A.energyPile.length,2);
});
test('Boreale: gli impulsi formano un singolo colpo intercettato da una Difesa',()=>{
 const c=id('cryogenic-acceleratore-boreale'),b=game();
 b.sides.B.protections=[{source:'edge-defense',id:'gen-217',kind:'protect',
  target:'part',partId:'weapons',remaining:1,untilPly:100,placedPly:-2}];
 const r=play(b,'A',[c]),event=shot(r,c);
 assert.equal(event.hitCount,1);assert.equal(event.impacts[0].nominalDamage,36);
 assert.equal(event.actualDamage,0);
});
test('Lancia richiede un Personaggio: valido anche se preparato nello stesso turno',()=>{
 const c=id('ionic-lancia-comando-ionico'),b=game();b.sides.A.hand=[c];
 assert.match(validateFleetTurn(b,'A',{pass:true,cards:[0]}),/Personaggio/);
 const r=play(b,'A',['gen-216',c]);assert.equal(shot(r,c).impacts[0].nominalDamage,38);
});
test('Condensatore: Energia vecchia non basta, una nuova carica non alimenta due Armi',()=>{
 const c=id('ionic-condensatore-tempesta'),b=game();
 b.sides.A.energyPile=['energy-ionic','energy-ionic'];b.sides.A.elementalCharges={ionic:2};
 const idle=play(b,'A',[c]);assert.equal(shot(idle,c).hitCount,0);
 const fresh=game();fresh.sides.A.energyPile=['energy-ionic','energy-ionic'];
 fresh.sides.A.elementalCharges={ionic:2};
 const r=play(fresh,'A',['energy-ionic',c,c]);
 const all=r.events.filter(e=>e.kind==='weapon-provisional-shot'&&e.cardId===c);
 assert.deepEqual(all.map(e=>e.hitCount),[1,0]);
 assert.equal(r.battle.sides.A.elementalCharges.ionic,2);
});
test('Nucleo: interruzione permanente anche quando si gioca Energia in seguito',()=>{
 const c=id('ionic-nucleo-folgore');let r=play(game(),'A',[c]);
 r=next(r.battle);assert.equal(shot(r,c).impacts[0].nominalDamage,24);
 r=next(r.battle,['energy-ionic']);assert.equal(shot(r,c).impacts[0].nominalDamage,24);
 assert.equal(r.battle.sides.A.elementalCharges.ionic,1);
});
test('Perforatore: eccedenza effettiva dopo sincronizzazione, fino a due salti distinti',()=>{
 const c=id('metallic-perforatore-cascata'),b=game(true);
 for(const e of b.sides.B.escorts)e.hp=2;
 b.sides.B.synchronizationEffects=[{penaltyPercent:50,untilPly:100}];
 b.sides.A.energyPile=['energy-metallic','energy-metallic'];b.sides.A.elementalCharges={metallic:2};
 const r=play(b,'A',[c]),hits=shot(r,c).impacts;
 assert.equal(hits.length,3);assert.equal(new Set(hits.map(e=>e.targetId)).size,3);
 assert.deepEqual(hits.map(e=>e.nominalDamage),[38,17,6]);
 assert.equal(r.battle.sides.A.elementalCharges.metallic,undefined);
});
test('Recuperatore esclude i costi volontari del Binario',()=>{
 const binary=id('plasma-sistema-binario'),c=id('metallic-recuperatore-termobalistico');
 let r=play(game(),'A',[binary,c]);r=next(r.battle);
 assert.equal(r.battle.sides.A.ships[0].hp,4700);
 assert.equal(shot(r,c).impacts[0].nominalDamage,18);
});
test('Recuperatore conserva la perdita reale anche se la flotta viene poi riparata',()=>{
 const c=id('metallic-recuperatore-termobalistico');let r=play(game(),'A',[c]);
 const before=r.battle.sides.A.ships[0].hp;
 r=play(r.battle,'B',['weapon-base-ionic-01']);
 const loss=before-r.battle.sides.A.ships[0].hp;assert.ok(loss>0);
 r.battle.sides.A.ships[0].hp=5000;
 r=play(r.battle,'A');
 assert.equal(shot(r,c).impacts[0].nominalDamage,18+Math.min(54,Math.round(loss*.6)));
});
test('Collassatore respinge la collisione se una delle due navi agganciate è distrutta',()=>{
 const first=id('metallic-ganasce-magnetiche'),second=id('metallic-collassatore-lega');
 let r=play(game(true),'A',[first]);r=play(r.battle,'B');
 const dead=r.battle.sides.B.escorts[0];dead.hp=0;dead.destroyed=true;
 r.battle.sides.A.hand=[second];
 assert.match(validateFleetTurn(r.battle,'A',{pass:true,cards:[0]}),/ancora vive/);
});
test('Costo letale: la madre distrutta non spara dopo aver pagato HP',()=>{
 const c=id('plasma-sistema-binario');let r=play(game(),'A',[c]);
 r=play(r.battle,'B');r.battle.sides.A.ships[0].hp=1;
 r=play(r.battle,'A',[],{pass:false,targetKind:'part',targetId:'weapons',partId:'weapons'});
 assert.equal(r.battle.winner,'B');assert.equal(r.shot.damage,0);
});
test('Accoppiatore restituisce al massimo gli HP realmente sottratti al nemico',()=>{
 let r=play(game(),'A',[id('plasma-sistema-binario')]);
 r=next(r.battle,[id('plasma-accoppiatore-termofagico')]);
 const event=shot(r,id('plasma-accoppiatore-termofagico'));
 const healing=r.events.find(e=>e.kind==='weapon-heal');assert.ok(healing);
 assert.ok(healing.actualHealing<=event.actualDamage);
});
test('Ogni profilo attivo si proietta nelle informazioni Arma senza NaN o errori',()=>{
 for(const row of PROVISIONAL_ADVANCED_WEAPONS){
  const b=game(),side=b.sides.A;
  side.machines=[{id:'edge-preview',sourceCardId:row.id,slot:0,hp:1,maxHp:1,
   power:1,deployedPly:0,untilPly:20,damageMode:'designed-shot',
   weaponProfile:row.profile,weaponElementId:card(row.id).elementId}];
  const item=projectMachineBerths(side,[],0)[0];assert.ok(item,row.id);
  if(item.nominalDamage!=null)assert.ok(Number.isFinite(item.nominalDamage),row.id);
  assert.ok(item.nominalDamage!=null||item.damagePercent!=null||item.damageFormula,row.id);
 }
});
