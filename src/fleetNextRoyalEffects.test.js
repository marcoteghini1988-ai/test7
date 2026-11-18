import {EXCLUSIVE_UNLOCK_MILESTONES} from './fleetNext/exclusiveUnlocks.js';
import {shipMaxLevel} from './fleetNext/progression.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
 card,cardFacePath,eligibleExclusives,effectiveDeck,exclusiveUnlocked,
 GENERAL_CARDS,EXCLUSIVE_CARDS,BOSS_CARDS
} from './fleetNext/rules.js';
import {
 createFleetNextBattle,resolveFleetNextTurn,autoFleetTurn,
 effectUnavailableReason,protectingFleetUnits
} from './fleetNext/combat.js';
import {mountModule} from './fleetNext/auroraEngine.js';
import {royalSupports,royalVisibleProtections,royalCapableModule} from './fleetNext/royalEngine.js';

const IDS=['nx-l01-01','nx-l01-02','nx-l01-03','nx-l01-04','ex-l01-01',
 'nx-l01-06','nx-l01-07','nx-l01-08','nx-l01-09','nx-l01-10'];
function make({shipA='L01',shipB='C03',levelA=shipMaxLevel(shipA),levelB=shipMaxLevel(shipB)}={}){
 const b=createFleetNextBattle({shipA,shipB,levelA,levelB,
  deckA:[],deckB:[],mode:'pvp',seed:2130});
 for(const side of Object.values(b.sides)){
  side.hand=[];side.deck=Array(24).fill('gen-216');side.discard=[];
 }
 return b;
}
const enemy=(b,who)=>b.sides[who==='A'?'B':'A'];
function target(kind,unit){return {pass:false,targetKind:kind,targetId:unit.id,
 ...(kind==='part'?{partId:unit.id}:
  kind==='escort'?{escortSlot:unit.slot}:
  kind==='machine'?{machineSlot:unit.slot}:{})};}
