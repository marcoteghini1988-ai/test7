import {EXCLUSIVE_UNLOCK_MILESTONES} from './fleetNext/exclusiveUnlocks.js';
import {shipMaxLevel} from './fleetNext/progression.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
 card,cardFacePath,effectiveDeck,eligibleExclusives,exclusiveUnlocked,
 BOSS_CARDS
} from './fleetNext/rules.js';
import {
 createFleetNextBattle,resolveFleetNextTurn,validateFleetTurn,
 protectingFleetUnits,effectUnavailableReason,autoFleetTurn
} from './fleetNext/combat.js';
import {mountModule,removeModule} from './fleetNext/auroraEngine.js';
import {
 nebulaHidden,nebulaHiddenSupport,nebulaHideReason,nebulaProtectionForbidden,
 nebulaModuleActive
} from './fleetNext/nebulaEngine.js';

const IDS=['nx-e01-01','nx-e01-02','nx-e01-03','nx-e01-04','ex-e01-01',
 'nx-e01-06','nx-e01-07','nx-e01-08','nx-e01-09','nx-e01-10'];
function battle({shipA='E01',shipB='C03',levelA=5,levelB=5}={}){
 const b=createFleetNextBattle({shipA,shipB,levelA,levelB,mode:'pvp',
  deckA:[],deckB:[],seed:970});
 for(const side of Object.values(b.sides)){
  side.hand=[];side.deck=Array(20).fill('gen-216');side.discard=[];
 }
 return b;
}
function foe(b,who){return b.sides[who==='A'?'B':'A'];}
function target(kind,u){
 return {targetKind:kind,targetId:u.id,pass:false,
  ...(kind==='part'?{partId:u.id}:kind==='escort'?{escortSlot:u.slot}:
   kind==='machine'?{machineSlot:u.slot}:{})};
}
function play(b,who='A',hand=[],extra={pass:true}){
 b.turn=who;b.sides[who].hand=[...hand];
 const part=foe(b,who).ships[0].parts.find(p=>p.hp>0&&!p.destroyed);
 const r=resolveFleetNextTurn(b,who,{cards:hand.map((_,i)=>i),
  partId:part?.id,...extra},b.ply*30000+1000);
 assert.equal(r.ok,true,r.reason);
 return r;
}
function equip(side,id){
 const r=mountModule(side,card(id));
 assert.equal(r.ok,true,r.reason);return r.entry;
}
function shield(side,unit){
 const source='test:visible-shield';
 side.defenses.push({id:'test:defense',source,untilPly:20,hidden:false});
 side.protections.push({id:'test:defense',source,kind:'protect',remaining:1,
  target:'escort',escortSlot:unit.slot,untilPly:20,placedPly:-2});
}

