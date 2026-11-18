import {EXCLUSIVE_UNLOCK_MILESTONES} from './fleetNext/exclusiveUnlocks.js';
import {shipMaxLevel} from './fleetNext/progression.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {card,cardFacePath,eligibleExclusives,effectiveDeck,exclusiveUnlocked,
 BOSS_CARDS} from './fleetNext/rules.js';
import {createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn,
 effectUnavailableReason} from './fleetNext/combat.js';
import {mountModule,removeModule} from './fleetNext/auroraEngine.js';
import {recallLinceMachine} from './fleetNext/linceEngine.js';
import {ensureSharkState,sharkModuleActive,sharkPrecondition,
 sharkWoundedSupports} from './fleetNext/sharkEngine.js';

const IDS=['nx-r04-01','nx-r04-02','nx-r04-03','nx-r04-04','ex-r04-01',
 'nx-r04-06','nx-r04-07','nx-r04-08','nx-r04-09','nx-r04-10'];
function make({shipA='R04',shipB='C03',levelA=shipMaxLevel(shipA),levelB=shipMaxLevel(shipB)}={}){
 const b=createFleetNextBattle({shipA,shipB,levelA,levelB,
  deckA:[],deckB:[],mode:'pvp',seed:942});
 for(const s of Object.values(b.sides)){s.hand=[];s.deck=Array(24).fill('gen-216');s.discard=[];}
 return b;
}
const enemy=(b,who)=>b.sides[who==='A'?'B':'A'];
function target(kind,unit){
 return {pass:false,targetKind:kind,targetId:unit.id,
  ...(kind==='part'?{partId:unit.id}:kind==='escort'?{escortSlot:unit.slot}:
   kind==='machine'?{machineSlot:unit.slot}:{})};
}
function play(b,who='A',hand=[],extra={pass:true}){
 b.turn=who;b.sides[who].hand=[...hand];
 const dest=enemy(b,who).ships[0].parts.find(p=>p.hp>0&&!p.destroyed);
 const r=resolveFleetNextTurn(b,who,{cards:hand.map((_,i)=>i),
  partId:dest?.id,...extra},b.ply*30000+1000);
 assert.equal(r.ok,true,r.reason);
 return r;
}
function machine(id,slot,hp,maxHp=hp,sourceCardId='prog-machine-striker'){
 return {id,slot,name:'Torretta '+id,hp,maxHp,destroyed:false,power:0,
  sourceCardId,disabledUntilPly:0,jammedUntilPly:0};
}
function equip(side,id){
 const r=mountModule(side,card(id));
 assert.equal(r.ok,true,r.reason);return r.entry;
}
function shield(side,unit,charges=1){
 const source='shield:'+unit.id;
 side.defenses.push({id:'gen-071',source,hidden:false,untilPly:20});
 side.protections.push({id:'gen-071',source,kind:'protect',remaining:charges,
  target:'escort',escortSlot:unit.slot,untilPly:20});
}
test('Sette madri: Squalo R04 ha 10 carte native esclusive, 6 al L1 e una per livello',()=>{
 assert.equal(new Set(IDS).size,10);
 for(let level=1;level<=shipMaxLevel('R04');level++){
  const owned=eligibleExclusives('R04',level).filter(c=>IDS.includes(c.id));
  assert.equal(owned.length,4+EXCLUSIVE_UNLOCK_MILESTONES['R04'].filter(n=>n<=level).length);
 }
 for(const id of IDS){
  const c=card(id);assert.ok(c,id);
  assert.equal(c.shipId,'R04');assert.equal(c.effectSpec.type,'shark');
  assert.notEqual(c.playable,false);assert.equal(cardFacePath(id),null);
  assert.equal(exclusiveUnlocked(id,'C03',5),false);
  assert.equal(exclusiveUnlocked(id,'R04',shipMaxLevel('R04')),true);
  assert.equal(sharkPrecondition(c,{ships:[{id:'N00',level:5,parts:[]}]}),
   'Carta esclusiva dello Squalo del Vuoto');
 }
 assert.equal(effectiveDeck([],'R04',shipMaxLevel('R04')).filter(id=>IDS.includes(id)).length,10);
 assert.equal(Object.keys(BOSS_CARDS).length,12);
});
test('Corazza dentata fissa un bersaglio pubblico e contrattacca una sola volta',()=>{
 let b=make();const watched=b.sides.B.escorts[1];
 b=play(b,'A',['nx-r04-01'],{pass:true,sharkArmorKind:'escort',sharkArmorId:watched.id}).battle;
 assert.equal(b.sides.A.modules.utility.sharkTargetId,watched.id);
 const first=b.sides.A.escorts[0],before=watched.hp;
 const r=play(b,'B',[],target('escort',first));
 assert.equal(r.battle.sides.B.escorts[1].hp,before-1);
 assert.equal(r.events.filter(e=>e.kind==='shark-counter').length,1);
 assert.equal(r.battle.sides.A.shark.armorFiredPly,1);
});
test('Corazza dentata non reindirizza il controcolpo se il bersaglio fissato scompare',()=>{
 let b=make();const watched=b.sides.B.escorts[1];
 b=play(b,'A',['nx-r04-01'],{pass:true,sharkArmorKind:'escort',sharkArmorId:watched.id}).battle;
 b.sides.B.escorts[1].hp=0;b.sides.B.escorts[1].destroyed=true;
 const otherBefore=b.sides.B.escorts[0].hp;
 const r=play(b,'B',[],target('escort',b.sides.A.escorts[0]));
 assert.equal(r.battle.sides.B.escorts[0].hp,otherBefore);
 assert.equal(r.events.some(e=>e.kind==='shark-counter'),false);
});
test('Morso del Vuoto ignora una Difesa scoperta soltanto se un proprio supporto era ferito',()=>{
 let b=make();const victim=b.sides.B.escorts[0];shield(b.sides.B,victim);
 let r=play(b,'A',['nx-r04-02'],target('escort',victim));
 assert.equal(r.shot.escortDamage,0);
 b=make();b.sides.A.escorts[0].hp--;
 shield(b.sides.B,b.sides.B.escorts[0]);
 r=play(b,'A',['nx-r04-02'],target('escort',b.sides.B.escorts[0]));
 assert.ok(r.shot.escortDamage>0);
 assert.ok(r.events.some(e=>e.kind==='pierce'));
 assert.equal(r.battle.sides.B.protections.length,0);
});
test('Morso del Vuoto attraversa una sola difesa e non tutte quelle sovrapposte',()=>{
 const b=make();b.sides.A.escorts[0].hp--;
 const victim=b.sides.B.escorts[0];shield(b.sides.B,victim);
 b.sides.B.defenses.push({id:'gen-072',source:'second-shield',hidden:false,untilPly:20});
 b.sides.B.protections.push({id:'gen-072',source:'second-shield',kind:'protect',
  target:'escort',escortSlot:victim.slot,remaining:1,untilPly:20});
 const r=play(b,'A',['nx-r04-02'],target('escort',victim));
 assert.equal(r.shot.escortDamage,0);
 assert.equal(r.events.filter(e=>e.kind==='pierce').length,1);
 assert.equal(r.events.filter(e=>e.kind==='block').length,1);
});
test('Esca abissale sposta il solo bersaglio principale e consuma la difesa',()=>{
 let b=make();const first=b.sides.A.escorts[0],second=b.sides.A.escorts[1];
 b=play(b,'A',['nx-r04-03'],{pass:true,sharkDecoyKind:'escort',sharkDecoyId:second.id}).battle;
 const hpA=b.sides.A.escorts[0].hp,hpB=b.sides.A.escorts[1].hp;
 const r=play(b,'B',[],target('escort',b.sides.A.escorts[0]));
 assert.equal(r.battle.sides.A.escorts[0].hp,hpA);
 assert.ok(r.battle.sides.A.escorts[1].hp<hpB);
 assert.equal(r.events.filter(e=>e.kind==='shark-lure').length,1);
 assert.equal(r.battle.sides.A.defenses.some(d=>d.id==='nx-r04-03'),false);
});
test('Esca abissale non blocca Aggiramento verso la madre',()=>{
 let b=make();const parts=b.sides.A.ships[0].parts;
 b=play(b,'A',['nx-r04-03'],{pass:true,
  sharkDecoyKind:'escort',sharkDecoyId:b.sides.A.escorts[1].id}).battle;
 const part=parts.find(p=>p.id==='weapons'),before=part.hp;
 const r=play(b,'B',['prog-bypass'],target('part',part));
 assert.equal(r.battle.sides.A.ships[0].parts.find(p=>p.id==='weapons').hp,before-1);
 assert.equal(r.events.some(e=>e.kind==='shark-lure'),false);
});
test('Denti di ritorno rivela due bersagli fissati quando un attacco distrugge una macchina',()=>{
 let b=make();const [first,second]=b.sides.B.escorts;
 b.sides.A.machines.push(machine('m:A:break',0,1,3));
 b=play(b,'A',['nx-r04-04'],{pass:true,
  sharkTeethFirstKind:'escort',sharkTeethFirstId:first.id,
  sharkTeethSecondKind:'escort',sharkTeethSecondId:second.id}).battle;
 const hp=b.sides.B.escorts.map(e=>e.hp);
 const r=play(b,'B',[],target('machine',b.sides.A.machines[0]));
 assert.ok(r.battle.sides.A.machines[0].destroyed);
 assert.deepEqual(r.battle.sides.B.escorts.map(e=>e.hp),hp.map(n=>n-1));
 assert.equal(r.events.filter(e=>e.kind==='trap-reveal'&&e.cardId==='nx-r04-04').length,1);
 assert.equal(r.events.filter(e=>e.kind==='shark-counter').length,2);
});
test('Siluro di ritorsione paga il sacrificio anche se il bersaglio blocca il colpo',()=>{
 const b=make();b.sides.A.machines.push(machine('m:A:cost',0,2,6));
 const victim=b.sides.B.escorts[0];shield(b.sides.B,victim);
 const r=play(b,'A',['nx-r04-06'],{...target('escort',victim),
  sharkTorpedoMachineId:'m:A:cost'});
 assert.equal(r.shot.escortDamage,0);
 assert.ok(r.battle.sides.A.machines[0].destroyed);
 assert.equal(r.battle.sides.A.discard.filter(x=>x==='prog-machine-striker').length,1);
 assert.ok(r.events.some(e=>e.kind==='card'&&e.sacrificed));
});
test('Siluro da 3 danni: niente colpi extra e nessuna trappola da sacrificio volontario',()=>{
 let b=make();b.sides.A.machines.push(machine('m:A:cost',0,2,5));
 b.sides.A.defenses.push({id:'nx-r04-04',source:'trap:alive',
  hidden:true,untilPly:null,armedAtPly:-1,trigger:'shark-machine-destroyed',
  sharkTeethTargets:[{kind:'escort',id:b.sides.B.escorts[0].id},
   {kind:'escort',id:b.sides.B.escorts[1].id}]});
 const v=b.sides.B.escorts[0],before=v.hp;
 const r=play(b,'A',['nx-r04-06'],target('escort',v));
 assert.equal(r.shot.escortDamage,Math.min(3,before));
 assert.equal(r.battle.sides.A.defenses.some(x=>x.id==='nx-r04-04'),true);
 assert.equal(r.events.some(e=>e.kind==='trap-reveal'),false);
});
test('Arpione predatorio ferisce una macchina Lince e ne vieta il ritiro per un turno',()=>{
 const b=make({shipB:'C01'});
 b.sides.B.machines.push(machine('m:B:withdraw',0,7,7));
 equip(b.sides.A,'nx-r04-07');
 const unit=b.sides.B.machines[0];
 const r=play(b,'A',[],target('machine',unit));
 const victim=r.battle.sides.B.machines[0];
 assert.ok(victim.hp<victim.maxHp&&victim.hp>0);
 assert.equal(victim.sharkAnchorUntilPly,2);
 assert.equal(recallLinceMachine(r.battle.sides.B,victim,1),null);
 assert.notEqual(recallLinceMachine(r.battle.sides.B,victim,2),null);
});
test('Un modulo Arpione disattivato non applica il vincolo e la fusione resta possibile',()=>{
 const b=make({shipB:'C01'});
 b.sides.B.machines.push(machine('m:B:withdraw',0,7,7));
 const module=equip(b.sides.A,'nx-r04-07');
 module.disabledUntilPly=5;
 const r=play(b,'A',[],target('machine',b.sides.B.machines[0]));
 assert.equal(r.battle.sides.B.machines[0].sharkAnchorUntilPly,undefined);
});
test('Scudo del predatore richiede una ferita e limita un solo colpo',()=>{
 let b=make({shipB:'R01'});
 assert.match(effectUnavailableReason(card('nx-r04-08'),b.sides.A,b),/supporto ferito/);
 b.sides.A.escorts[0].hp-=2;
 b=play(b,'A',['nx-r04-08'],{pass:true,
  sharkShieldEscortId:b.sides.A.escorts[0].id}).battle;
 b.sides.B.ships[0].attackPower=8;
 const hp=b.sides.A.escorts[0].hp;
 const r=play(b,'B',[],target('escort',b.sides.A.escorts[0]));
 assert.equal(r.battle.sides.A.escorts[0].hp,hp-1);
 assert.equal(r.battle.sides.A.defenses.some(d=>d.id==='nx-r04-08'),false);
 assert.ok(r.events.some(e=>e.kind==='block'&&e.cardId==='nx-r04-08'));
});
test('Risposta spietata vietata senza vera distruzione avversaria nell’ultimo turno',()=>{
 const b=make();const c=card('nx-r04-09');
 assert.match(effectUnavailableReason(c,b.sides.A,b),/distrutta/);
 b.sides.A.machines.push(machine('m:A:cost',0,2,6));
 const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[],pass:true,sharkTorpedoMachineId:'m:A:cost'},1000);
 assert.equal(r.ok,true);
 assert.equal(b.sides.A.shark,null);
 assert.equal(JSON.stringify(b),before);
});
test('Risposta spietata raggiunge un vitale oltre i supporti dopo una vera distruzione',()=>{
 let b=make();
 b.sides.A.machines.push(machine('m:A:lost',0,1,4));
 b=play(b,'B',[],target('machine',b.sides.A.machines[0])).battle;
 assert.equal(b.sides.A.shark.lastEnemyLossPly,0);
 const victim=b.sides.B.ships[0].parts.find(p=>p.id==='weapons'),hp=victim.hp;
 const r=play(b,'A',['nx-r04-09'],target('part',victim));
 assert.equal(r.battle.sides.B.ships[0].parts.find(p=>p.id==='weapons').hp,hp-1);
 assert.equal(r.shot.damage,1);
 assert.equal(r.shot.escortDamage,0);
});
test('Ultimo morso consuma un supporto ferito, ripara l’altro fino al massimo e pesca una carta',()=>{
 const b=make();
 const [first,second]=b.sides.A.escorts;
 first.hp-=2;second.hp-=3;
 const before=second.hp;
 b.sides.A.deck=['gen-216'];
 const r=play(b,'A',['nx-r04-10'],{pass:true,
  sharkSacrificeEscortId:first.id,sharkRecipientEscortId:second.id});
 assert.equal(r.battle.sides.A.escorts[0].destroyed,true);
 assert.equal(r.battle.sides.A.escorts[1].hp,before+2);
 assert.equal(r.battle.sides.A.hand.includes('gen-216'),true);
 assert.ok(r.events.some(e=>e.kind==='shark-sacrifice'&&e.drawnCardId==='gen-216'));
 assert.equal(r.battle.sides.A.shark.lastEnemyLossPly,-999);
});
test('Ultimo morso rifiuta richiesta impossibile senza consumare mano o unità',()=>{
 const b=make();
 b.sides.A.hand=['nx-r04-10'];
 const snapshot=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[0],pass:true},1000);
 assert.equal(r.ok,false);assert.match(r.reason,/supporti|feriti/);
 assert.equal(JSON.stringify(b),snapshot);
});
test('Ammiraglio ripara una unità sopravvissuta sacrificando una vera carta della mano',()=>{
 let b=make();
 b=play(b,'A',['ex-r04-01','gen-216'],{pass:true,cards:[0],
  sharkAdmiralEnabled:true,sharkAdmiralDiscardId:'gen-216'}).battle;
 const hp=b.sides.A.escorts[0].hp;
 const r=play(b,'B',[],target('escort',b.sides.A.escorts[0]));
 assert.ok(r.events.some(e=>e.kind==='repair'&&e.cardId==='ex-r04-01'));
 assert.ok(r.battle.sides.A.discard.includes('gen-216'));
 assert.ok(r.battle.sides.A.escorts[0].hp<=hp);
 assert.equal(r.events.filter(e=>e.kind==='repair'&&e.cardId==='ex-r04-01').length,1);
});
test('Ammiraglio non rianima una unità distrutta e non scarta la carta',()=>{
 let b=make();
 b=play(b,'A',['ex-r04-01','gen-216'],{pass:true,cards:[0],
  sharkAdmiralDiscardId:'gen-216'}).battle;
 b.sides.A.escorts[0].hp=1;
 const r=play(b,'B',[],target('escort',b.sides.A.escorts[0]));
 assert.equal(r.battle.sides.A.escorts[0].destroyed,true);
 assert.ok(!r.events.some(e=>e.kind==='repair'&&e.cardId==='ex-r04-01'));
 assert.ok(!r.battle.sides.A.discard.includes('gen-216'));
});
test('Il catalogo Squalo conserva i 12 Boss e gli altri Personaggi',async()=>{
 const {GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS}=await import('./fleetNext/rules.js');
 assert.equal(Object.values(GENERAL_CARDS).filter(c=>c.kind==='character').length,12);
 assert.equal(Object.values(EXCLUSIVE_CARDS).filter(c=>c.kind==='character').length,17);
 assert.equal(Object.keys(BOSS_CARDS).length,12);
});
