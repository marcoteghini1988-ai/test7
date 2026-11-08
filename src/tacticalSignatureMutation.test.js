import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {VITAL_IDS,exposeMotherPart} from './vitalDefense.js';
import {TACTICAL_SHIP_SIGNATURES,tacticalSignatureMatches} from './tacticalShipSignatures.js';
import {SIGNATURE_MUTATION_CARD_ID,signatureMutationFor,prepareSignatureMutation} from './tacticalSignatureMutation.js';
import {TACTICAL_SPECIALS,TACTICAL_STARTER_TYPES,createTacticalDuel,
 validateTacticalOrder,sealTacticalOrder,advanceTacticalDuel} from './simultaneousDuelEngine.js';
import {tacticalCombatTimeline} from './tacticalCombatTimeline.js';
import {createSpecialCollection,normalizeSpecialCollection,openSpecialPack,SPECIAL_PACK_TYPES}
 from './specialDeckBuilder.js';
import {combatSpecialLoadout} from './pvpTerrainLoadout.js';
import {planTacticalAi} from './tacticalDuelAi.js';

const toCards=(x,y)=>[{id:'n1',value:x,suit:'♣'},{id:'n2',value:y,suit:'♦'}];
const createDeck=()=>[SIGNATURE_MUTATION_CARD_ID,...TACTICAL_STARTER_TYPES.slice(1)];
function expose(b,key,id){
 b.sides[key].defense.shield.hp=40;
 b.sides[key].defense=exposeMotherPart(b.sides[key].defense,id).defense;
 assert.equal(b.sides[key].defense.parts[id].exposed,true);
 return b;
}
function offer(b,key){
 const pile=b.sides[key].special;
 let i=pile.hand.findIndex(c=>c.type===SIGNATURE_MUTATION_CARD_ID);
 if(i>=0)return i;
 const from=pile.deck.findIndex(c=>c.type===SIGNATURE_MUTATION_CARD_ID);
 assert.ok(from>=0,'carta presente nel mazzo equipaggiato');
 const previous=pile.hand[0];
 pile.hand[0]=pile.deck[from];
 pile.deck[from]=previous;
 return 0;
}
function execute(b,orderA={},orderB={}){
 const first=sealTacticalOrder(b,'A',{numericIndices:[],specialIndices:[],...orderA},100);
 assert.equal(first.ok,true,first.reason);
 const second=sealTacticalOrder(first.battle,'B',{numericIndices:[],specialIndices:[],...orderB},101);
 assert.equal(second.ok,true,second.reason);
 return advanceTacticalDuel(second.battle,101);
}
const count=p=>p.hand.length+p.deck.length+p.discard.length;
const strikeA={numericIndices:[3,2],vitalId:'weapons',op:'minus'}; // C01 -> R04, 8-5=3
const strikeB={numericIndices:[2,3],vitalId:'engine',op:'times'}; // R04 -> C01, 3x4=12

test('Le 68 firme dei 17 modelli hanno una mutazione diversa e risolvibile da due vere numeriche',()=>{
 assert.equal(PHASE1_CATALOG.ships.length,17);
 let checked=0;
 for(const [shipId,signatures] of Object.entries(TACTICAL_SHIP_SIGNATURES)){
  for(const [id,original] of Object.entries(signatures)){
   const mutated=signatureMutationFor(original,shipId,id,3);
   assert.ok(mutated,shipId+'/'+id);
   assert.equal(mutated.kind,'mathGate');
   assert.deepEqual(mutated.allowedCardCounts,[2,3]);
   const originalOptions=original.kind==='any'?original.options:[original];
   const ops=originalOptions.map(s=>s.kind==='poker'?s.pattern:s.op);
   assert.equal(ops.includes(mutated.op),false,shipId+'/'+id);
   let possible=false;
   for(let x=1;x<=13&&!possible;x++)for(let y=1;y<=13&&!possible;y++)
    possible=tacticalSignatureMatches(mutated,mutated.op,toCards(x,y));
   assert.equal(possible,true,shipId+'/'+id);
   assert.deepEqual(signatureMutationFor(original,shipId,id,3),mutated);
   assert.equal(signatureMutationFor(original,shipId,id,0),null);
   checked++;
  }
 }
 assert.equal(checked,68);
 assert.ok(TACTICAL_SPECIALS[SIGNATURE_MUTATION_CARD_ID]);
});

test('Mutazione vietata se nessun proprio vitale già esposto e vivo',()=>{
 const duel=createTacticalDuel({specialDeckB:createDeck()});
 const at=offer(duel,'B');
 const order={specialIndices:[at],numericIndices:[],mutationVitalId:'weapons'};
 assert.equal(validateTacticalOrder(duel,'B',order).reason,'mutation_unavailable');
 expose(duel,'B','weapons');
 assert.equal(validateTacticalOrder(duel,'B',order).ok,true);
 const rejected=structuredClone(duel);
 rejected.sides.B.defense.parts.weapons.hp=0;
 assert.equal(validateTacticalOrder(rejected,'B',order).reason,'mutation_unavailable');
 assert.equal(prepareSignatureMutation(duel.sides.B.defense,'engine',1).ok,false);
 assert.equal(prepareSignatureMutation(duel.sides.B.defense,'weapons',1).ok,true);
});

