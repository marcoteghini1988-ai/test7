// Le prove delle fusioni materne ritirate sono sostituite dai test
// delle Carte Navicella Fusione indipendenti in fleetNextOfficialFusionEffects.test.js.
import {EXCLUSIVE_UNLOCK_MILESTONES} from './fleetNext/exclusiveUnlocks.js';
import {shipMaxLevel} from './fleetNext/progression.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {card,cardCopyLimit,cardFacePath,effectiveDeck,eligibleExclusives,
 exclusiveUnlocked,EXCLUSIVE_CARDS,EXCLUSIVE_DESIGNS_120,EXCLUSIVE_SHIP_IDS,
 BOSS_CARDS,GENERAL_CARDS} from './fleetNext/rules.js';
import {createFleetNextBattle,resolveFleetNextTurn,autoFleetTurn,
 effectUnavailableReason} from './fleetNext/combat.js';
import {mountModule,removeModule} from './fleetNext/auroraEngine.js';
import {arkFusedEscorts,arkUnfusedEscorts,arkModuleActive,
 arkModulesInDiscard,arkDamagedEscorts} from './fleetNext/arkEngine.js';

const IDS=['nx-l04-01','nx-l04-02','nx-l04-03','ex-l04-01','nx-l04-05',
 'nx-l04-06','nx-l04-07','nx-l04-08','nx-l04-09','nx-l04-10'];
function make({shipA='L04',shipB='C03',levelA=5,levelB=5}={}){
 const b=createFleetNextBattle({shipA,shipB,levelA,levelB,mode:'pvp',
  deckA:[],deckB:[],seed:466});
 for(const side of Object.values(b.sides)){
  side.hand=[];side.deck=Array(24).fill('gen-216');side.discard=[];
 }
 return b;
}
const other=(b,who)=>b.sides[who==='A'?'B':'A'];
const target=(kind,u)=>({pass:false,targetKind:kind,targetId:u.id,
 ...(kind==='escort'?{escortSlot:u.slot}:kind==='machine'?{machineSlot:u.slot}:
  kind==='part'?{partId:u.id}:{})});
