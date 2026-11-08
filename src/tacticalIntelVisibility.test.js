import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {VITAL_IDS,damageMotherShield,exposeMotherPart} from './vitalDefense.js';
import {createTacticalDuel,TACTICAL_STARTER_TYPES} from './simultaneousDuelEngine.js';
import {VULNERABILITY_RIFT_CARD_ID} from './tacticalVulnerabilityRift.js';
import {visibleTacticalSignature,suggestedTacticalOperation}
 from './tacticalIntelVisibility.js';
import {tacticalShipSignatures} from './tacticalShipSignatures.js';

const num=(x,y)=>[{id:'a',value:x,suit:'♣'},{id:'b',value:y,suit:'♦'}];

test('Faglia in mano non svela in anticipo le 68 firme dei 17 modelli',()=>{
 assert.equal(PHASE1_CATALOG.ships.length,17);
 let checked=0;
 for(const ship of PHASE1_CATALOG.ships){
  const game=createTacticalDuel({shipA:'C01',shipB:ship.id});
  const attacker=game.sides.A,enemy=game.sides.B;
  for(const id of VITAL_IDS){
   assert.equal(visibleTacticalSignature(attacker,enemy,id),null,ship.id+':'+id);
   const target=tacticalShipSignatures(ship.id)[id];
   assert.deepEqual(enemy.defense.parts[id].signature,target);
   for(const pair of [num(8,5),num(4,5),num(3,4),num(3,3)])
    assert.equal(suggestedTacticalOperation(attacker,enemy,id,pair),null,
     'nessun suggerimento, neppure se la numerica scelta risolve per caso la firma');
   checked++;
  }
 }
 assert.equal(checked,68);
});

test('La Carta Faglia NON concede visione: una Scansione legittima la concede',()=>{
 const specialDeck=[VULNERABILITY_RIFT_CARD_ID,...TACTICAL_STARTER_TYPES.slice(1)];
 const game=createTacticalDuel({shipA:'C01',shipB:'R04',specialDeckA:specialDeck});
 const attacker=game.sides.A,enemy=game.sides.B;
 const hand=[...attacker.special.hand,...attacker.special.deck];
 assert.ok(hand.some(c=>c.type===VULNERABILITY_RIFT_CARD_ID));
 assert.equal(enemy.defense.parts.weapons.exposed,false);
 assert.equal(suggestedTacticalOperation(attacker,enemy,'weapons',num(8,5)),null);
 attacker.seen.push('weapons'); // equivalente allo stato Scansione autentico
 assert.deepEqual(visibleTacticalSignature(attacker,enemy,'weapons'),
  enemy.defense.parts.weapons.signature);
 assert.equal(suggestedTacticalOperation(attacker,enemy,'weapons',num(8,5)),'minus');
 assert.equal(suggestedTacticalOperation(attacker,enemy,'engine',num(3,6)),null);
 assert.equal(suggestedTacticalOperation(attacker,enemy,'weapons',num(2,9)),null,
  'conoscerla non garantisce una soluzione quando la mano è sbagliata');
});

test('Il sistema esposto rivela la firma anche senza Scansione, il distrutto non offre suggerimenti',()=>{
 const game=createTacticalDuel({shipA:'C01',shipB:'R04'});
 const attacker=game.sides.A,enemy=game.sides.B;
 enemy.defense=damageMotherShield(enemy.defense,15).defense;
 assert.equal(enemy.defense.parts.weapons.exposed,false);
 enemy.defense=exposeMotherPart(enemy.defense,'weapons').defense;
 assert.equal(enemy.defense.parts.weapons.exposed,true);
 assert.equal(suggestedTacticalOperation(attacker,enemy,'weapons',num(8,5)),'minus');
 enemy.defense.parts.weapons.hp=0;
 assert.equal(visibleTacticalSignature(attacker,enemy,'weapons'),null);
 assert.equal(suggestedTacticalOperation(attacker,enemy,'weapons',num(8,5)),null);
 assert.equal(visibleTacticalSignature(attacker,enemy,'invalid'),null);
});

test('Cambiare bersaglio o numeriche non può usare dati nascosti per autoproporre l’operatore',()=>{
 const b=createTacticalDuel({shipA:'C01',shipB:'R04'});
 const me=b.sides.A,foe=b.sides.B;
 me.seen=['weapons'];
 assert.equal(suggestedTacticalOperation(me,foe,'weapons',num(8,5)),'minus');
 assert.equal(suggestedTacticalOperation(me,foe,'command',num(8,5)),null);
 assert.equal(suggestedTacticalOperation(me,foe,'weapons',[]),null);
 assert.equal(suggestedTacticalOperation(me,foe,'weapons',num(8,5)),'minus');
 assert.equal(suggestedTacticalOperation(me,foe,'command',num(8,5)),null);
});