test('Proiettore e Ago nello stesso turno: il supporto occultato abilita una sola perforazione',()=>{
 const b=battle();equip(b.sides.A,'nx-e01-01');
 shield(b.sides.B,b.sides.B.escorts[0]);
 const first=b.sides.B.escorts[0],hp=first.hp;
 const r=play(b,'A',['nx-e01-02'],{...target('escort',first),
  nebulaHide:true,nebulaHideEscortId:b.sides.A.escorts[0].id});
 assert.ok(r.battle.sides.B.escorts[0].hp<hp);
 assert.ok(r.events.some(e=>e.kind==='nebula-hide'));
 assert.ok(r.events.some(e=>e.kind==='pierce'));
});
test('IA Nebulosa usa il Proiettore disponibile senza carta inventata',()=>{
 const b=battle();equip(b.sides.A,'nx-e01-01');
 const order=autoFleetTurn(b,'A');
 assert.equal(order.nebulaHide,true);
 assert.equal(order.nebulaHideEscortId,b.sides.A.escorts[0].id);
 const r=resolveFleetNextTurn(b,'A',order,1000);
 assert.equal(r.ok,true,r.reason);
 assert.equal(nebulaHidden(r.battle.sides.A.escorts[0],r.battle.ply),true);
});
test('Nebulosa E01: dieci esclusive eseguibili solo con questa nave e livelli 6/7/8/9/10',()=>{
 assert.equal(new Set(IDS).size,10);
 for(let level=1;level<=shipMaxLevel('E01');level++){
  assert.equal(eligibleExclusives('E01',level).filter(c=>IDS.includes(c.id)).length,4+EXCLUSIVE_UNLOCK_MILESTONES['E01'].filter(n=>n<=level).length);
 }
 for(const id of IDS){
  const c=card(id);assert.ok(c,id);
  assert.equal(c.shipId,'E01');
  assert.equal(c.effectSpec.type,'nebula');
  assert.equal(c.playable===false,false);
  assert.equal(cardFacePath(id),null);
  assert.equal(exclusiveUnlocked(id,'E01',shipMaxLevel('E01')),true);
  assert.equal(exclusiveUnlocked(id,'R04',5),false);
 }
 assert.equal(effectiveDeck([],'E01',shipMaxLevel('E01')).filter(id=>IDS.includes(id)).length,10);
 assert.equal(Object.keys(BOSS_CARDS).length,12);
});
test('Proiettore: senza modulo non puo occultare; ordine invalido non modifica la partita',()=>{
 const b=battle();b.sides.A.hand=['nx-e01-02'];
 const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[],pass:true,nebulaHide:true},1000);
 assert.equal(r.ok,false);
 assert.match(r.reason,/Proiettore/);
 assert.equal(JSON.stringify(b),before);
});
test('Proiettore di bruma: solo un supporto, senza attacco o protezione per la madre',()=>{
 let b=battle();equip(b.sides.A,'nx-e01-01');
 b.sides.A.escorts[1].disabledUntilPly=5;
 const e=b.sides.A.escorts[0];
 b=play(b,'A',[],{pass:true,nebulaHide:true,nebulaHideEscortId:e.id}).battle;
 assert.equal(nebulaHidden(b.sides.A.escorts[0],b.ply),true);
 assert.equal(nebulaModuleActive(b.sides.A,'nx-e01-01',b.ply),true);
 assert.equal(protectingFleetUnits(b.sides.A,b.ply).length,0);
 assert.equal(b.sides.A.escorts[0].linked,false);
 const hp=b.sides.A.ships[0].parts.find(p=>p.id==='generator').hp;
 const r=play(b,'B',[],target('part',b.sides.A.ships[0].parts.find(p=>p.id==='generator')));
 assert.equal(r.shot.damage,1);
 assert.equal(r.battle.sides.A.ships[0].parts.find(p=>p.id==='generator').hp,hp-1);
});
test('Bruma itinerante: rivela un supporto e nasconde l’altro, senza curare o resettare',()=>{
 let b=battle();equip(b.sides.A,'nx-e01-01');
 const first=b.sides.A.escorts[0],second=b.sides.A.escorts[1];
 first.hp--;second.hp--;
 b=play(b,'A',[],{pass:true,nebulaHide:true,nebulaHideEscortId:first.id}).battle;
 b=play(b,'B',[],{pass:true}).battle;
 assert.equal(b.ply,2);
 assert.equal(nebulaHidden(b.sides.A.escorts[0],b.ply),true);
 const r=play(b,'A',['nx-e01-08'],{pass:true,nebulaSwapTargetId:second.id});
 assert.equal(nebulaHidden(r.battle.sides.A.escorts[0],r.battle.ply),false);
 assert.equal(nebulaHidden(r.battle.sides.A.escorts[1],r.battle.ply),true);
 assert.equal(r.battle.sides.A.escorts[0].hp,first.hp);
 assert.equal(r.battle.sides.A.escorts[1].hp,second.hp);
 assert.ok(r.events.some(e=>e.cardId==='nx-e01-08'&&e.revealedId===first.id));
});
test('Occultamento scade al successivo turno del proprietario senza creare supporti',()=>{
 let b=battle();equip(b.sides.A,'nx-e01-01');
 b=play(b,'A',[],{pass:true,nebulaHide:true}).battle;
 b=play(b,'B',[],{pass:true}).battle;
 b=play(b,'A',[],{pass:true}).battle;
 assert.equal(nebulaHiddenSupport(b.sides.A,b.ply),null);
 assert.equal(b.sides.A.escorts.length,2);
});
test('Ago nella nebbia: una protezione visibile e ignorata se un supporto e occultato',()=>{
 let b=battle();equip(b.sides.A,'nx-e01-01');
 b=play(b,'A',[],{pass:true,nebulaHide:true}).battle;
 b=play(b,'B',[],{pass:true}).battle;
 shield(b.sides.B,b.sides.B.escorts[0]);
 const hp=b.sides.B.escorts[0].hp;
 const r=play(b,'A',['nx-e01-02'],target('escort',b.sides.B.escorts[0]));
 assert.ok(r.battle.sides.B.escorts[0].hp<hp);
 assert.ok(r.events.some(e=>e.kind==='pierce'));
 assert.equal(r.battle.sides.B.protections.length,0);
});
test('Ago nella nebbia senza supporto occultato: la difesa visibile blocca',()=>{
 const b=battle();shield(b.sides.B,b.sides.B.escorts[0]);
 const hp=b.sides.B.escorts[0].hp;
 const r=play(b,'A',['nx-e01-02'],target('escort',b.sides.B.escorts[0]));
 assert.equal(r.shot.escortDamage,0);
 assert.equal(r.battle.sides.B.escorts[0].hp,hp);
});
test('Velo criogenico: primo colpo ammesso, secondo della stessa raffica annullato',()=>{
 let b=battle({shipA:'N00',shipB:'E01'});
 const escort=b.sides.B.escorts[0];
 b=play(b,'B',['nx-e01-03'],{pass:true,
  nebulaVeilTargetKind:'escort',nebulaVeilTargetId:escort.id}).battle;
 const hp=b.sides.B.escorts[0].hp;
 const r=play(b,'A',['nx-n00-02'],target('escort',b.sides.B.escorts[0]));
 assert.equal(r.battle.sides.B.escorts[0].hp,hp-1);
 assert.equal(r.battle.sides.B.defenses.some(d=>d.id==='nx-e01-03'),false);
 assert.ok(r.events.some(e=>e.kind==='block'&&e.cardId==='nx-e01-03'));
});
test('Falso bersaglio: annulla la preparazione Falco al rilascio, non il turno',()=>{
 let b=battle({shipA:'R01',shipB:'E01'});
 const victim=b.sides.B.escorts[0],hp=victim.hp;
 b=play(b,'A',['nx-r01-02'],target('escort',victim)).battle;
 assert.ok(b.sides.A.falco.pending);
 b=play(b,'B',['nx-e01-04'],{pass:true}).battle;
 const r=play(b,'A',[],{pass:true});
 assert.equal(r.battle.sides.B.escorts[0].hp,hp);
 assert.equal(r.battle.sides.A.falco.pending,null);
 assert.ok(r.events.some(e=>e.kind==='trap-reveal'&&e.cardId==='nx-e01-04'));
 assert.equal(r.battle.sides.B.defenses.some(d=>d.id==='nx-e01-04'),false);
 assert.equal(r.battle.sides.A.discard.filter(id=>id==='nx-r01-02').length,1);
});
test('Falso bersaglio non reagisce al tiro normale senza preparazione',()=>{
 let b=battle({shipA:'C03',shipB:'E01'});
 b=play(b,'B',['nx-e01-04'],{pass:true}).battle;
 const r=play(b,'A',[],target('escort',b.sides.B.escorts[0]));
 assert.equal(r.events.some(e=>e.kind==='trap-reveal'&&e.cardId==='nx-e01-04'),false);
 assert.equal(r.battle.sides.B.defenses.some(d=>d.id==='nx-e01-04'),true);
});
test('Dissipazione: ripristina terreno permanente senza cancellare il boss',()=>{
 const b=battle();
 b.terrain={id:'T02',source:'player',expiresPly:6,cardId:null,
  underlying:{id:'T05',source:'boss',expiresPly:null,cardId:null}};
 const r=play(b,'A',['nx-e01-06'],{pass:true});
 assert.equal(r.battle.terrain.id,'T05');
 assert.equal(r.battle.terrain.source,'boss');
 assert.ok(r.events.some(e=>e.kind==='terrain-dissipate'));
});
test('Dissipazione non tocca terreno permanente che non sia stato sostituito',()=>{
 const b=battle();b.terrain={id:'T05',source:'campaign',expiresPly:null};
 b.sides.A.hand=['nx-e01-06'];
 const before=JSON.stringify(b);
 const r=resolveFleetNextTurn(b,'A',{cards:[0],pass:true},1000);
 assert.equal(r.ok,false);
 assert.match(r.reason,/permanente/);
 assert.equal(JSON.stringify(b),before);
});
test('Nebbia polare: vieta soltanto le nuove protezioni, non quelle gia posate',()=>{
 let b=battle();
 const first=b.sides.B.escorts[0],other=b.sides.B.escorts[1];
 const r=play(b,'A',['nx-e01-07'],target('escort',first));
 b=r.battle;
 assert.equal(b.sides.B.escorts[0].nebulaNoProtectionUntilPly,2);
 assert.equal(nebulaProtectionForbidden(b.sides.B.escorts[0],b.ply),true);
 const next=play(b,'B',['gen-227'],{pass:true});
 assert.equal(next.battle.sides.B.protections[0].escortSlot,other.slot);
 assert.equal(next.battle.sides.B.protections[0].placedPly,1);
 assert.equal(nebulaProtectionForbidden(next.battle.sides.B.escorts[0],next.battle.ply),false);
});
test('Cannone velato: il primo Attacco non si fa deviare dall’Esca Squalo',()=>{
 const b=battle({shipB:'R04'});
 equip(b.sides.A,'nx-e01-09');
 const first=b.sides.B.escorts[0],second=b.sides.B.escorts[1];
 b.sides.B.defenses.push({id:'nx-r04-03',source:'decoy',hidden:false,untilPly:8,
  sharkDecoyKind:'escort',sharkDecoyId:second.id});
 const hp0=first.hp,hp1=second.hp;
 const r=play(b,'A',['nx-e01-02'],target('escort',first));
 assert.ok(r.battle.sides.B.escorts[0].hp<hp0);
 assert.equal(r.battle.sides.B.escorts[1].hp,hp1);
 assert.equal(r.events.some(e=>e.kind==='shark-lure'),false);
 assert.equal(r.battle.sides.B.defenses.some(d=>d.id==='nx-r04-03'),true);
});
test('Notte criogenica: blocca un secondo bersaglio, ma non il colpo principale',()=>{
 let b=battle({shipA:'C02',shipB:'E01'});
 b=play(b,'B',['nx-e01-10'],{pass:true}).battle;
 const [first,second]=b.sides.B.escorts;
 const hp1=first.hp,hp2=second.hp;
 const r=play(b,'A',['nx-c02-10'],{...target('escort',first),
  prismaSecondTargetKind:'escort',prismaSecondTargetId:second.id});
 assert.equal(r.battle.sides.B.escorts[0].hp,hp1-1);
 assert.equal(r.battle.sides.B.escorts[1].hp,hp2);
 assert.ok(r.events.some(e=>e.kind==='block'&&e.cardId==='nx-e01-10'));
});
test('Arconte senza Terreno non pesca gratis; richiesta di scambio priva di Terreno e rifiutata',()=>{
 const b=battle();b.sides.A.hand=['ex-e01-01','gen-216'];
 const before=JSON.stringify(b);
 const invalid=resolveFleetNextTurn(b,'A',{cards:[0],pass:true,nebulaTerrainTrade:true,
  nebulaTradeCardId:'gen-216'},1000);
 assert.equal(invalid.ok,false);assert.match(invalid.reason,/Terreno/);
 assert.equal(JSON.stringify(b),before);
 const r=play(b,'A',['ex-e01-01'],{pass:true});
 assert.equal(r.battle.sides.A.commander?.id,'ex-e01-01');
 assert.equal(r.events.some(e=>e.terrainTrade),false);
});
test('IA Nebulosa genera un ordine eseguibile senza inventare carte o condizioni',()=>{
 const b=battle();const order=autoFleetTurn(b,'A');
 const r=resolveFleetNextTurn(b,'A',order,1000);
 assert.equal(r.ok,true,r.reason);
});
