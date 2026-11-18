import test from 'node:test';
import assert from 'node:assert/strict';
import {SUPPORT_MAX_LEVEL} from './fleetNext/supportProgression.js';
import {supportModelIdFor} from './fleetNext/supportCatalog.js';
import {HP_SYNC_RULESET} from './fleetNext/hpSynchronization.js';
import {card,cardCopyLimit,effectiveDeck} from './fleetNext/rules.js';
import {arkPrecondition} from './fleetNext/arkEngine.js';
import {obsidianFusedEscort,obsidianPrecondition} from './fleetNext/obsidianEngine.js';
import {createFleetNextBattle,resolveFleetNextTurn,autoFleetTurn,
 effectUnavailableReason,validateFleetTurn,fusionShipUnavailableReason,
 fuseIndependentSupportWithShip} from './fleetNext/combat.js';

const roster=()=>[
 {id:supportModelIdFor('N00'),instanceId:'guard:one',slot:0,level:SUPPORT_MAX_LEVEL},
 {id:supportModelIdFor('C03'),instanceId:'guard:two',slot:1,level:SUPPORT_MAX_LEVEL}
];
const game=(mother='L04')=>createFleetNextBattle({
 shipA:mother,levelA:5,shipB:'C03',levelB:5,deckA:[],deckB:[],
 ruleset:HP_SYNC_RULESET,mode:'pvp',supportRosterA:roster(),
 supportRosterB:roster(),seed:442,nowMs:0
});
const take=(b,side,hand,order,ms)=>{
 b.sides[side].hand=hand;
 const result=resolveFleetNextTurn(b,side,{cards:hand.map((_,i)=>i),pass:true,...order},ms);
 assert.equal(result.ok,true,result.reason);
 return result.battle;
};

test('La Custodia Arca non si trasferisce al supporto fuso tramite il nuovo ID',()=>{
 const b=game(),s=b.sides.A,initial=s.escorts[0];
 s.defenses.push({id:'nx-l04-03',source:'custody-test',hidden:false,
  arkCustodyEscortId:initial.id,untilPly:10});
 s.protections.push({id:'nx-l04-03',source:'custody-test',target:'escort',
  escortSlot:0,remaining:1,untilPly:10});
 const result=fuseIndependentSupportWithShip(s,'R01',0,b.ply);
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.fused.fused,true);
 assert.equal(s.escorts.length,2);
 assert.equal(s.defenses.some(x=>x.id==='nx-l04-03'),false);
 assert.equal(s.protections.some(x=>x.id==='nx-l04-03'),false);
 assert.equal(s.discard.includes('nx-l04-03'),true);
});

test('Ingresso protetto Arca si arma per la fusione reale e blocca un solo colpo',()=>{
 let b=game();
 assert.equal(arkPrecondition(card('nx-l04-08'),b.sides.A,b),'');
 b=take(b,'A',['nx-l04-08'],{},1000);
 assert.equal(b.sides.A.defenses.some(d=>d.id==='nx-l04-08'&&d.hidden),true);
 b=take(b,'B',[],{},2000);
 b=take(b,'A',['fusion-ship-r01'],{fusionSlot:0},3000);
 const fused=b.sides.A.escorts[0];
 assert.equal(fused.fused,true);
 assert.equal(b.sides.A.escorts.length,2);
 const hp=fused.hp;
 assert.equal(b.sides.A.defenses.find(d=>d.id==='nx-l04-08').arkReserveId,fused.id);
 b=take(b,'B',[],{pass:false,targetKind:'escort',
  targetId:fused.id,escortSlot:0,partId:'weapons'},4000);
 assert.equal(b.sides.A.escorts[0].hp,hp);
 assert.equal(b.sides.A.defenses.some(d=>d.id==='nx-l04-08'),false);
 assert.equal(b.sides.A.discard.includes('nx-l04-08'),true);
});

