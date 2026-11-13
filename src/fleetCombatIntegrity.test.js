import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {createFleetCardBattle,resolveFleetCardRound,selectFleetAiOrder} from './fleetCardEngine.js';
import {readyFleetEscorts,fleetEscortSkillDescription} from './fleetEscortSupports.js';

const starter=()=>[...createSpecialCollection().loadout];
const mk=(a='C01',b='C01',la=1,lb=1,extras={})=>
 createFleetCardBattle({shipsA:[{shipId:a,level:la}],shipsB:[{shipId:b,level:lb}],
  deckA:starter(),deckB:starter(),seed:2026,...extras});
const order=(partId='command',cards=[])=>({shipIndex:0,partId,cards});
const round=(b,a=order(),c=order())=>{
 const r=resolveFleetCardRound(b,a,c,1000+b.round*1000);
 assert.equal(r.ok,true,r.reason);return r;
};
const expose=(b,who,type,index=0)=>{b.sides[who].hand[index]=type;};
const destroy=(ship,id)=>{
 const part=ship.parts.find(p=>p.id===id);
 part.damage=2;part.destroyed=true;
};
test('IA non attiva Fusioni L5 quando le scudiere non sono sbloccate',()=>{
 const b=mk('C01','R03',1,1);
 expose(b,'B','fusion-triad');expose(b,'B','fusion-twin',1);
 const ai=selectFleetAiOrder(b);
 assert.ok(!ai.cards.some(i=>['fusion-twin','fusion-triad'].includes(b.sides.B.hand[i])));
 assert.equal(round(b,order(),ai).ok,true);
});
test('IA L5 non usa Fusioni se un collegamento vitale viene spezzato',()=>{
 const b=mk('C01','C01',1,5);
 destroy(b.sides.B.ships[0],'generator');
 expose(b,'B','fusion-triad');expose(b,'B','fusion-twin',1);
 assert.ok(readyFleetEscorts(b.sides.B).length<2);
 const ai=selectFleetAiOrder(b);
 assert.ok(!ai.cards.some(i=>['fusion-twin','fusion-triad'].includes(b.sides.B.hand[i])));
 assert.equal(round(b,order(),ai).ok,true);
});
test('IA sceglie un componente utile contro una scudiera difensiva',()=>{
 const b=mk('R04','C01',3,1);
 const ai=selectFleetAiOrder(b);
 assert.equal(ai.partId,'generator','disattiva Scudo del Vuoto e aumenta la pressione');
});
test('Entrambe le madri con Armi distrutte: pareggio tecnico, mai ciclo infinito',()=>{
 const b=mk();
 destroy(b.sides.A.ships[0],'weapons');
 destroy(b.sides.B.ships[0],'weapons');
 const r=round(b);
 assert.equal(r.battle.phase,'finished');
 assert.equal(r.battle.winner,'draw');
 assert.ok(r.battle.log.some(e=>e.text.includes('pareggio tecnico')));
});
test('Un generatore distrutto disattiva la riparazione speciale della madre',()=>{
 const b=mk();
 destroy(b.sides.A.ships[0],'generator');
 b.sides.A.ships[0].parts.find(p=>p.id==='engine').damage=1;
 expose(b,'A','support-shield-repair');
 const r=round(b,order('command',[0]),order('command'));
 assert.equal(r.battle.sides.A.ships[0].parts.find(p=>p.id==='engine').damage,1);
});
test('Il modulo Toro non supera il Generatore distrutto',()=>{
 const b=mk();
 destroy(b.sides.A.ships[0],'generator');
 b.sides.A.ships[0].parts.find(p=>p.id==='engine').damage=1;
 expose(b,'A','module-card-taurus');
 const r=round(b,order('command',[0]),order('command'));
 assert.equal(r.battle.sides.A.ships[0].parts.find(p=>p.id==='engine').damage,1);
});
test('Il modulo Sifone ripara anche dopo un colpo che intercetta una scudiera',()=>{
 const b=mk('C01','R04',1,3);
 b.sides.A.ships[0].parts.find(p=>p.id==='engine').damage=1;
 expose(b,'A','module-card-libra');
 const r=round(b,order('command',[0]),order('command'));
 assert.ok(r.events[0].escortDamage>0);
 assert.equal(r.events[0].damage,0);
 assert.equal(r.battle.sides.A.ships[0].parts.find(p=>p.id==='engine').damage,0);
});
test('Una scudiera di riparazione usa la copertura tattica solo grazie alla carta',()=>{
 const b=mk('R03','R04',3,1);
 expose(b,'A','tactical-cover');
 const r=round(b,order('generator',[0]),order('command'));
 assert.ok(r.events[1].escortDamage>0);
 assert.equal(r.events[1].damage,0);
});
test('Scudiera distrutta: stesso colpo non raggiunge la madre; colpo dopo sì',()=>{
 const b=mk('C01','C01',1,3);
 b.sides.B.escorts[0].hp=1;
 const one=round(b);
 assert.ok(one.events[0].escortDestroyed);
 assert.equal(one.events[0].damage,0);
 const two=round(one.battle);
 assert.equal(two.events[0].escortDamage,0);
 assert.ok(two.events[0].damage>0);
});
test('Boss Idra: distruggere il Generatore interrompe anche la rigenerazione boss',()=>{
 const b=mk('N00','R04',1,3,{bossId:11});
 destroy(b.sides.B.ships[0],'generator');
 b.sides.B.ships[0].parts.find(p=>p.id==='engine').damage=1;
 b.bossState.regenPending=true;
 const r=round(b);
 assert.ok(r.battle.log.some(x=>x.text.includes('Rigenerazione bloccata: Generatore distrutto')));
 assert.equal(r.battle.sides.B.ships[0].parts.find(p=>p.id==='engine').damage,1);
});
test('Tutte le 34 passivE delle evoluzioni hanno spiegazioni complete e parti reali',()=>{
 const ids=new Set(['engine','weapons','generator','command']);
 const signatures=new Set();
 for(const ship of PHASE1_CATALOG.ships){
  const b=mk(ship.id,'N00',5,1);
  for(const escort of b.sides.A.escorts){
   const info=fleetEscortSkillDescription(escort);
   assert.match(info,/Richiede:/);
   assert.match(info,/Frequenza:/);
   assert.ok(escort.skill.requires.every(id=>ids.has(id)));
   assert.ok(!signatures.has(escort.id));
   signatures.add(escort.id);
  }
 }
 assert.equal(signatures.size,34);
});
test('Nessuna nave diversa dalla madre è inserita nello schieramento al livello 5',()=>{
 for(const ship of PHASE1_CATALOG.ships){
  const b=mk(ship.id,'N00',5,1);
  assert.equal(b.sides.A.ships.length,1);
  assert.equal(b.sides.A.ships[0].id,ship.id);
  assert.equal(b.sides.A.escorts.length,2);
  assert.ok(b.sides.A.escorts.every(e=>e.parentShipId===ship.id));
 }
});
