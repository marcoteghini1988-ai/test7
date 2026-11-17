import test from 'node:test';
import assert from 'node:assert/strict';
import {DISMANTLE_CARDS,card,cardRole,cardCopyLimit,eligibleExclusives,exclusiveOperational} from './fleetNext/rules.js';
import {CAMPAIGN_SHIP_ORDER,getShipProgression} from './fleetNext/progression.js';
import {buildNextBaseDeck,buyNextCommonCard} from './fleetNext/nextDeckLoadout.js';
import {normalizeFleetInventory,createFleetInventory} from './fleetNext/collection.js';
import {createFleetNextBattle,resolveFleetNextTurn,effectUnavailableReason,protectingFleetUnits} from './fleetNext/combat.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {dismantleCandidates,dismantleActive,applyDismantleCard} from './fleetNext/dismantleEffects.js';
import {projectFleetDefense} from './fleetNext/battlePresentation.js';
import {resetFieldWithBlackHole} from './fleetNext/newCardEffects.js';

const make=(shipB='N00',levelB=5)=>createFleetNextBattle({
 shipA:'N00',levelA:5,shipB,levelB,deckA:[],deckB:[],seed:417,mode:'pvp',
 ruleset:HP_SYNC_RULESET
});
function play(b,who,id=null,opts={}){
 if(id)b.sides[who].hand=[id,...b.sides[who].hand.filter(x=>x!==id)];
 const r=resolveFleetNextTurn(b,who,{cards:id?[0]:[],pass:true,...opts},1000+b.ply*30000);
 assert.equal(r.ok,true,id+': '+r.reason);
 return r;
}
test('Quattro rarità Smontaggio sono Attacco, acquistabili e inseribili nel mazzo',()=>{
 assert.deepEqual(DISMANTLE_CARDS.map(c=>c.rarita),['Comune','Rara','Epica','Leggendaria']);
 for(const c of DISMANTLE_CARDS){
  assert.equal(card(c.id)?.id,c.id);
  assert.equal(cardRole(c.id),'attack');
  assert.ok(cardCopyLimit(c.id)>=2);
 }
 const bought=buyNextCommonCard({...createFleetInventory(),credits:5000},'atk-dismantle-e');
 assert.equal(bought.ok,true);
 const inv=normalizeFleetInventory(bought.inventory);
 assert.equal(inv.owned['atk-dismantle-e'],1);
 assert.ok(buildNextBaseDeck(inv,'N00',5,['atk-dismantle-e']).baseDeck.includes('atk-dismantle-e'));
});
test('Comune: smonta un Arsenale, mantiene HP e rimonta alla fine di un turno',()=>{
 let b=make(),original=structuredClone(b.sides.B.ships[0]);
 assert.ok(dismantleCandidates(b.sides.B,0).some(c=>c.key==='part:weapons'));
 b=play(b,'A','atk-dismantle-c',{dismantleTargets:['part:weapons']}).battle;
 assert.equal(b.sides.B.ships[0].attackPower,getShipProgression('N00',1).attackPower);
 assert.equal(b.sides.B.ships[0].parts.find(p=>p.id==='weapons').dismantled,true);
 assert.equal(b.sides.B.ships[0].hp,original.hp);
 assert.equal(b.sides.B.ships[0].level,5);
 assert.equal(dismantleActive(b.sides.B,b.ply).length,1);
 b=play(b,'B').battle;
 assert.equal(b.sides.B.ships[0].attackPower,original.attackPower);
 assert.deepEqual(b.sides.B.ships[0].parts,original.parts);
 assert.equal(b.sides.B.ships[0].hp,original.hp);
 assert.ok(b.sides.A.discard.includes('atk-dismantle-c'));
});
test('Madre senza Arsenale può ancora subire danni alla propria barra HP',()=>{
 const b=make(),hp=b.sides.B.ships[0].hp;
 const r=play(b,'A','atk-dismantle-c',{
  dismantleTargets:['part:weapons'],pass:false,targetKind:'part',
  targetId:'weapons',partId:'weapons'});
 assert.ok(r.shot.damage>0,'colpo sulla madre ancora possibile');
 assert.ok(r.battle.sides.B.ships[0].hp<hp);
});
test('Rara: due turni di smontaggio per il modulo con stesso ID e integrità',()=>{
 let b=make();
 b.sides.B.modules.weapon={id:'modulo-originale',slot:'weapon',name:'Modulo',
  cardId:'nx-n00-07',hp:1,maxHp:2,destroyed:false};
 b=play(b,'A','atk-dismantle-r',{dismantleTargets:['module:weapon']}).battle;
 assert.equal(b.sides.B.modules.weapon,null);
 assert.equal(b.sides.B.heldModules.weapon.id,'modulo-originale');
 b=play(b,'B').battle;b=play(b,'A').battle;
 assert.equal(b.sides.B.modules.weapon,null);
 b=play(b,'B').battle;
 assert.equal(b.sides.B.modules.weapon.id,'modulo-originale');
 assert.equal(b.sides.B.modules.weapon.hp,1);
 assert.equal(b.sides.B.heldModules.weapon,undefined);
 assert.equal(b.sides.A.discard.filter(x=>x==='atk-dismantle-r').length,1);
});
test('Epica: smonta Centralina e secondo supporto, recuperandoli dopo due turni',()=>{
 let b=make('C02');
 b=play(b,'A','atk-dismantle-e',{dismantleTargets:['part:command','escort:1']}).battle;
 assert.equal(b.sides.B.ships[0].parts.find(p=>p.id==='command').dismantled,true);
 assert.equal(projectFleetDefense(b.sides.B.ships[0]).parts.command.unlocked,false);
 assert.equal(b.sides.B.escorts.find(e=>e.sourceIndices[0]===1).dismantled,true);
 assert.equal(protectingFleetUnits(b.sides.B,b.ply).length,0);
 b=play(b,'B').battle;b=play(b,'A').battle;b=play(b,'B').battle;
 assert.equal(b.sides.B.ships[0].parts.find(p=>p.id==='command').dismantled,undefined);
 assert.equal(b.sides.B.escorts.find(e=>e.sourceIndices[0]===1).dismantled,undefined);
 assert.ok(protectingFleetUnits(b.sides.B,b.ply).length>=1);
});
test('Leggendaria: torna alle capacità L1, sospende esclusive e poi rimonta senza guarire',()=>{
 let b=make('C02'),original=structuredClone(b.sides.B.ships[0]);
 const originalEscorts=b.sides.B.escorts.map(e=>({id:e.id,hp:e.hp,grade:e.grade}));
 const exclusive=eligibleExclusives('C02',5).find(c=>c.minShipLevelDraft>1);
 assert.ok(exclusive);
 b=play(b,'A','atk-dismantle-l').battle;
 const side=b.sides.B;
 assert.equal(side.ships[0].operationalLevel,1);
 assert.equal(side.ships[0].level,5);
 assert.equal(side.ships[0].attackPower,getShipProgression('C02',1).attackPower);
 assert.equal(side.ships[0].parts.find(p=>p.id==='command').dismantled,true);
 assert.equal(side.escorts.filter(e=>e.linked).length,0);
 assert.equal(exclusiveOperational(exclusive.id,side.ships[0],side.escorts),false);
 assert.equal(side.ships[0].hp,original.hp);
 b=play(b,'B').battle;b=play(b,'A').battle;b=play(b,'B').battle;
 assert.equal(b.sides.B.ships[0].operationalLevel,undefined);
 assert.equal(b.sides.B.ships[0].attackPower,original.attackPower);
 assert.equal(b.sides.B.ships[0].hp,original.hp);
 assert.deepEqual(b.sides.B.escorts.map(e=>({id:e.id,hp:e.hp,grade:e.grade})),originalEscorts);
});
test('Buco Nero risucchia gli effetti attivi e i moduli trattenuti senza rimontarli',()=>{
 let b=make();
 b.sides.B.modules.weapon={id:'mod1',slot:'weapon',name:'Modulo',
  cardId:'nx-n00-07',hp:1,maxHp:2,destroyed:false};
 const hp=b.sides.B.ships[0].hp;
 b=play(b,'A','atk-dismantle-r',{dismantleTargets:['module:weapon']}).battle;
 const out=resetFieldWithBlackHole(b);
 assert.ok(out.A.includes('atk-dismantle-r'));
 assert.ok(out.B.includes('nx-n00-07'));
 assert.ok(b.sides.A.discard.includes('atk-dismantle-r'));
 assert.ok(b.sides.B.discard.includes('nx-n00-07'));
 assert.equal(b.sides.B.modules.weapon,null);
 assert.equal(b.sides.B.ships[0].hp,hp);
 assert.equal(b.sides.B.dismantleEffects.length,0);
});
test('A livello 1 senza accessori non inventa componenti da smontare',()=>{
 const b=make('N00',1);
 assert.deepEqual(dismantleCandidates(b.sides.B,0),[]);
 assert.match(effectUnavailableReason(card('atk-dismantle-c'),b.sides.A,b),/non ha componenti/);
});
test('Sovrapposizione: una Leggendaria mantiene il declassamento fino alla sua scadenza',()=>{
 let b=make();
 b=play(b,'A','atk-dismantle-c',{dismantleTargets:['part:weapons']}).battle;
 b=play(b,'B').battle;
 b=play(b,'A','atk-dismantle-l').battle;
 assert.equal(b.sides.B.ships[0].attackPower,getShipProgression('N00',1).attackPower);
 b=play(b,'B').battle;
 assert.equal(b.sides.B.ships[0].attackPower,getShipProgression('N00',1).attackPower);
 b=play(b,'A').battle;b=play(b,'B').battle;
 assert.equal(b.sides.B.ships[0].attackPower,getShipProgression('N00',5).attackPower);
});
test('Le 12 madri non perdono componenti permanenti né HP',()=>{
 for(const shipId of CAMPAIGN_SHIP_ORDER){
  const b=make(shipId),side=b.sides.B,oldParts=side.ships[0].parts.map(p=>p.id),hp=side.ships[0].hp;
  const r=applyDismantleCard(side,card('atk-dismantle-l'),0,'A');
  assert.equal(r.ok,true,shipId+': '+r.reason);
  assert.deepEqual(side.ships[0].parts.map(p=>p.id),oldParts);
  assert.equal(side.ships[0].hp,hp);
 }
});
