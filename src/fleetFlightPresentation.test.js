import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_SHIPS} from './mathDuelEngine.js';
import {SUPPORT_CATALOG} from './fleetNext/supportCatalog.js';
import {shipFlightProfile} from './fleetFlightPresentation.js';

test('Ogni madre e ogni supporto hanno due reattori nelle rispettive viste',()=>{
 const ids=new Set([...PHASE1_SHIPS.map(s=>s.id),...SUPPORT_CATALOG.map(s=>s.shipModelId)]);
 for(const id of ids)for(const side of ['player','enemy']){
  const p=shipFlightProfile(id,side);assert.ok(p,id+' '+side);
  assert.equal(p.ports.length,2);assert.ok(p.ports[0].x<p.ports[1].x);
  for(const port of p.ports){
   assert.ok(port.x>.15&&port.x<.85&&port.y>.1&&port.y<.9);
   assert.equal(port.direction,side==='player'?1:-1);
   const tip=port.y+port.direction*port.length;
   assert.ok(side==='player'?tip>.8:tip<.25,'La scia segue il retro della scocca: '+id+' '+side);
   assert.ok(tip>=0&&tip<=1.05&&port.width>0&&port.width<.1);
  }
 }
});
test('Il colore appartiene al modello anche dal lato avversario; gli ugelli non si specchiano genericamente',()=>{
 for(const s of SUPPORT_CATALOG){
  const a=shipFlightProfile(s.shipModelId,'player'),b=shipFlightProfile(s.shipModelId,'enemy');
  assert.equal(a.color,b.color);assert.notDeepEqual(a.ports,b.ports);
 }
 const falce=shipFlightProfile('C04','player');
 assert.ok(falce.ports[0].x>.4&&falce.ports[1].x<.6,'La Falce ha i due ugelli vicini al centro');
 assert.equal(shipFlightProfile('nave-inesistente','player'),null);
 assert.equal(shipFlightProfile('N00','laterale'),null);
});
