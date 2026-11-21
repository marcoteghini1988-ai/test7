// Regressione: la fascia centrale della plancia 3D resta senza pannelli HUD.
// Timer, scelta bersaglio e terreno continuano a funzionare nel motore.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const board=readFileSync(new URL('./OfficialFleetBattle3D.jsx',import.meta.url),'utf8');

test('Plancia: nessun timer, menu bersagli o terreno nella fascia centrale',()=>{
 for(const removed of [
  'className="live-midline"',
  'className="live-turn-indicator"',
  'className="live-terrain-slot"',
  'className="f3d-target-status"',
  'aria-label="Bersaglio dell’attacco"'
 ])assert.ok(!board.includes(removed),'Elemento ancora visibile: '+removed);
});

test('Meccaniche aggiornate: supporti selezionabili direttamente, PASSA senza dialoghi',()=>{
 assert.ok(!board.includes('f3d-support-target-choice'));
 assert.ok(!board.includes('SCEGLI IL SUPPORTO DA COLPIRE'));
 assert.ok(!board.includes('shouldChooseSupportTarget(protectors'));
 assert.ok(board.includes('onSelectTarget={setSelectedTarget}'));
 assert.ok(board.includes('fire({endTurn});'));
 assert.ok(board.includes('passDisabled={ended||!myTurn||resolving}'));
 assert.ok(board.includes('f3d-fusion-choice'));
 assert.ok(board.includes('TERRAIN_CATALOG[terrain]'));
 assert.ok(board.includes('secondsLeft'));
});
