import test from 'node:test';
import assert from 'node:assert/strict';
import {cardVisualFamily,cardCategoryLabel,cardCategoryColor} from './fleetNext/cardCategory.js';
import {card,cardRole,ALL_WEAPON_CARDS,DISMANTLE_CARDS,SIPHON_ATTACKS,NEXT_COMMON_CARDS,cardFacePath,cardDisplayFacePath} from './fleetNext/rules.js';
test('ARMA rossa e STRATEGIA arancione, ruoli del motore invariati',()=>{
 for(const def of ALL_WEAPON_CARDS){
  assert.equal(cardCategoryLabel(def),'ARMA',def.id);
  assert.equal(cardCategoryColor(def),'#ff594c',def.id);
 }
 for(const def of [...DISMANTLE_CARDS,...SIPHON_ATTACKS,...NEXT_COMMON_CARDS,card('prog-bypass')]){
  assert.equal(cardCategoryLabel(def),'STRATEGIA',def.id);
  assert.equal(cardCategoryColor(def),'#ffb24d',def.id);
  assert.equal(cardRole(def.id),'attack',def.id);
 }
 assert.equal(cardVisualFamily({kind:'character',categoria:'Strategia'}),'character');
 assert.equal(cardVisualFamily({kind:'defense',category:'Difesa'}),'defense');
 assert.equal(cardVisualFamily({kind:'defense',effectSpec:{type:'trap'}}),'trap');
 assert.equal(cardVisualFamily({kind:'support',effectSpec:{type:'energy'}}),'energy');
 assert.equal(cardVisualFamily({kind:'terrain'}),'terrain');
});
test('Lettura sorgente e percorso di visualizzazione restano separati',()=>{
 const id='weapon-confirmed-metallic-maglio';
 assert.equal(cardFacePath(id),'/assets/fleet-weapon-fronts/'+id+'.png');
 assert.match(cardDisplayFacePath(id),/fleet-weapon-fronts(?:-red)?\//);
});