test('Titano Ossidiana usa la Sentenza con qualsiasi supporto fuso L5',()=>{
 const b=game('L03'),side=b.sides.A;
 assert.equal(obsidianFusedEscort(side,b.ply),null);
 const result=fuseIndependentSupportWithShip(side,'R01',0,b.ply);
 assert.equal(result.ok,true,result.reason);
 assert.equal(result.fused.obsidianBastion,true);
 assert.equal(obsidianFusedEscort(side,b.ply)?.id,result.fused.id);
 assert.equal(obsidianPrecondition(card('nx-l03-10'),side,b),'');
 assert.equal(side.escorts.length,2);
 assert.equal(side.fusionsUsed,1);
});

test('Le tre vecchie carte materne non sono più Fusione e le nuove sono indipendenti',()=>{
 const replacements={L01:['nx-l01-10','protect'],L03:['nx-l03-08','counter'],
  L04:['nx-l04-05','exchange']};
 for(const [shipId,[id,type]] of Object.entries(replacements)){
  assert.equal(card(id).effectSpec.type,type);
  assert.equal(cardCopyLimit(id),1);
  assert.equal(effectiveDeck([],shipId,5).filter(x=>x===id).length,1);
  assert.equal(effectiveDeck([],shipId,5).some(x=>x.startsWith('prog-fusion-')),false);
 }
});

test('Due supporti L5 si fondono nei propri slot senza recuperare HP, per tutte e tre le leggende',()=>{
 for(const mother of ['L01','L03','L04']){
  const b=game(mother),s=b.sides.A;
  s.escorts[0].hp-=2;s.escorts[1].hp-=1;
  const before=s.escorts.map(e=>({hp:e.hp,maxHp:e.maxHp}));
  const one=fuseIndependentSupportWithShip(s,'R01',0);
  assert.equal(one.ok,true,mother+' prima: '+one.reason);
  const two=fuseIndependentSupportWithShip(s,'C02',1);
  assert.equal(two.ok,true,mother+' seconda: '+two.reason);
  assert.deepEqual(s.escorts.map(e=>({hp:e.hp,maxHp:e.maxHp})),before);
  assert.deepEqual(s.escorts.map(e=>e.slot),[0,1]);
  assert.equal(s.escorts.length,2);
  assert.equal(s.reserveEscorts.length,0);
  assert.equal(s.fusionsUsed,2);
  assert.ok(s.escorts.every(e=>e.fused&&e.supportSkillIds.length===2));
  const snapshot=JSON.stringify(s);
  assert.match(fusionShipUnavailableReason(s,'R04',0),/già state utilizzate/);
  assert.equal(fuseIndependentSupportWithShip(s,'R04',0).ok,false);
  assert.equal(JSON.stringify(s),snapshot,'una terza Fusione non modifica le unità');
 }
});

test('Due Carte Navicella Fusione non possono essere spese nello stesso turno',()=>{
 const b=game();
 b.sides.A.hand=['fusion-ship-r01','fusion-ship-c02'];
 const original=JSON.stringify(b);
 const reason=validateFleetTurn(b,'A',{cards:[0,1],fusionSlot:0,pass:true});
 assert.match(reason,/una Carta Navicella Fusione per turno/);
 assert.equal(JSON.stringify(b),original);
});

test('Risonanza Arca può usare un supporto fuso liberamente e uno ancora integro',()=>{
 let b=game(),side=b.sides.A;
 const fused=fuseIndependentSupportWithShip(side,'R01',0);
 assert.equal(fused.ok,true,fused.reason);
 assert.equal(effectUnavailableReason(card('nx-l04-09'),side,b),'');
 const waiting=side.escorts[1];
 b=take(b,'A',['nx-l04-09'],{arkFusedId:fused.fused.id,
  arkResonanceEscortId:waiting.id},1000);
 assert.equal(b.sides.A.defenses.some(d=>d.id==='nx-l04-09'&&
  d.arkFusedId===fused.fused.id&&d.arkOtherId===waiting.id),true);
});

