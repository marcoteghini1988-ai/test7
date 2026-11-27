// Le prove delle fusioni materne ritirate sono sostituite dai test
// delle Carte Navicella Fusione indipendenti in fleetNextOfficialFusionEffects.test.js.
import {EXCLUSIVE_UNLOCK_MILESTONES} from './fleetNext/exclusiveUnlocks.js';
import {shipMaxLevel} from './fleetNext/progression.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {card,cardFacePath,eligibleExclusives,effectiveDeck,exclusiveUnlocked,
 GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS} from './fleetNext/rules.js';
import {createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn,
 protectingFleetUnits,availableFleetTargets,autoFleetTurn,
 effectUnavailableReason} from './fleetNext/combat.js';
import {mountModule,removeModule} from './fleetNext/auroraEngine.js';
import {recallLinceMachine} from './fleetNext/linceEngine.js';
import {obsidianFusedEscort,obsidianModuleActive,obsidianPending,
 obsidianSealed,obsidianBulkheadTryHit} from './fleetNext/obsidianEngine.js';

const IDS=['nx-l03-01','nx-l03-02','nx-l03-03','nx-l03-04','ex-l03-01',
 'nx-l03-06','nx-l03-07','nx-l03-08','nx-l03-09','nx-l03-10'];
function make({shipA='L03',shipB='C03',levelA=shipMaxLevel(shipA),levelB=shipMaxLevel(shipB)}={}){
 const b=createFleetNextBattle({shipA,shipB,levelA,levelB,
  deckA:[],deckB:[],mode:'pvp',seed:803});
 for(const s of Object.values(b.sides)){
  s.hand=[];s.deck=Array(24).fill('gen-216');s.discard=[];
 }
 return b;
}
const other=(b,who)=>b.sides[who==='A'?'B':'A'];
const target=(kind,unit)=>({pass:false,targetKind:kind,targetId:unit.id,
 ...(kind==='part'?{partId:unit.id}:
  kind==='escort'?{escortSlot:unit.slot}:
  kind==='machine'?{machineSlot:unit.slot}:
  kind==='module'?{moduleSlot:unit.slot}:{})});