test('Un attacco valido preparato viene fermato dalla Mutazione segreta; la barriera si danneggia',()=>{
 const battle=expose(createTacticalDuel({
  shipA:'C01',shipB:'R04',levelA:3,levelB:3,specialDeckB:createDeck()
 }), 'B','weapons');
 const at=offer(battle,'B');
 const old=structuredClone(battle.sides.B.defense.parts.weapons.signature);
 const normal=execute(structuredClone(battle),strikeA);
 const mutated=execute(battle,strikeA,{specialIndices:[at],mutationVitalId:'weapons'});
 assert.ok(normal.sides.B.defense.parts.weapons.hp<10,'attacco originario valido');
 assert.equal(mutated.sides.B.defense.parts.weapons.hp,10,'firma cambiata ferma la precisione');
 assert.equal(mutated.sides.B.defense.shield.hp,normal.sides.B.defense.shield.hp,
  'le armi native e le scudiere sparano normalmente alla barriera');
 assert.deepEqual(mutated.sides.B.defense.parts.weapons.signature,old,
  'la firma originale viene ripristinata subito dopo il confronto');
 assert.notDeepEqual(mutated.history[0].snapshots.prepared.B.defense.parts.weapons.signature,old);
 assert.notDeepEqual(mutated.history[0].snapshots.afterPrecision.B.defense.parts.weapons.signature,old);
 assert.equal(mutated.history[0].impacts.find(x=>x.kind==='precision'&&x.by==='A').reason,
  'signature_mutated');
 assert.equal(count(mutated.sides.B.special),24);
 assert.equal(mutated.sides.B.special.discard.filter(x=>x.type===SIGNATURE_MUTATION_CARD_ID).length,1);
 assert.equal(count(mutated.sides.A.numeric),52);
 assert.ok(mutated.lastEvents.some(e=>e.includes('firma mutata')));
 const playback=tacticalCombatTimeline(mutated);
 assert.ok(playback.some(e=>e.label?.includes('FIRMA RISCRITTA')));
 assert.ok(playback.some(e=>e.label?.includes('COLPO ANNULLATO')));
 const next=advanceTacticalDuel(mutated,8101);
 assert.equal(next.round,2);
 assert.deepEqual(next.sides.B.defense.parts.weapons.signature,old);
});

test('Equità A/B: entrambe le flotte possono mutare un proprio vitale, senza ordine di precedenza',()=>{
 const b=createTacticalDuel({shipA:'C01',shipB:'R04',specialDeckA:createDeck(),
  specialDeckB:createDeck()});
 expose(b,'A','engine');
 expose(b,'B','weapons');
 const a=offer(b,'A'),z=offer(b,'B');
 const out=execute(b,{...strikeA,specialIndices:[a],mutationVitalId:'engine'},
  {...strikeB,specialIndices:[z],mutationVitalId:'weapons'});
 assert.equal(out.history[0].impacts.filter(x=>x.reason==='signature_mutated').length,2);
 assert.equal(out.sides.A.defense.parts.engine.hp,10);
 assert.equal(out.sides.B.defense.parts.weapons.hp,10);
 assert.equal(out.sides.A.special.discard.filter(x=>x.type===SIGNATURE_MUTATION_CARD_ID).length,1);
 assert.equal(out.sides.B.special.discard.filter(x=>x.type===SIGNATURE_MUTATION_CARD_ID).length,1);
});

test('Salvataggi precedenti preservati, carta assente finché non ottenuta dal pacchetto',()=>{
 const collection=createSpecialCollection();
 assert.equal(collection.owned[SIGNATURE_MUTATION_CARD_ID],0);
 const old={...collection,owned:Object.fromEntries(
  Object.entries(collection.owned).filter(([type])=>type!==SIGNATURE_MUTATION_CARD_ID))};
 const migrated=normalizeSpecialCollection(old);
 assert.equal(migrated.owned[SIGNATURE_MUTATION_CARD_ID],0);
 assert.ok(SPECIAL_PACK_TYPES.includes(SIGNATURE_MUTATION_CARD_ID));
 const awarded=openSpecialPack({...migrated,packCredits:1},()=>.9999999);
 assert.equal(awarded.opened,true);
 assert.ok(awarded.drawn.every(type=>type===SIGNATURE_MUTATION_CARD_ID));
 const configured={...migrated,owned:{...migrated.owned,[SIGNATURE_MUTATION_CARD_ID]:1},
  loadout:[SIGNATURE_MUTATION_CARD_ID,...migrated.loadout.slice(1)]};
 assert.equal(combatSpecialLoadout(configured,'campaign').includes(SIGNATURE_MUTATION_CARD_ID),true);
 assert.equal(combatSpecialLoadout(configured,'legacy').includes(SIGNATURE_MUTATION_CARD_ID),false);
 assert.equal(JSON.stringify(configured).includes(SIGNATURE_MUTATION_CARD_ID),true);
});

test('IA non spia le carte avversarie: sceglie la propria esposizione come bersaglio Mutazione',()=>{
 const battle=createTacticalDuel({shipA:'C01',shipB:'R04',specialDeckB:createDeck()});
 expose(battle,'B','weapons');
 const at=offer(battle,'B');
 const plan=planTacticalAi(battle,'B');
 assert.ok(plan.specialIndices.includes(at));
 assert.equal(plan.mutationVitalId,'weapons');
 assert.equal(validateTacticalOrder(battle,'B',plan).ok,true);
});