test('Convergenza Astrale spara due colpi distinti soltanto dopo la doppia Fusione',()=>{
 const b=game(),side=b.sides.A;
 const first=fuseIndependentSupportWithShip(side,'R01',0);
 assert.equal(first.ok,true,first.reason);
 assert.match(effectUnavailableReason(card('nx-l04-10'),side,b),/due Fusioni/);
 const second=fuseIndependentSupportWithShip(side,'C02',1);
 assert.equal(second.ok,true,second.reason);
 assert.equal(effectUnavailableReason(card('nx-l04-10'),side,b),'');
 const [e1,e2]=b.sides.B.escorts,beforeHP=[e1.hp,e2.hp];
 const motherHP=b.sides.B.ships[0].hp;
 side.hand=['nx-l04-10'];
 const r=resolveFleetNextTurn(b,'A',{cards:[0],pass:false,targetKind:'escort',
  targetId:e1.id,escortSlot:e1.slot,arkSecondKind:'escort',arkSecondId:e2.id},1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.shot.targets.length,2);
 assert.ok(r.shot.escortDamage>0);
 assert.ok(r.battle.sides.B.escorts[0].hp<beforeHP[0]);
 assert.ok(r.battle.sides.B.escorts[1].hp<beforeHP[1]);
 assert.equal(r.battle.sides.B.ships[0].hp,motherHP);
});

test('Sentenza del Titano prepara due colpi senza richiamare riserve o unità extra',()=>{
 let b=game('L03');
 const fuse=fuseIndependentSupportWithShip(b.sides.A,'R01',0);
 assert.equal(fuse.ok,true,fuse.reason);
 const enemy=b.sides.B.escorts[0];
 const enemyHP=enemy.hp;
 b=take(b,'A',['nx-l03-10'],{pass:false,targetKind:'escort',
  targetId:enemy.id,escortSlot:enemy.slot},1000);
 assert.equal(b.sides.A.obsidian.pending?.shots,2);
 assert.equal(b.sides.B.escorts[0].hp,enemyHP);
 b=take(b,'B',[],{},2000);
 b.sides.A.hand=[];
 const release=resolveFleetNextTurn(b,'A',{cards:[],pass:true},3000);
 assert.equal(release.ok,true,release.reason);
 assert.ok(release.shot.escortDamage>0);
 assert.ok(release.battle.sides.B.escorts[0].hp<enemyHP);
 assert.equal(release.battle.sides.A.escorts.length,2);
});

test('Bastione del Titano usa una difesa scelta dopo una fusione indipendente',()=>{
 let b=game('L03'),side=b.sides.A;
 const fusion=fuseIndependentSupportWithShip(side,'C02',0);
 assert.equal(fusion.ok,true,fusion.reason);
 const hp=side.escorts[0].hp;
 b=take(b,'A',[],{obsidianGuard:true},1000);
 assert.equal(b.sides.A.escorts[0].obsidianGuardUntilPly,2);
 b.sides.B.ships[0].attackPower=9;
 b.sides.B.hand=[];
 const enemyShot=resolveFleetNextTurn(b,'B',{cards:[],pass:false,
  targetKind:'escort',targetId:b.sides.A.escorts[0].id,escortSlot:0},2000);
 assert.equal(enemyShot.ok,true,enemyShot.reason);
 assert.ok(enemyShot.events.some(e=>e.kind==='obsidian-guard'&&e.limit===1));
 assert.ok(hp-enemyShot.battle.sides.A.escorts[0].hp<=1);
});

test('Velo della Corona resta una vera Difesa, non trasforma supporti in una fusione',()=>{
 let b=game('L01');
 b=take(b,'A',['nx-l01-10'],{},1000);
 assert.equal(b.sides.A.fusionsUsed,0);
 assert.equal(b.sides.A.escorts.length,2);
 assert.ok(b.sides.A.defenses.some(d=>d.id==='nx-l01-10'));
});

test('La IA sceglie soltanto azioni valide quando ha una Fusione per supporti L5',()=>{
 const b=game(),side=b.sides.A;
 side.hand=['fusion-ship-r01','nx-l04-03','nx-l04-02'];
 const plan=autoFleetTurn(b,'A');
 const r=resolveFleetNextTurn(b,'A',plan,1000);
 assert.equal(r.ok,true,r.reason);
 assert.ok(r.battle.sides.A.escorts.length===2);
 assert.ok(r.battle.sides.A.fusionsUsed<=1);
});
