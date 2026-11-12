import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {
 fleetWeaponVisuals,fleetWeaponOfRound,fleetVolleyVisuals,fleetImpactVisual
} from './fleetBattleVisuals.js';
import {createFleetCardBattle,resolveFleetCardRound} from './fleetCardEngine.js';
import {createSpecialCollection} from './specialDeckBuilder.js';

const deck=()=>[...createSpecialCollection().loadout];
const game=()=>createFleetCardBattle({
 shipsA:[{shipId:'C01',level:1},{shipId:'R02',level:1}],
 shipsB:[{shipId:'C02',level:1}],deckA:deck(),deckB:deck(),seed:24
});
const order=(shipIndex=0,partId='command')=>({shipIndex,partId,cards:[]});
test('42 effetti originali, una firma e un colore per ogni arma, almeno 7 tipi distinti',()=>{
 const visuals=fleetWeaponVisuals();
 assert.equal(visuals.length,42);
 assert.equal(new Set(visuals.map(w=>w.id)).size,42);
 const styles=new Set(visuals.map(w=>w.style));
 assert.ok(styles.size>=7,'la battaglia non deve ridurre ogni arma allo stesso sparo');
 for(const w of PHASE1_CATALOG.weapons){
  const v=visuals.find(x=>x.id===w.id);
  assert.equal(v.name,w.nome,w.id);
  assert.equal(v.description,w.effetto_visivo,w.id);
  assert.match(v.color,/^#[0-9a-f]{6}$/i);
 }
});
test('Ogni nave usa soltanto le armi che possiede, ruotandole nel tempo',()=>{
 for(const ship of PHASE1_CATALOG.ships){
  const weapons=PHASE1_CATALOG.weapons.filter(w=>w.nave_id===ship.id);
  assert.ok(weapons.length>0,ship.id);
  for(let round=1;round<=weapons.length*2;round++){
   const v=fleetWeaponOfRound(ship.id,round);
   assert.equal(v.id,weapons[(round-1)%weapons.length].id);
   assert.equal(v.shipId,ship.id);
  }
 }
 assert.equal(fleetWeaponOfRound('NON_ESISTENTE'),null);
});
test('Le scie sono legate alle vere navi che possono attaccare',()=>{
 const b=game();
 const event={fireCount:2,strength:2};
 assert.equal(fleetVolleyVisuals(b.sides.A.ships,event,1).length,2);
 const g=b.sides.A.ships[0].parts.find(p=>p.id==='weapons');
 g.damage=2;g.destroyed=true;
 const visual=fleetVolleyVisuals(b.sides.A.ships,event,1);
 assert.deepEqual(visual.map(x=>x.shipName),[b.sides.A.ships[1].name]);
 assert.equal(fleetVolleyVisuals(b.sides.A.ships,{fireCount:0,strength:0},1).length,0);
});
test('La collisione usa solo effetti realmente presenti: scudi vs vitali',()=>{
 const shield=fleetImpactVisual({fireCount:1,strength:1,shieldsHit:1,damage:0});
 assert.equal(shield.image,'/assets/battle-fx/shield-contact.png');
 const fractured=fleetImpactVisual({fireCount:2,strength:2,shieldsHit:2,damage:0});
 assert.equal(fractured.image,'/assets/battle-fx/shield-fracture.png');
 const vital=fleetImpactVisual({
  fireCount:1,strength:1,shieldsHit:0,damage:1,partId:'engine',
  partName:'Motori',destroyed:false
 });
 assert.equal(vital.image,'/assets/battle-fx/vital-engine.png');
 assert.equal(vital.kind,'fracture');
 const destroyed=fleetImpactVisual({...vital,damage:2,partId:'command',
  partName:'Centralina',destroyed:true});
 assert.equal(destroyed.kind,'destroyed');
 assert.equal(destroyed.image,'/assets/battle-fx/vital-command.png');
 assert.equal(fleetImpactVisual({fireCount:2,strength:0,shieldsHit:0,damage:0}),null);
 for(const filename of ['shield-contact','shield-fracture','vital-engine',
  'vital-weapons','vital-generator','vital-command']){
  assert.ok(existsSync(resolve('public/assets/battle-fx/'+filename+'.png')),filename);
 }
});
test('L evento del motore guida il feedback: solo scudo all inizio',()=>{
 const b=game();
 const r=resolveFleetCardRound(b,order(),order(),150);
 assert.equal(r.ok,true);
 const impact=fleetImpactVisual(r.events[0]);
 assert.ok(impact);
 assert.ok(impact.kind.startsWith('shield'),JSON.stringify(r.events[0]));
 assert.equal(r.events[0].damage,0);
});