function play(b,who='A',hand=[],options={pass:true},indices=null){
 b.turn=who;b.sides[who].hand=[...hand];
 const part=enemy(b,who).ships[0].parts.find(p=>p.hp>0&&!p.destroyed);
 const r=resolveFleetNextTurn(b,who,{
  cards:indices??hand.map((_,i)=>i),partId:part?.id,...options
 },b.ply*30000+1000);
 assert.equal(r.ok,true,r.reason);
 return r;
}
function equip(side,id){
 const x=mountModule(side,card(id));assert.equal(x.ok,true,x.reason);
 return x.entry;
}
function machine(id,slot=0,hp=6,maxHp=hp){
 return {id,slot,hp,maxHp,name:'Macchina '+id,power:0,
  sourceCardId:'prog-machine-striker',destroyed:false};
}
function revealedShield(side,escort,source='royal:test:shield',charges=1){
 side.defenses.push({id:'gen-227',source,hidden:false,untilPly:20});
 side.protections.push({id:'gen-227',source,kind:'protect',remaining:charges,
  target:'escort',escortSlot:escort.slot,untilPly:20});
 return source;
}
test('Eclisse Reale completa 10 esclusive al L7 e conserva la Fusione al L5',()=>{
 assert.equal(new Set(IDS).size,10);
 for(let level=1;level<=shipMaxLevel('L01');level++){
  assert.equal(eligibleExclusives('L01',level).filter(c=>IDS.includes(c.id)).length,(4+EXCLUSIVE_UNLOCK_MILESTONES['L01'].filter(n=>n<=level).length));
 }
 for(const id of IDS){
  const c=card(id);assert.ok(c,id);assert.equal(c.shipId,'L01');
  assert.equal(c.effectSpec.type,'royal');assert.equal(c.playable!==false,true);
  assert.equal(cardFacePath(id),null);
  assert.equal(exclusiveUnlocked(id,'L01',shipMaxLevel('L01')),true);
  assert.equal(exclusiveUnlocked(id,'E02',5),false);
 }
 assert.equal(effectiveDeck([],'L01',shipMaxLevel('L01')).filter(id=>IDS.includes(id)).length,10);
 assert.equal(effectiveDeck([],'L01',5).includes('prog-fusion-l01'),false);
 assert.ok(effectiveDeck([],'L01',5).includes('nx-l01-10'));
 assert.equal(Object.keys(BOSS_CARDS).length,12);
 assert.equal(Object.values(GENERAL_CARDS).filter(x=>x.kind==='character').length,12);
 assert.equal(Object.values(EXCLUSIVE_CARDS).filter(x=>x.kind==='character').length,17);
});
test('Relè della Corona: comando assegnato a un supporto senza creare secondo attacco',()=>{
 const b=make();equip(b.sides.A,'nx-l01-01');
 const first=b.sides.B.escorts[0],hp=first.hp;
 const r=play(b,'A',['nx-l01-02'],{...target('escort',first),
  royalRainMode:'heavy',royalRelay:true,
  royalRelayEscortId:b.sides.A.escorts[0].id});
 assert.equal(r.battle.sides.A.royal.lastRelayPly,0);
 assert.equal(r.shot.escortDamage,3);
 assert.equal(r.battle.sides.B.escorts[0].hp,hp-3);
 assert.equal(r.shot.targets.length,1);
 assert.equal(r.events.filter(e=>e.relayEscortId).length,1);
});
test('Il Relè senza modulo non può essere richiesto: nessuna carta viene spesa',()=>{
 const b=make();b.sides.A.hand=['nx-l01-02'];
 const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[0],...target('escort',b.sides.B.escorts[0]),
  royalRelay:true},1000);
 assert.equal(r.ok,false);
 assert.match(r.reason,/Relè/);
 assert.equal(JSON.stringify(b),before);
});
test('Pioggia reale pesante: un colpo da tre su una sola unità, non sulla madre',()=>{
 const b=make();const first=b.sides.B.escorts[0],hp=first.hp;
 const parts=b.sides.B.ships[0].parts.map(p=>p.hp);
 const r=play(b,'A',['nx-l01-02'],target('escort',first));
 assert.equal(r.shot.targets.length,1);
 assert.equal(r.shot.escortDamage,3);
 assert.equal(r.battle.sides.B.escorts[0].hp,hp-3);
 assert.deepEqual(r.battle.sides.B.ships[0].parts.map(p=>p.hp),parts);
 assert.ok(r.events.some(e=>e.kind==='royal-rain'&&e.mode==='heavy'));
});
test('Pioggia reale divisa: due danni reali su unità distinte, non due su una',()=>{
 const b=make();const [first,second]=b.sides.B.escorts;
 const h1=first.hp,h2=second.hp;
 const r=play(b,'A',['nx-l01-02'],{...target('escort',first),
  royalRainMode:'split',royalSecondKind:'escort',royalSecondId:second.id});
 assert.equal(r.shot.targets.length,2);
 assert.equal(r.shot.escortDamage,2);
 assert.equal(r.battle.sides.B.escorts[0].hp,h1-1);
 assert.equal(r.battle.sides.B.escorts[1].hp,h2-1);
});
test('Pioggia reale divisa non può scegliere due volte lo stesso bersaglio',()=>{
 const b=make();b.sides.A.hand=['nx-l01-02'];
 const first=b.sides.B.escorts[0],before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[0],...target('escort',first),
  royalRainMode:'split',royalSecondKind:'escort',royalSecondId:first.id},1000);
 assert.equal(r.ok,false);assert.match(r.reason,/secondo bersaglio/i);
 assert.equal(JSON.stringify(b),before);
});
test('Corona protettiva intercetta anche Aggiramento sulla Centralina, senza danno extra',()=>{
 let b=make();const protector=b.sides.A.escorts[0];
 b=play(b,'A',['nx-l01-03'],{pass:true,royalGuardEscortId:protector.id}).battle;
 const part=b.sides.A.ships[0].parts.find(p=>p.id==='command');
 const hp=part.hp,escortHP=b.sides.A.escorts[0].hp;
 const r=play(b,'B',['prog-bypass'],target('part',part));
 assert.equal(r.battle.sides.A.ships[0].parts.find(p=>p.id==='command').hp,hp);
 assert.equal(r.battle.sides.A.escorts[0].hp,escortHP-1);
 assert.ok(r.events.some(e=>e.kind==='royal-intercept'&&e.cardId==='nx-l01-03'));
 assert.equal(r.battle.sides.A.defenses.some(d=>d.id==='nx-l01-03'),false);
});
test('Corona protettiva non intercetta quando il supporto scelto è inattivo',()=>{
 let b=make();
 b=play(b,'A',['nx-l01-03'],{pass:true,
  royalGuardEscortId:b.sides.A.escorts[0].id}).battle;
 b.sides.A.escorts[0].disabledUntilPly=10;
 const part=b.sides.A.ships[0].parts.find(p=>p.id==='command'),hp=part.hp;
 const r=play(b,'B',['prog-bypass'],target('part',part));
 assert.equal(r.battle.sides.A.ships[0].parts.find(p=>p.id==='command').hp,hp-1);
 assert.ok(!r.events.some(e=>e.kind==='royal-intercept'));
});
test('Decreto di interdizione blocca realmente il ritiro del modulo Lince, non il colpo',()=>{
 let b=make({shipB:'C01'});
 const module=equip(b.sides.B,'nx-c01-07');
 module.hp=1;
 b=play(b,'A',['nx-l01-04'],{pass:true}).battle;
 const victim=b.sides.A.escorts[0],hp=victim.hp;
 const r=play(b,'B',['nx-c01-09'],{...target('escort',victim),linceRecallWeapon:true});
 assert.ok(r.battle.sides.A.escorts[0].hp<hp);
 assert.equal(r.battle.sides.B.modules.weapon?.id,module.id);
 assert.ok(r.events.some(e=>e.kind==='trap-reveal'&&e.cardId==='nx-l01-04'));
 assert.equal(r.battle.sides.A.defenses.some(d=>d.id==='nx-l01-04'),false);
});
test('Decreto non si attiva sulla Fusione avversaria',()=>{
 let b=make({shipB:'L03'});
 b=play(b,'A',['nx-l01-04'],{pass:true}).battle;
 const r=play(b,'B',['prog-fusion-l03'],{pass:true});
 assert.equal(r.battle.sides.B.fusionsUsed,1);
 assert.equal(r.battle.sides.A.defenses.some(d=>d.id==='nx-l01-04'),true);
});
test('Sovrano sceglie una delle prime tre, scarta una carta vera e mette le due restanti in fondo',()=>{
 const b=make();b.sides.A.deck=['gen-217','gen-218','gen-235',
  ...Array(15).fill('gen-216')];
 const r=play(b,'A',['ex-l01-01','gen-226'],{
  pass:true,royalSovereignTrade:true,royalDiscardId:'gen-226',
  royalPickId:'gen-218'},[0]);
 const e=r.events.find(e=>e.kind==='royal-sovereign');
 assert.ok(e);assert.equal(e.discardedCardId,'gen-226');
 assert.equal(e.drawnCardId,'gen-218');assert.equal(e.viewedCount,3);
 assert.equal(e.bottomCount,2);assert.equal(e.netCards,0);
 assert.equal(r.battle.sides.A.royal.lastSovereignPly,0);
 assert.equal(r.battle.sides.A.discard.includes('gen-226'),true);
});
test('Sovrano non può ricambiare senza due supporti; il turno invalido è immutabile',()=>{
 const b=make();b.sides.A.escorts[1].hp=0;
 b.sides.A.escorts[1].destroyed=true;
 b.sides.A.hand=['ex-l01-01','gen-226'];
 const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[0],pass:true,
  royalSovereignTrade:true,royalDiscardId:'gen-226'},1000);
 assert.equal(r.ok,false);assert.match(r.reason,/supporti/i);
 assert.equal(JSON.stringify(b),before);
});
test('Ordine incrociato trasferisce cariche e scambia bersagli di abilità compatibili, non HP',()=>{
 const b=make();const [first,second]=b.sides.A.escorts;
 first.skill.targetPart='weapons';second.skill.targetPart='generator';
 const token=revealedShield(b.sides.A,first,'source:cross',2);
 const hp=b.sides.A.escorts.map(e=>e.hp);
 const r=play(b,'A',['nx-l01-06'],{pass:true,
  royalSourceToken:token,royalDestinationEscortId:second.id});
 const transferred=r.battle.sides.A.protections.find(p=>p.source===token);
 assert.ok(transferred);assert.equal(transferred.remaining,2);
 assert.equal(transferred.escortSlot,second.slot);
 assert.equal(r.battle.sides.A.escorts[0].skill.targetPart,'generator');
 assert.equal(r.battle.sides.A.escorts[1].skill.targetPart,'weapons');
 assert.deepEqual(r.battle.sides.A.escorts.map(e=>e.hp),hp);
 assert.ok(r.events.some(e=>e.cardId==='nx-l01-06'&&e.abilityTargetsSwapped));
});
test('Ordine incrociato senza una protezione scoperta non si gioca',()=>{
 const b=make();b.sides.A.hand=['nx-l01-06'];const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[0],pass:true},1000);
 assert.equal(r.ok,false);assert.match(r.reason,/Difesa scoperta/i);
 assert.equal(JSON.stringify(b),before);
});
test('Lancia regale: dopo comando del supporto, il primo colpo madre ignora una Difesa',()=>{
 const b=make();
 equip(b.sides.A,'nx-l01-07');
 revealedShield(b.sides.A,b.sides.A.escorts[0],'ally:shield',2);
 const foe=b.sides.B.escorts[0],hp=foe.hp;
 revealedShield(b.sides.B,foe,'foe:shield',1);
 const r=play(b,'A',['nx-l01-06'],{...target('escort',foe),
  royalSourceToken:'ally:shield',royalDestinationEscortId:b.sides.A.escorts[1].id});
 assert.ok(r.battle.sides.B.escorts[0].hp<hp);
 assert.equal(r.events.filter(e=>e.kind==='royal-lance').length,1);
 assert.equal(r.battle.sides.A.royal.lastLancePly,0);
 assert.equal(r.battle.sides.B.protections.length,0);
});
test('Lancia regale senza comando precedente non ignora Difese né aggiunge colpi',()=>{
 const b=make();equip(b.sides.A,'nx-l01-07');
 const foe=b.sides.B.escorts[0],hp=foe.hp;
 revealedShield(b.sides.B,foe,'foe:shield');
 const r=play(b,'A',[],target('escort',foe));
 assert.equal(r.shot.escortDamage,0);
 assert.equal(r.battle.sides.B.escorts[0].hp,hp);
 assert.ok(!r.events.some(e=>e.kind==='royal-lance'));
});
test('Bastione reale divide un solo colpo 3 punti in 2+1 tra due supporti',()=>{
 let b=make();const [first,second]=b.sides.A.escorts;
 b=play(b,'A',['nx-l01-08'],{pass:true,royalBastionEscortId:first.id}).battle;
 b.sides.B.ships[0].attackPower=4; // Difesa madre L5 = 1: potenza netta 3
 const [hp1,hp2]=b.sides.A.escorts.map(e=>e.hp);
 const r=play(b,'B',[],target('escort',b.sides.A.escorts[0]));
 assert.equal(r.battle.sides.A.escorts[0].hp,hp1-2);
 assert.equal(r.battle.sides.A.escorts[1].hp,hp2-1);
 assert.equal(r.shot.escortDamage,3);
 assert.ok(r.events.some(e=>e.kind==='royal-split'&&e.damage===3));
 assert.equal(r.battle.sides.A.defenses.some(d=>d.id==='nx-l01-08'),false);
});
test('Bastione richiede due supporti: non viene consumato se il secondo manca',()=>{
 const b=make();b.sides.A.escorts[1].hp=0;b.sides.A.escorts[1].destroyed=true;
 b.sides.A.hand=['nx-l01-08'];const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[0],pass:true},1000);
 assert.equal(r.ok,false);assert.match(r.reason,/due supporti/i);
 assert.equal(JSON.stringify(b),before);
});
test('Giudizio coordinato paga una protezione vera anche quando il colpo viene bloccato',()=>{
 const b=make();
 revealedShield(b.sides.A,b.sides.A.escorts[0],'ally:judgment');
 const foe=b.sides.B.escorts[0],hp=foe.hp;
 revealedShield(b.sides.B,foe,'enemy:block');
 const r=play(b,'A',['nx-l01-09'],{...target('escort',foe),
  royalSourceToken:'ally:judgment'});
 assert.equal(r.shot.escortDamage,0);
 assert.equal(r.battle.sides.B.escorts[0].hp,hp);
 assert.equal(r.battle.sides.A.protections.some(p=>p.source==='ally:judgment'),false);
 assert.equal(r.battle.sides.A.discard.includes('gen-227'),true);
 assert.equal(r.shot.targets.length,0);
});
test('Relè permette Giudizio a un supporto operativo con Arsenale distrutto',()=>{
 const b=make();equip(b.sides.A,'nx-l01-01');
 const arsenal=b.sides.A.ships[0].parts.find(p=>p.id==='weapons');
 arsenal.hp=0;arsenal.destroyed=true;
 assert.equal(royalSupports(b.sides.A,0).length,1);
 revealedShield(b.sides.A,b.sides.A.escorts[0],'ally:relay');
 const foe=b.sides.B.escorts[0],hp=foe.hp;
 const r=play(b,'A',['nx-l01-09'],{...target('escort',foe),
  royalSourceToken:'ally:relay',royalRelay:true,
  royalRelayEscortId:b.sides.A.escorts[0].id});
 assert.equal(r.shot.escortDamage,3);
 assert.equal(r.battle.sides.B.escorts[0].hp,hp-3);
 assert.ok(r.events.some(e=>e.relayEscortId===b.sides.A.escorts[0].id));
});
test('Fusione della Corona crea una sola unità fusa, con passive e HP proporzionati',()=>{
 const b=make();
 b.sides.A.escorts[0].hp-=1;b.sides.A.escorts[1].hp-=2;
 const mother=b.sides.A.ships[0].parts.map(p=>({id:p.id,hp:p.hp}));
 const [a,z]=b.sides.A.escorts,expectedMax=a.maxHp+z.maxHp+2;
 const expectedHP=Math.max(1,Math.floor(expectedMax*(a.hp+z.hp)/(a.maxHp+z.maxHp)));
 const r=play(b,'A',['nx-l01-10'],{pass:true});
 const side=r.battle.sides.A;
 assert.equal(side.fusionsUsed,1);
 assert.equal(side.escorts.length,1);assert.equal(side.reserveEscorts.length,0);
 assert.equal(side.escorts[0].name,'Corona Unita · Eclisse Reale');
 assert.equal(side.escorts[0].hp,expectedHP);
 assert.equal(side.escorts[0].maxHp,expectedMax);
 assert.equal(side.escorts[0].royalCrown,true);
 assert.equal(side.escorts[0].fusionSkills.length,2);
 assert.deepEqual(side.ships[0].parts.map(p=>({id:p.id,hp:p.hp})),mother);
});
test('Corona Unita devia sulla propria armatura il colpo diretto alla Centralina',()=>{
 let b=make();b=play(b,'A',['nx-l01-10'],{pass:true}).battle;
 const part=b.sides.A.ships[0].parts.find(p=>p.id==='command'),hp=part.hp;
 const fused=b.sides.A.escorts[0],hpFusion=fused.hp;
 const r=play(b,'B',['prog-bypass'],target('part',part));
 assert.equal(r.battle.sides.A.ships[0].parts.find(p=>p.id==='command').hp,hp);
 assert.equal(r.battle.sides.A.escorts[0].hp,hpFusion-1);
 assert.ok(r.events.some(e=>e.kind==='royal-intercept'&&e.fusion));
 assert.equal(r.battle.sides.A.royal.lastCrownGuardPly,1);
});
test('Dopo Fusione della Corona la fusione storica usa la medesima disponibilità, senza duplicati',()=>{
 let b=make();b=play(b,'A',['nx-l01-10'],{pass:true}).battle;
 b=play(b,'B',[],{pass:true}).battle;
 b.sides.A.hand=['prog-fusion-l01'];
 const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[0],pass:true},b.ply*30000+1000);
 assert.equal(r.ok,false);assert.match(r.reason,/fusioni|Fusione|usate/i);
 assert.equal(JSON.stringify(b),before);
});
test('Fusione non si combina con Pioggia reale nello stesso turno, senza consumare la mano',()=>{
 const b=make();b.sides.A.hand=['nx-l01-10','nx-l01-02'];
 const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[0,1],...target('escort',b.sides.B.escorts[0])},1000);
 assert.equal(r.ok,false);
 assert.match(r.reason,/Fusione/i);
 assert.equal(JSON.stringify(b),before);
});
test('Ordine del Sovrano rifiuta carte da scartare già spese, senza corrompere la mano',()=>{
 const b=make();b.sides.A.hand=['ex-l01-01','gen-216'];
 const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[0,1],pass:true,
  royalSovereignTrade:true,royalDiscardId:'gen-216'},1000);
 assert.equal(r.ok,false);assert.match(r.reason,/rimasta|non giocata/i);
 assert.equal(JSON.stringify(b),before);
});
test('IA di Eclisse Reale sceglie comandi eseguibili rispettando un solo attacco e una Fusione',()=>{
 const b=make();b.sides.A.hand=['nx-l01-10','nx-l01-02','nx-l01-03'];
 const order=autoFleetTurn(b,'A');
 const r=resolveFleetNextTurn(b,'A',order,1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(r.battle.sides.A.fusionsUsed,1);
 assert.equal(r.battle.sides.A.escorts.length,1);
});
test('IA può usare Relè e Giudizio anche quando l’Arsenale è distrutto',()=>{
 const b=make();equip(b.sides.A,'nx-l01-01');
 const arsenal=b.sides.A.ships[0].parts.find(p=>p.id==='weapons');
 arsenal.hp=0;arsenal.destroyed=true;
 revealedShield(b.sides.A,b.sides.A.escorts[0],'relay:ai');
 b.sides.A.hand=['nx-l01-09'];
 const order=autoFleetTurn(b,'A');
 assert.equal(order.royalRelay,true);
 const r=resolveFleetNextTurn(b,'A',order,1000);
 assert.equal(r.ok,true,r.reason);
 assert.ok(r.shot.escortDamage>0);
});