function play(b,who='A',hand=[],extra={pass:true},indices=null){
 b.turn=who;b.sides[who].hand=[...hand];
 const part=other(b,who).ships[0].parts.find(p=>p.hp>0&&!p.destroyed);
 const r=resolveFleetNextTurn(b,who,{cards:indices??hand.map((_,i)=>i),
  partId:part?.id,...extra},b.ply*30000+1000);
 assert.equal(r.ok,true,r.reason);
 return r;
}
function equip(side,id){
 const r=mountModule(side,card(id));
 assert.equal(r.ok,true,r.reason);return r.entry;
}
function shield(side,unit,source='ark:test:defense',kind='escort'){
 side.defenses.push({id:'gen-227',source,hidden:false,untilPly:20});
 side.protections.push({id:'gen-227',source,kind:'protect',remaining:1,
  target:kind,escortSlot:kind==='escort'?unit.slot:null,
  machineSlot:kind==='machine'?unit.slot:null,
  untilPly:20,placedPly:-1});
}
test('Tutte le 120 esclusive sono giocabili: Arca completa, 12 madri, Boss e Personaggi intatti',()=>{
 assert.equal(EXCLUSIVE_DESIGNS_120.length,120);
 assert.equal(new Set(EXCLUSIVE_DESIGNS_120.map(c=>c.id)).size,120);
 assert.equal(EXCLUSIVE_SHIP_IDS.length,12);
 assert.equal(Object.values(EXCLUSIVE_CARDS).filter(c=>c.playable===false).length,0);
 assert.equal(new Set(IDS).size,10);
 for(const id of IDS){
  const c=card(id);assert.ok(c,id);
  assert.equal(c.shipId,'L04');
  assert.equal(c.effectSpec.type,id==='nx-l04-05'?'exchange':'ark');
  assert.equal(c.playable!==false,true);
  assert.equal(cardFacePath(id),null);
  assert.equal(exclusiveUnlocked(id,'L04',shipMaxLevel('L04')),true);
  assert.equal(exclusiveUnlocked(id,'L03',5),false);
 }
 assert.equal(Object.keys(BOSS_CARDS).length,12);
 assert.equal(Object.values(GENERAL_CARDS).filter(c=>c.kind==='character').length,12);
 assert.equal(Object.values(EXCLUSIVE_CARDS).filter(c=>c.kind==='character').length,12);
});
test('Arca sblocca 4 esclusive iniziali, poi 6; la vecchia carta Fusione è tattica',()=>{
 for(let level=1;level<=shipMaxLevel('L04');level++){
  assert.equal(eligibleExclusives('L04',level).filter(c=>IDS.includes(c.id)).length,(4+EXCLUSIVE_UNLOCK_MILESTONES['L04'].filter(n=>n<=level).length));
  const physical=effectiveDeck([],'L04',level);
  assert.equal(physical.filter(id=>id==='nx-l04-05').length,1);
  assert.equal(physical.includes('prog-fusion-l04'),false);
  assert.equal(physical.filter(id=>IDS.includes(id)).length,(4+EXCLUSIVE_UNLOCK_MILESTONES['L04'].filter(n=>n<=level).length));
 }
 assert.equal(cardCopyLimit('nx-l04-05'),1);
 assert.equal(cardCopyLimit('nx-l04-06'),1);
 assert.equal(cardCopyLimit('ex-l04-01'),1);
});
test('Archivio non concede un recupero senza modulo negli scarti',()=>{
 const b=make();equip(b.sides.A,'nx-l04-01');
 b.sides.A.hand=['gen-217'];
 const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[],pass:true,arkArchive:true,
  arkArchiveDiscardId:'gen-217'},1000);
 assert.equal(r.ok,false);assert.match(r.reason,/nessun modulo/);
 assert.equal(JSON.stringify(b),before);
});
test('Archivio scarta una carta vera, recupera il modulo e non lo monta gratis',()=>{
 const b=make();equip(b.sides.A,'nx-l04-01');
 equip(b.sides.A,'nx-l04-07');removeModule(b.sides.A,'weapon');
 const r=play(b,'A',['gen-217'],{pass:true,arkArchive:true,
  arkArchiveDiscardId:'gen-217',arkRecoverModuleId:'nx-l04-07'},[]);
 assert.equal(r.battle.sides.A.modules.weapon,null);
 assert.ok(r.battle.sides.A.hand.includes('nx-l04-07'));
 assert.ok(!r.battle.sides.A.discard.includes('nx-l04-07'));
 assert.ok(r.battle.sides.A.discard.includes('gen-217'));
 assert.equal(r.battle.sides.A.ark.recoveredModules.includes('nx-l04-07'),true);
 assert.equal(r.events.filter(e=>e.kind==='ark-archive').length,1);
 assert.equal(r.events.find(e=>e.kind==='ark-archive').freeMount,false);
});
test('Modulo recuperato dall’Archivio viene montato con una sola integrità',()=>{
 let b=make();equip(b.sides.A,'nx-l04-01');
 equip(b.sides.A,'nx-l04-07');removeModule(b.sides.A,'weapon');
 b=play(b,'A',['gen-217'],{pass:true,arkArchive:true},[]).battle;
 b=play(b,'B',[],{pass:true}).battle;
 const r=play(b,'A',['nx-l04-07'],{pass:true});
 assert.equal(r.battle.sides.A.modules.weapon.hp,1);
 assert.equal(r.battle.sides.A.modules.weapon.maxHp,2);
 assert.equal(r.battle.sides.A.ark.recoveredModules.length,0);
});
test('Archivio distrutto non può recuperare se stesso',()=>{
 const b=make();equip(b.sides.A,'nx-l04-01');removeModule(b.sides.A,'utility');
 b.sides.A.hand=['gen-217'];
 const result=resolveFleetNextTurn(b,'A',{cards:[],pass:true,arkArchive:true},1000);
 assert.equal(result.ok,false);assert.match(result.reason,/non montato/);
});
test('Raggio conservativo ripara 1 HP solo dopo danno effettivo',()=>{
 const b=make();
 const own=b.sides.A.escorts[1];own.hp-=2;
 const foe=b.sides.B.escorts[0],hp=foe.hp;
 const r=play(b,'A',['nx-l04-02'],{...target('escort',foe),
  arkRayEscortId:own.id});
 assert.equal(r.shot.escortDamage,1);
 assert.equal(r.battle.sides.B.escorts[0].hp,hp-1);
 assert.equal(r.battle.sides.A.escorts[1].hp,own.hp+1);
 assert.ok(r.events.some(e=>e.kind==='ark-repair'&&e.healed===1));
});
test('Raggio bloccato da Difesa non ripara il supporto',()=>{
 const b=make();const own=b.sides.A.escorts[0];own.hp-=2;
 const foe=b.sides.B.escorts[0];shield(b.sides.B,foe);
 const r=play(b,'A',['nx-l04-02'],{...target('escort',foe),
  arkRayEscortId:own.id});
 assert.equal(r.shot.escortDamage,0);
 assert.equal(r.battle.sides.A.escorts[0].hp,own.hp);
 assert.equal(r.events.some(e=>e.kind==='ark-repair'),false);
});
test('Raggio non rianima un supporto distrutto e rifiuta la scelta',()=>{
 const b=make();const own=b.sides.A.escorts[0];
 own.hp=0;own.destroyed=true;b.sides.A.hand=['nx-l04-02'];
 const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[0],...target('escort',b.sides.B.escorts[0]),
  arkRayEscortId:own.id},1000);
 assert.equal(r.ok,false);assert.match(r.reason,/non operativo/);
 assert.equal(JSON.stringify(b),before);
});
test('Custodia delle riserve annulla il prossimo colpo sul supporto non fuso',()=>{
 let b=make();const first=b.sides.A.escorts[0],hp=first.hp;
 b=play(b,'A',['nx-l04-03'],{pass:true,arkCustodyEscortId:first.id}).battle;
 const r=play(b,'B',[],target('escort',b.sides.A.escorts[0]));
 assert.equal(r.battle.sides.A.escorts[0].hp,hp);
 assert.equal(r.battle.sides.A.defenses.some(d=>d.id==='nx-l04-03'),false);
 assert.ok(r.events.some(e=>e.kind==='block'&&e.cardId==='nx-l04-03'));
});
test('Coro recupera due HP veri su un supporto vivo, ma non oltre il massimo',()=>{
 const b=make();b.sides.A.escorts[0].hp-=3;
 const hp=b.sides.A.escorts[0].hp;
 const r=play(b,'A',['nx-l04-06'],{pass:true,arkChorusMode:'focus',
  arkChorusFirstId:b.sides.A.escorts[0].id});
 assert.equal(r.battle.sides.A.escorts[0].hp,hp+2);
 assert.ok(r.events.some(e=>e.kind==='ark-repair'&&e.healed===2));
 assert.equal(r.battle.sides.A.ark.qualifiedRepairPly,0);
});
test('Coro diviso distribuisce 1 + 1 senza attivare la soglia Custode ≥2',()=>{
 const b=make();b.sides.A.escorts.forEach(e=>e.hp--);
 const [first,second]=b.sides.A.escorts;
 const r=play(b,'A',['nx-l04-06'],{pass:true,arkChorusMode:'split',
  arkChorusFirstId:first.id,arkChorusSecondId:second.id});
 assert.equal(r.battle.sides.A.escorts[0].hp,first.maxHp);
 assert.equal(r.battle.sides.A.escorts[1].hp,second.maxHp);
 assert.notEqual(r.battle.sides.A.ark.qualifiedRepairPly,0);
 assert.ok(r.events.some(e=>e.kind==='ark-repair'&&e.healed===2));
});
test('Coro su supporto danneggiato di 1 punto ripara solo 1 HP reale',()=>{
 const b=make();b.sides.A.escorts[0].hp--;
 const r=play(b,'A',['nx-l04-06'],{pass:true,arkChorusMode:'focus'});
 assert.ok(r.events.some(e=>e.kind==='ark-repair'&&e.healed===1));
 assert.notEqual(r.battle.sides.A.ark.qualifiedRepairPly,0);
});
test('Custode Astrale scambia una carta dopo una riparazione singola di almeno 2 HP',()=>{
 const b=make();b.sides.A.escorts[0].hp-=3;
 b.sides.A.deck=['gen-218','gen-235',...Array(18).fill('gen-216')];
 const r=play(b,'A',['ex-l04-01','nx-l04-06','gen-217'],{
  pass:true,arkCustodianSwap:true,arkCustodianBottomId:'gen-217',
  arkChorusMode:'focus',arkChorusFirstId:b.sides.A.escorts[0].id},[0,1]);
 const event=r.events.find(e=>e.kind==='ark-custodian');
 assert.ok(event);assert.equal(event.putBottomCardId,'gen-217');
 assert.equal(event.drawnCardId,'gen-218');assert.equal(event.netCards,0);
 assert.equal(r.battle.sides.A.ark.custodianUsedPly,0);
 assert.equal(r.battle.sides.A.deck.includes('gen-217'),true);
});
test('Custode non ricambia con due riparazioni separate da un punto',()=>{
 const b=make();b.sides.A.escorts.forEach(e=>e.hp--);
 const r=play(b,'A',['ex-l04-01','nx-l04-06','gen-217'],{
  pass:true,arkCustodianSwap:true,arkCustodianBottomId:'gen-217',
  arkChorusMode:'split',arkChorusFirstId:b.sides.A.escorts[0].id,
  arkChorusSecondId:b.sides.A.escorts[1].id},[0,1]);
 assert.equal(r.events.some(e=>e.kind==='ark-custodian'),false);
 assert.ok(r.battle.sides.A.hand.includes('gen-217'));
});
test('Custode non accetta lo scarto di una carta già giocata',()=>{
 const b=make();b.sides.A.hand=['ex-l04-01','nx-l04-06'];
 b.sides.A.escorts[0].hp-=2;
 const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[0,1],pass:true,
  arkCustodianSwap:true,arkCustodianBottomId:'nx-l04-06'},1000);
 assert.equal(r.ok,false);assert.match(r.reason,/carta rimasta|non|Custode/);
 assert.equal(JSON.stringify(b),before);
});
test('Lanciatore di stelle richiede riparazione prima del normale colpo e non crea extra',()=>{
 const b=make();equip(b.sides.A,'nx-l04-07');
 b.sides.A.ships[0].attackPower=2;b.sides.B.ships[0].defensePower=1;
 b.sides.A.escorts[0].hp-=3;
 const foe=b.sides.B.escorts[0],hp=foe.hp;
 const r=play(b,'A',['nx-l04-06'],{...target('escort',foe),
  arkChorusMode:'focus',arkChorusFirstId:b.sides.A.escorts[0].id});
 assert.equal(r.shot.escortDamage,3);
 assert.equal(r.battle.sides.B.escorts[0].hp,hp-3);
 assert.equal(r.shot.targets.length,1);
 assert.equal(r.events.filter(e=>e.kind==='ark-launcher').length,1);
});
test('Lanciatore senza riparazione non potenzia e non colpisce i vitali',()=>{
 const b=make();equip(b.sides.A,'nx-l04-07');
 b.sides.A.ships[0].attackPower=2;b.sides.B.ships[0].defensePower=1;
 const foe=b.sides.B.escorts[0];
 const r=play(b,'A',[],target('escort',foe));
 assert.equal(r.shot.escortDamage,1);
 assert.equal(r.events.some(e=>e.kind==='ark-launcher'),false);
});
test('IA Arca sa recuperare un modulo autentico quando Archivio è operativo',()=>{
 const b=make();equip(b.sides.A,'nx-l04-01');
 equip(b.sides.A,'nx-l04-07');removeModule(b.sides.A,'weapon');
 b.sides.A.hand=['gen-217'];
 const ai=autoFleetTurn(b,'A');
 assert.equal(ai.arkArchive,true);
 const r=resolveFleetNextTurn(b,'A',ai,1000);
 assert.equal(r.ok,true,r.reason);
 assert.ok(r.events.some(e=>e.kind==='ark-archive'));
});
