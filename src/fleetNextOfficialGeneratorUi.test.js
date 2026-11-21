import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('./OfficialFleetBattle3D.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('./OfficialApprovedBattleHud.css',import.meta.url),'utf8');
test('ESEGUI: la terza carta non conferma automaticamente il turno',()=>{
 assert.match(ui,/aria-label="ESEGUI"/);
 assert.match(ui,/className="f3d-approved-pass"/);
 assert.doesNotMatch(ui,/chosenCards\.length===3\)\s*\{\s*requestPreparedResolution/);
 assert.match(ui,/function passTurn\(\)\{\s*requestPreparedResolution\(true\)/);
 assert.match(ui,/preparedTimeout\.current=\(\)=>fire\(\{endTurn:true,fromTimeout:true\}\)/);
});
test('La barra Generatore richiede una sola prenotazione a 2 o 4 Carte fisiche',()=>{
 assert.match(ui,/generatorCardCount\(player\)/);
 assert.match(ui,/generatorPhysicalCards>=4\?'heavy':generatorPhysicalCards>=2\?'quick':null/);
 assert.match(ui,/onClick=\{\(\)=>setElementalPrepared\(true\)\}/);
 assert.match(ui,/elementalPrepared\?\' f3d-generator-bar--reserved\'/);
 assert.match(css,/\.f3d-generator-bar--quick/);
 assert.match(css,/\.f3d-generator-bar--heavy/);
});
test('Plancia mantiene le geometrie ufficiali e mostra timer, senza cambiare immagini',()=>{
 assert.match(ui,/newGeneratorCombat:true/);
 assert.match(ui,/advanceFleetCombatTime\(current,timestamp\)/);
 assert.match(ui,/f3d-vital-countdown/);
 assert.match(ui,/WEAPON_PRINT_CANDIDATE_BY_ID\[id\]/);
 assert.match(ui,/cardFacePath\(type,grade\)/);
 assert.match(ui,/OfficialApprovedBattleHud\.css/);
});