function play(b,who='A',hand=[],extra={pass:true},indices=null){
 b.turn=who;b.sides[who].hand=[...hand];
 const part=other(b,who).ships[0].parts.find(p=>p.hp>0&&!p.destroyed);
 const r=resolveFleetNextTurn(b,who,{cards:indices??hand.map((_,i)=>i),
  partId:part?.id,...extra},b.ply*30000+1000);
 assert.equal(r.ok,true,r.reason);
 return r;
}
function machine(id='machine:test',slot=0,hp=9,maxHp=hp){
 return {id,slot,name:'Macchina '+id,hp,maxHp,destroyed:false,
  sourceCardId:'prog-machine-striker',power:0,disabledUntilPly:0,jammedUntilPly:0};
}
function equip(side,id){
 const r=mountModule(side,card(id));
 assert.equal(r.ok,true,r.reason);return r.entry;
}
function shield(side,kind,unit,{charges=1,kindOfShield='protect',source='shield:test'}={}){
 side.defenses.push({id:'gen-227',source,hidden:false,untilPly:22});
 side.protections.push({id:'gen-227',source,kind:kindOfShield,remaining:charges,
  target:kind,escortSlot:kind==='escort'?unit.slot:null,
  machineSlot:kind==='machine'?unit.slot:null,
  untilPly:22,placedPly:-1});
}
test('L03 possiede 10 carte esclusive native con livelli 6,7,8,9,10 e i Personaggi/Boss restano',()=>{
 assert.equal(new Set(IDS).size,10);
 for(let level=1;level<=shipMaxLevel('L03');level++){
  assert.equal(eligibleExclusives('L03',level).filter(c=>IDS.includes(c.id)).length,(4+EXCLUSIVE_UNLOCK_MILESTONES['L03'].filter(n=>n<=level).length));
 }
 for(const id of IDS){
  const c=card(id);assert.ok(c,id);
  assert.equal(c.shipId,'L03');
  assert.equal(c.effectSpec.type,id==='nx-l03-08'?'counter':'obsidian');
  assert.notEqual(c.playable,false);assert.equal(cardFacePath(id),null);
  assert.equal(exclusiveUnlocked(id,'L03',shipMaxLevel('L03')),true);
  assert.equal(exclusiveUnlocked(id,'L01',5),false);
 }
 assert.equal(effectiveDeck([],'L03',shipMaxLevel('L03')).filter(id=>IDS.includes(id)).length,10);
 assert.equal(effectiveDeck([],'L03',5,{independentSupports:true}).includes('prog-fusion-l03'),false,
  'le fusioni storiche non sono pescabili nella battaglia ufficiale');
 assert.equal(Object.keys(BOSS_CARDS).length,12);
 assert.equal(Object.values(GENERAL_CARDS).filter(c=>c.kind==='character').length,12);
 assert.equal(Object.values(EXCLUSIVE_CARDS).filter(c=>c.kind==='character').length,12);
});
test('Ancoraggi d’assedio impedisce il ritiro delle macchine proprie finché operativo',()=>{
 const b=make();b.sides.A.machines.push(machine('own-machine'));
 equip(b.sides.A,'nx-l03-01');
 assert.ok(obsidianModuleActive(b.sides.A,'nx-l03-01',0));
 assert.equal(recallLinceMachine(b.sides.A,b.sides.A.machines[0],0),null);
 const old=b.sides.A.machines[0].id;
 removeModule(b.sides.A,'utility');
 const released=recallLinceMachine(b.sides.A,b.sides.A.machines[0],0);
 assert.equal(released?.id,old);
});
test('Tiro d’Assedio Ossidiano richiede un bersaglio macchina e conserva la carta fino al rilascio',()=>{
 const b=make();b.sides.B.machines.push(machine());
 const m=b.sides.B.machines[0],hp=m.hp;
 const p=play(b,'A',['nx-l03-02'],target('machine',m));
 assert.ok(p.battle.sides.A.obsidian.pending);
 assert.equal(p.battle.sides.A.obsidian.pending.releasePly,2);
 assert.equal(p.shot.machineDamage,0);
 assert.equal(p.battle.sides.B.machines[0].hp,hp);
 assert.equal(p.battle.sides.A.discard.includes('nx-l03-02'),false);
});
test('Tiro d’Assedio Ossidiano rilascia esattamente un colpo da tre nel turno successivo',()=>{
 let b=make();b.sides.B.machines.push(machine());
 b=play(b,'A',['nx-l03-02'],target('machine',b.sides.B.machines[0])).battle;
 b=play(b,'B',[],{pass:true}).battle;
 const hp=b.sides.B.machines[0].hp;
 const r=play(b,'A',[],{pass:true});
 assert.equal(r.shot.machineDamage,3);
 assert.equal(r.battle.sides.B.machines[0].hp,hp-3);
 assert.equal(r.events.filter(e=>e.kind==='obsidian-release').length,1);
 assert.equal(r.battle.sides.A.discard.includes('nx-l03-02'),true);
 assert.equal(r.battle.sides.A.obsidian.pending,null);
});
test('Obice ignora una sola protezione visibile; la seconda blocca ancora il colpo',()=>{
 let b=make();b.sides.B.machines.push(machine());
 const m=b.sides.B.machines[0];shield(b.sides.B,'machine',m);
 b=play(b,'A',['nx-l03-02'],target('machine',m)).battle;
 b=play(b,'B',[],{pass:true}).battle;
 let r=play(b,'A',[],{pass:true});
 assert.equal(r.shot.machineDamage,3);
 assert.ok(r.events.some(e=>e.kind==='obsidian-pierce'));
 b=make();b.sides.B.machines.push(machine());
 shield(b.sides.B,'machine',b.sides.B.machines[0],{source:'s1'});
 shield(b.sides.B,'machine',b.sides.B.machines[0],{source:'s2'});
 b=play(b,'A',['nx-l03-02'],target('machine',b.sides.B.machines[0])).battle;
 b=play(b,'B',[],{pass:true}).battle;
 r=play(b,'A',[],{pass:true});
 assert.equal(r.shot.machineDamage,0);
 assert.equal(r.events.filter(e=>e.kind==='obsidian-pierce').length,1);
});
test('Obice non converte una macchina distrutta in danno alla nave madre',()=>{
 let b=make();b.sides.B.machines.push(machine('small',0,1));
 const parts=b.sides.B.ships[0].parts.map(p=>p.hp);
 b=play(b,'A',['nx-l03-02'],target('machine',b.sides.B.machines[0])).battle;
 b=play(b,'B',[],{pass:true}).battle;
 const r=play(b,'A',[],{pass:true});
 assert.equal(r.shot.machineDamage,1);
 assert.equal(r.battle.sides.B.machines[0].destroyed,true);
 assert.deepEqual(r.battle.sides.B.ships[0].parts.map(p=>p.hp),parts);
});
test('Obice perso se la macchina sparisce prima del rilascio, senza nuovo bersaglio',()=>{
 let b=make();b.sides.B.machines.push(machine('a',0,6),machine('b',1,6));
 b=play(b,'A',['nx-l03-02'],target('machine',b.sides.B.machines[0])).battle;
 b.sides.B.machines[0].hp=0;b.sides.B.machines[0].destroyed=true;
 b=play(b,'B',[],{pass:true}).battle;
 const hp=b.sides.B.machines[1].hp;
 const r=play(b,'A',[],{pass:true});
 assert.equal(r.shot.machineDamage,0);
 assert.equal(r.battle.sides.B.machines[1].hp,hp);
 assert.ok(r.events.some(e=>e.kind==='obsidian-lost'));
});
test('Portelli sigillati vieta il bersagliamento dei moduli, ma non dei supporti',()=>{
 let b=make();equip(b.sides.A,'nx-l03-01');
 b=play(b,'A',['nx-l03-09'],{pass:true}).battle;
 const own=b.sides.A;
 assert.equal(obsidianSealed(own,b.ply),true);
 assert.equal(availableFleetTargets(own,b.ply).some(x=>x.kind==='module'),false);
 const targetModule=own.modules.utility;
 b.sides.B.hand=[];
 const reject=resolveFleetNextTurn(b,'B',{cards:[],...target('module',targetModule)},1000);
 assert.equal(reject.ok,false);assert.match(reject.reason,/Portelli sigillati/);
 const normal=play(b,'B',[],target('escort',own.escorts[0]));
 assert.equal(normal.ok,true);
 assert.equal(obsidianSealed(normal.battle.sides.A,normal.battle.ply),false);
});
test('Frattura d’assedio continua a rispettare una Difesa scoperta che blocca',()=>{
 const b=make();const e=b.sides.B.escorts[0],hp=e.hp;shield(b.sides.B,'escort',e);
 const r=play(b,'A',['nx-l03-03'],target('escort',e));
 assert.equal(r.shot.escortDamage,0);assert.equal(r.battle.sides.B.escorts[0].hp,hp);
});
test('Frattura neutralizza la corazza se aveva una Difesa dichiarata ma disattivata dal Terreno',()=>{
 const b=make({shipB:'R04'});
 b.terrain={id:'T01',source:'campaign',expiresPly:null};
 b.sides.B.machines.push(machine('visible-machine',0,10));
 const m=b.sides.B.machines[0];
 // Schivata scoperta non funzionante in Distesa Gelida.
 shield(b.sides.B,'machine',m,{kindOfShield:'dodge'});
 const r=play(b,'A',['nx-l03-03'],target('machine',m));
 assert.equal(r.shot.machineDamage,4); // Base 2 + corazza di R04 2
 assert.ok(r.events.some(e=>e.kind==='obsidian-armor'&&e.cardId==='nx-l03-03'));
});
test('Rampa di sfondamento ignora corazza una volta senza superare protezioni',()=>{
 const b=make({shipB:'R04'});b.sides.B.machines.push(machine('plate',0,10));
 equip(b.sides.A,'nx-l03-06');
 const r=play(b,'A',[],target('machine',b.sides.B.machines[0]));
 assert.equal(r.shot.machineDamage,4);
 assert.ok(r.events.some(e=>e.kind==='obsidian-armor'&&e.cardId==='nx-l03-06'));
});
test('Rampa non ignora una difesa scoperta che blocca il colpo',()=>{
 const b=make({shipB:'R04'});b.sides.B.machines.push(machine());
 equip(b.sides.A,'nx-l03-06');
 shield(b.sides.B,'machine',b.sides.B.machines[0]);
 const hp=b.sides.B.machines[0].hp;
 const r=play(b,'A',[],target('machine',b.sides.B.machines[0]));
 assert.equal(r.shot.machineDamage,0);
 assert.equal(r.battle.sides.B.machines[0].hp,hp);
 assert.equal(r.battle.sides.A.obsidian.rampUsedPly,-999);
});
test('Paratia d’ossidiana lascia passare il primo attacco normale sul vitale',()=>{
 let b=make();const part=b.sides.A.ships[0].parts.find(p=>p.id==='command'),hp=part.hp;
 b=play(b,'A',['nx-l03-04'],{pass:true,obsidianPartId:'command'}).battle;
 const r=play(b,'B',['prog-bypass'],target('part',part));
 assert.equal(r.battle.sides.A.ships[0].parts.find(p=>p.id==='command').hp,hp-1);
 assert.equal(r.events.some(e=>e.secondHitBlocked),false);
 // La Difesa scade correttamente dopo il turno avversario, non permane.
 assert.equal(r.battle.sides.A.defenses.some(d=>d.id==='nx-l03-04'),false);
});
test('Paratia registra il primo colpo, annulla solo il secondo e non il terzo',()=>{
 const d={id:'nx-l03-04',obsidianPartId:'command',untilPly:2,
  obsidianSeenPly:-999,obsidianBlockedPly:-999};
 assert.equal(obsidianBulkheadTryHit(d,1,'weapons'),false);
 assert.equal(obsidianBulkheadTryHit(d,1,'command'),false);
 assert.equal(obsidianBulkheadTryHit(d,1,'command'),true);
 assert.equal(obsidianBulkheadTryHit(d,1,'command'),false);
 assert.equal(obsidianBulkheadTryHit(d,2,'command'),false);
 assert.equal(d.obsidianBlockedPly,1);
});
test('Magistro scambia due carte dopo il blocco di una Difesa scoperta, senza pescare',()=>{
 let b=make();b=play(b,'A',['ex-l03-01'],{pass:true,obsidianMagisterSwap:true}).battle;
 b.sides.A.deck=['gen-217','gen-218','gen-235'];
 shield(b.sides.A,'escort',b.sides.A.escorts[0]);
 const hp=b.sides.A.escorts[0].hp;
 const r=play(b,'B',[],target('escort',b.sides.A.escorts[0]));
 const e=r.events.find(e=>e.kind==='obsidian-magister');
 assert.ok(e);assert.equal(e.flipped,true);
 assert.equal(e.drawn,0);assert.equal(e.seenCount,2);
 assert.deepEqual(r.battle.sides.A.deck.slice(0,2),['gen-218','gen-217']);
 assert.equal(r.battle.sides.A.escorts[0].hp,hp);
});
test('Magistro non riordina quando la Difesa riduce ma lascia passare il colpo',()=>{
 let b=make();b=play(b,'A',['ex-l03-01'],{pass:true,obsidianMagisterSwap:true}).battle;
 const hp=b.sides.A.escorts[0].hp;
 const r=play(b,'B',[],target('escort',b.sides.A.escorts[0]));
 assert.ok(r.battle.sides.A.escorts[0].hp<hp);
 assert.equal(r.events.some(e=>e.kind==='obsidian-magister'),false);
});
test('Catene di posizione blocca il ritiro della macchina nemica dopo preparazione Falco',()=>{
 let b=make({shipB:'R01'});
 b.sides.B.machines.push(machine('falco-machine'));
 b=play(b,'A',['nx-l03-07'],{pass:true,
  obsidianChainMachineId:'falco-machine'}).battle;
 const targetUnit=b.sides.A.escorts[0];
 const r=play(b,'B',['nx-r01-02'],target('escort',targetUnit));
 assert.ok(r.events.some(e=>e.kind==='trap-reveal'&&e.cardId==='nx-l03-07'));
 const m=r.battle.sides.B.machines[0];
 assert.equal(m.obsidianChainUntilPly,3);
 assert.equal(recallLinceMachine(r.battle.sides.B,m,2),null);
 assert.ok(recallLinceMachine(r.battle.sides.B,m,3));
});
test('Catene non scatta sugli attacchi ordinari e resta coperta',()=>{
 let b=make({shipB:'R01'});b.sides.B.machines.push(machine());
 b=play(b,'A',['nx-l03-07'],{pass:true,
  obsidianChainMachineId:b.sides.B.machines[0].id}).battle;
 const r=play(b,'B',[],target('escort',b.sides.A.escorts[0]));
 assert.equal(r.battle.sides.A.defenses.some(d=>d.id==='nx-l03-07'),true);
 assert.equal(r.events.some(e=>e.kind==='trap-reveal'&&e.cardId==='nx-l03-07'),false);
});
test('Falso bersaglio contro Obice annulla l’intera preparazione senza rimborso',()=>{
 let b=make({shipB:'E01'});b.sides.B.machines.push(machine());
 b=play(b,'A',['nx-l03-02'],target('machine',b.sides.B.machines[0])).battle;
 b=play(b,'B',['nx-e01-04'],{pass:true}).battle;
 const hp=b.sides.B.machines[0].hp;
 const r=play(b,'A',[],{pass:true});
 assert.equal(r.shot.machineDamage,0);
 assert.equal(r.battle.sides.B.machines[0].hp,hp);
 assert.ok(r.events.some(e=>e.kind==='trap-reveal'&&e.cardId==='nx-e01-04'));
 assert.equal(r.battle.sides.A.discard.includes('nx-l03-02'),true);
});
test('Il colpo prenotato occupa una delle tre giocate del turno di rilascio',()=>{
 let b=make();b.sides.B.machines.push(machine());
 b=play(b,'A',['nx-l03-02'],target('machine',b.sides.B.machines[0])).battle;
 b=play(b,'B',[],{pass:true}).battle;
 b.sides.A.hand=['gen-216','gen-217','gen-218'];
 const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{pass:true,cards:[0,1,2]},b.ply*30000+1000);
 assert.equal(r.ok,false);assert.match(r.reason,/prenotato/);
 assert.equal(JSON.stringify(b),before);
});
test('IA Titano sceglie la macchina per Obice e genera sempre un turno valido',()=>{
 const b=make();b.sides.B.machines.push(machine());
 b.sides.A.hand=['nx-l03-02','nx-l03-01'];
 const ai=autoFleetTurn(b,'A');
 const r=resolveFleetNextTurn(b,'A',ai,1000);
 assert.equal(r.ok,true,r.reason);
 assert.ok(r.events.some(e=>e.kind==='obsidian-prepare'));
});
