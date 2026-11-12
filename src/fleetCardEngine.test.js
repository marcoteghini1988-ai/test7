import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createFleetCardBattle,resolveFleetCardRound,selectFleetAiOrder,fleetSlotCount,
 FLEET_PARTS,FLEET_ELEMENTS,fleetCardEffect,fleetShipDestroyed,fleetSurvivors
} from './fleetCardEngine.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
import {SPECIAL_CARD_CATALOG} from './specialCards.js';

const deck=()=>[...createSpecialCollection().loadout];
function fleet(idsA=['C01'],idsB=['R04'],extra={}){
 return createFleetCardBattle({
  shipsA:idsA.map(shipId=>({shipId,level:1})),
  shipsB:idsB.map(shipId=>({shipId,level:1})),
  deckA:deck(),deckB:deck(),seed:44,nowMs:1000,...extra
 });
}
const order=(shipIndex=0,partId='command',cards=[])=>({shipIndex,partId,cards});
const step=(b,a=order(),bb=order())=>{
 const result=resolveFleetCardRound(b,a,bb,1000+b.round*1000);
 assert.equal(result.ok,true,result.reason);
 return result.battle;
};
test('Slot di flotta reali: sblocco 1-2-3 e PvP senza sblocco aggiuntivo',()=>{
 assert.equal(fleetSlotCount(1),1);assert.equal(fleetSlotCount(10),1);
 assert.equal(fleetSlotCount(11),2);assert.equal(fleetSlotCount(30),2);
 assert.equal(fleetSlotCount(31),3);assert.equal(fleetSlotCount(1,'pvp'),3);
});
test('Si usano navi del catalogo, massimo tre, senza doppioni o regali',()=>{
 assert.throws(()=>fleet(['C01','C01']),/stessa navicella/);
 assert.throws(()=>fleet(['C01','C03','R01','R02']),/una a tre/);
 assert.throws(()=>fleet(['NON_ESISTE']),/catalogo ufficiale/);
 const b=fleet(['C01','R02','E03'],['R04','C03','C02']);
 assert.equal(b.sides.A.ships.length,3);
 assert.equal(b.sides.A.ships[0].weapons[0],'Laser Rosso');
 assert.equal(b.sides.A.hand.length,5);
 assert.equal(b.sides.A.deck.length,19);
 assert.equal(b.sides.A.discard.length,0);
});
test('Quattro componenti: tutti presenti e realmente modificabili',()=>{
 const b=fleet();
 const p=b.sides.A.ships[0].parts;
 assert.deepEqual(p.map(x=>x.id),FLEET_PARTS.map(x=>x.id));
 assert.ok(p.every(x=>x.damage===0&&!x.destroyed));
});
test('Le armi sparano anche senza speciali, risoluzione simultanea senza timer',()=>{
 const b=fleet(['C01'],['C01']);
 const r=resolveFleetCardRound(b,order(),order(),2000);
 assert.equal(r.ok,true);
 assert.equal(r.battle.sides.A.ships[0].shield,1);
 assert.equal(r.battle.sides.B.ships[0].shield,1);
 assert.equal(r.battle.round,2);
 assert.equal(r.battle.sides.A.hand.length,5);
 assert.equal(r.battle.sides.A.discard.length,0);
});
test('Le carte reali si consumano dal mazzo e si pesca una per turno',()=>{
 const b=fleet();
 const played=[b.sides.A.hand[0],b.sides.A.hand[1]];
 const n=step(b,order(0,'command',[0,1]));
 assert.equal(n.sides.A.discard.length,2);
 assert.deepEqual(n.sides.A.discard,[played[1],played[0]]);
 assert.equal(n.sides.A.hand.length,4);
 assert.equal(n.sides.A.hand.length+n.sides.A.deck.length+n.sides.A.discard.length,24);
 const invalid=resolveFleetCardRound(b,order(0,'command',[0,0]),order());
 assert.equal(invalid.ok,false);
 assert.equal(b.sides.A.discard.length,0,'la partita iniziale non deve essere mutata');
});
test('Superiorita elementali: ciclo chiuso e leggibile',()=>{
 assert.equal(FLEET_ELEMENTS.refrigerant.beats,'plasma');
 assert.equal(FLEET_ELEMENTS.plasma.beats,'mineral');
 assert.equal(FLEET_ELEMENTS.mineral.beats,'ionic');
 assert.equal(FLEET_ELEMENTS.ionic.beats,'refrigerant');
});
test('L elemento favorevole accelera la frattura senza combinazioni numeriche',()=>{
 const advantage=fleet(['C01'],['R04']);
 advantage.sides.B.ships[0].shield=0;
 const normal=fleet(['C01'],['C01']);
 normal.sides.B.ships[0].shield=0;
 const good=resolveFleetCardRound(advantage,order(),order());
 const standard=resolveFleetCardRound(normal,order(),order());
 assert.equal(good.events[0].damage,2,'Plasma supera Minerale');
 assert.equal(standard.events[0].damage,1,'senza superiorita la frattura richiede due colpi');
 assert.equal(good.battle.sides.B.ships[0].parts.find(p=>p.id==='command').destroyed,true);
});
test('Distruggere due componenti elimina la carta nave, nessuna riserva',()=>{
 const b=fleet(['C01'],['R04']);
 b.sides.B.ships[0].shield=0;
 b.sides.B.ships[0].parts.find(p=>p.id==='command').damage=1;
 const first=step(b,order(0,'command'),order(0,'engine'));
 assert.equal(first.sides.B.ships[0].parts.find(p=>p.id==='command').destroyed,true);
 assert.equal(fleetShipDestroyed(first.sides.B.ships[0]),false);
 const second=step(first,order(0,'generator'),order(0,'engine'));
 assert.equal(fleetShipDestroyed(second.sides.B.ships[0]),true);
 assert.equal(second.phase,'finished');assert.equal(second.winner,'A');
});
test('Distruzione simultanea delle due flotte = pareggio, nessun vantaggio primo giocatore',()=>{
 const b=fleet(['C01'],['C01']);
 for(const key of ['A','B']){
  const ship=b.sides[key].ships[0];
  ship.shield=0;
  ship.parts.find(p=>p.id==='engine').damage=2;
  ship.parts.find(p=>p.id==='engine').destroyed=true;
  ship.parts.find(p=>p.id==='command').damage=1;
 }
 const r=step(b,order(0,'command'),order(0,'command'));
 assert.equal(r.phase,'finished');assert.equal(r.winner,'draw');
});
test('Carta terreno del giocatore bloccata contro boss, senza consumo',()=>{
 const b=fleet(['C01'],['R04'],{bossLockedTerrain:true});
 b.sides.A.hand[0]='terrain-plasma';
 const result=resolveFleetCardRound(b,order(0,'command',[0]),order());
 assert.equal(result.ok,false);
 assert.equal(b.sides.A.hand[0],'terrain-plasma');
 assert.equal(b.sides.A.discard.length,0);
});
test('Due terreni attivati nello stesso round si annullano',()=>{
 const b=fleet(['C01'],['R04'],{mode:'pvp'});
 b.sides.A.hand[0]='terrain-plasma';
 b.sides.B.hand[0]='terrain-ionic';
 const r=step(b,order(0,'command',[0]),order(0,'command',[0]));
 assert.equal(r.terrain,null);
});
test('Ricambio Numerico convertito in un vero ricambio tattico delle speciali',()=>{
 const b=fleet();
 b.sides.A.hand[0]='tactic-numeric-recycle';
 const r=step(b,order(0,'command',[0]));
 assert.equal(r.sides.A.hand.length,5);
 assert.equal(r.sides.A.discard.length,2,'carta usata piu una cambiata');
 assert.equal(r.sides.A.deck.length,17);
 assert.equal(r.sides.A.hand.length+r.sides.A.deck.length+r.sides.A.discard.length,24);
});
test('IA: bersaglio vitale legale e carta dalla mano reale',()=>{
 const b=fleet(['C01','C02'],['R02','R03']);
 const o=selectFleetAiOrder(b);
 assert.ok(FLEET_PARTS.some(p=>p.id===o.partId));
 assert.ok(o.cards.every(i=>i>=0&&i<b.sides.B.hand.length));
 assert.equal(resolveFleetCardRound(b,order(),o).ok,true);
});
test('Tutte le carte del catalogo hanno una conversione elementale giocabile',()=>{
 for(const type of Object.keys(SPECIAL_CARD_CATALOG)){
  const result=fleetCardEffect(type);
  assert.ok(result.kind&&result.description,type);
 }
});
