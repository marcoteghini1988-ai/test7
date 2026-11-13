import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {fleetWeaponVisuals,fleetWeaponOfRound,fleetVolleyVisuals,fleetImpactVisual}
 from './fleetBattleVisuals.js';
import {createFleetCardBattle,resolveFleetCardRound} from './fleetCardEngine.js';
import {createSpecialCollection} from './specialDeckBuilder.js';
const deck=()=>[...createSpecialCollection().loadout];
const game=(levelA=5,levelB=3)=>createFleetCardBattle({
 shipsA:[{shipId:'C01',level:levelA}],shipsB:[{shipId:'C01',level:levelB}],
 deckA:deck(),deckB:deck(),seed:24});
const order=()=>({shipIndex:0,partId:'command',cards:[]});
test('Le 42 armi originali restano assegnate alle 17 madri',()=>{
 const visuals=fleetWeaponVisuals();
 assert.equal(visuals.length,42);
 assert.equal(new Set(visuals.map(w=>w.id)).size,42);
 assert.ok(new Set(visuals.map(w=>w.style)).size>=7);
 for(const w of PHASE1_CATALOG.weapons){
  const v=visuals.find(x=>x.id===w.id);
  assert.equal(v.name,w.nome,w.id);
  assert.equal(v.description,w.effetto_visivo,w.id);
  assert.match(v.color,/^#[0-9a-f]{6}$/i);
 }
});
test('Solo la madre produce uno sparo visibile, anche con due scudiere L5',()=>{
 const b=game();
 const event={fireCount:1,strength:2};
 const volleys=fleetVolleyVisuals(b.sides.A.ships,event,1);
 assert.equal(volleys.length,1);
 assert.equal(volleys[0].shipName,'Lince Solare');
 const w=b.sides.A.ships[0].parts.find(p=>p.id==='weapons');
 w.damage=2;w.destroyed=true;
 assert.equal(fleetVolleyVisuals(b.sides.A.ships,event,1).length,0);
 assert.equal(fleetVolleyVisuals(b.sides.A.ships,{fireCount:0,strength:0},1).length,0);
});
test('Ogni arma originale ruota nel tempo con il proprio effetto',()=>{
 for(const ship of PHASE1_CATALOG.ships){
  const weapons=PHASE1_CATALOG.weapons.filter(w=>w.nave_id===ship.id);
  for(let round=1;round<=weapons.length*2;round++)
   assert.equal(fleetWeaponOfRound(ship.id,round).id,
    weapons[(round-1)%weapons.length].id);
 }
});
test('Gli impatti sulle scudiere non sono confusi con quelli sulla madre',()=>{
 const b=game();
 const r=resolveFleetCardRound(b,order(),order(),100);
 assert.equal(r.ok,true);
 assert.ok(r.events[0].escortDamage>0);
 const intercepted=fleetImpactVisual(r.events[0]);
 assert.equal(intercepted.kind,'escort-hit');
 assert.match(intercepted.label,/scudiera|intercettazione/i);
 assert.equal(r.events[0].damage,0);
 const vital=fleetImpactVisual({fireCount:1,strength:2,escortDamage:0,
  damage:1,partId:'engine',partName:'Motori',destroyed:false});
 assert.equal(vital.image,'/assets/battle-fx/vital-engine.png');
 assert.equal(vital.kind,'fracture');
 const destroyed=fleetImpactVisual({...vital,damage:2,partId:'command',
  partName:'Centralina',destroyed:true});
 assert.equal(destroyed.kind,'destroyed');
 assert.ok(existsSync(resolve('public/assets/battle-fx/shield-contact.png')));
 for(const part of ['engine','weapons','generator','command'])
  assert.ok(existsSync(resolve('public/assets/battle-fx/vital-'+part+'.png')));
});
test('Le 34 immagini delle scudiere esistono ai percorsi originali',()=>{
 for(const ship of PHASE1_CATALOG.ships)for(let slot=1;slot<=2;slot++)
  assert.ok(existsSync(resolve('public/assets/escorts/'+ship.id+'_escort_'+slot+'.svg')),
   ship.id+' scudiera '+slot);
});
