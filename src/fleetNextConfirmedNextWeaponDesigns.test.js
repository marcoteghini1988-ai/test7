import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const data=JSON.parse(readFileSync(new URL('./fleetNext/confirmedNextWeaponDesigns.json',import.meta.url),'utf8'));
const rows=data.designs;
test('consolidamento: 22 famiglie distinte, nessuna attivata prematuramente',()=>{
 assert.equal(rows.length,22);assert.equal(new Set(rows.map(r=>r.id)).size,22);
 assert.ok(rows.every(r=>r.implementationStatus==='confirmed-design-only'&&r.playable===false&&r.balancePending&&r.mechanics.length&&r.open.length));
 for(const [elementId,c] of Object.entries(data.counts))assert.equal(rows.filter(r=>r.elementId===elementId).length,c.newConfirmedDesigns);
 for(const [k,n] of Object.entries({existingFamilies:69,newConfirmedDesigns:22,remainingCharacterFamilies:10,target:101}))assert.equal(Object.values(data.counts).reduce((sum,c)=>sum+c[k],0),n);
 assert.equal(data.totals.designedTotal,91);assert.equal(data.totals.historicalExcluded,4);
});
test('le coppie sono complete; le dipendenze non vengono rese autonome',()=>{
 const pairs=Map.groupBy(rows.filter(r=>r.pair),r=>r.pair.id);
 assert.equal(pairs.size,5);
 for(const group of pairs.values()){assert.equal(group.length,2);assert.deepEqual(group.map(r=>r.pair.role).sort(),['A','B']);}
 for(const slug of ['convertitore-cinetico','tenebre-infinite'])assert.ok(rows.find(r=>r.id.endsWith(slug)).requiresPair);
 const holo=pairs.get('radiant-ologrammi');for(const r of holo){assert.equal(r.turns,3);assert.deepEqual(r.damageMultiplier,{alone:0.7,together:1});}
 const gravity=pairs.get('gravity-tenebre');assert.deepEqual(gravity.find(r=>r.pair.role==='A').coverageByTurn,[33,66,100]);assert.equal(gravity.find(r=>r.pair.role==='B').enhancesStage,3);
});
