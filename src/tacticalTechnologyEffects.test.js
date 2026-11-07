import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {focusedTacticalTechnology,tacticalWeaponTechnology} from './tacticalArmamentBalance.js';
import {createTacticalDuel,validateTacticalOrder,sealTacticalOrder,advanceTacticalDuel,nativeBarrierPacket} from './simultaneousDuelEngine.js';

const idle={specialIndices:[],numericIndices:[]};
const choose=id=>({...idle,weaponFocusId:id});
function run(b,a=idle,bb=idle){
 const x=sealTacticalOrder(b,'A',a,100);
 assert.equal(x.ok,true,x.reason);
 const y=sealTacticalOrder(x.battle,'B',bb,101);
 assert.equal(y.ok,true,y.reason);
 return advanceTacticalDuel(y.battle,101);
}
const impact=b=>b.history.at(-1).impacts.find(e=>e.kind==='barrier'&&e.by==='A');
test('Tutte le 42 armi possono essere privilegiate senza cambiare il numero di armi o le carte in mano',()=>{
 let count=0;const types=new Set();
 for(const w of PHASE1_CATALOG.weapons){
  const game=createTacticalDuel({shipA:w.nave_id,levelA:5,shipB:'C01',levelB:3});
  const info=focusedTacticalTechnology(game.sides.A,w.id);
  assert.equal(info.weaponId,w.id);
  assert.equal(info.technology,tacticalWeaponTechnology(game.sides.A.weapons.find(x=>x.id===w.id)));
  const initialPower=nativeBarrierPacket(game.sides.A);
  const result=run(game,choose(w.id));
  assert.equal(impact(result).technology,info.technology);
  assert.equal(nativeBarrierPacket(result.sides.A),initialPower);
  assert.equal(result.sides.A.numeric.hand.length,7);
  assert.equal(result.sides.A.special.hand.length,5);
  types.add(info.technology);count++;
 }
 assert.equal(count,42);
 assert.deepEqual([...types].sort(),['cinetico','esplosivo','ionico','laser','plasma'].sort());
});
test('Non si può selezionare un cannone non presente nella propria nave',()=>{
 const b=createTacticalDuel({shipA:'C01',levelA:3});
 assert.equal(validateTacticalOrder(b,'A',choose('W42')).reason,'weapon_focus_invalid');
 const a=sealTacticalOrder(b,'A',choose('W02'),100);
 assert.equal(a.ok,true);
 assert.equal(a.battle.orders.A.weaponFocusId,'W02');
 assert.equal(sealTacticalOrder(a.battle,'A',choose('W02'),101).reason,'already_committed');
});
test('Plasma: il vero danno alla barriera prepara calore per lo scontro successivo; cinetico bypassa più intercettazione',()=>{
 const make=()=>createTacticalDuel({shipA:'C04',shipB:'C01',levelA:5,levelB:5});
 const plasma=run(make(),choose('W07'));
 const kinetic=run(make(),choose('W06'));
 assert.equal(impact(plasma).technology,'plasma');
 assert.equal(impact(kinetic).technology,'cinetico');
 assert.equal(plasma.sides.B.heated,true);
 assert.equal(kinetic.sides.B.heated,false);
 assert.ok(impact(kinetic).intercepted<impact(plasma).intercepted);
 assert.ok(kinetic.sides.B.defense.shield.hp<=plasma.sides.B.defense.shield.hp);
 const following=advanceTacticalDuel(plasma,8101);
 const baseline=structuredClone(following);baseline.sides.B.heated=false;
 const nextHeat=run(following,choose('W06'));
 const nextNormal=run(baseline,choose('W06'));
 assert.ok(nextHeat.history[1].shieldA>=nextNormal.history[1].shieldA);
 assert.equal(nextHeat.sides.B.heated,false);
});
test('Ionico: le armi integrate applicano interferenza per uno scontro, anche senza carta speciale',()=>{
 const game=createTacticalDuel({shipA:'R02',shipB:'C01',levelA:4,levelB:5});
 const ionWeapon=game.sides.A.weapons.find(w=>tacticalWeaponTechnology(w)==='ionico');
 assert.ok(ionWeapon);
 const first=run(game,choose(ionWeapon.id));
 assert.equal(impact(first).technology,'ionico');
 assert.ok(first.history[0].shieldA>0);
 assert.equal(first.sides.B.ionized,true);
 const next=advanceTacticalDuel(first,8101);
 const clean=structuredClone(next);clean.sides.B.ionized=false;
 const ion=run(next,idle);
 const regular=run(clean,idle);
 assert.ok(impact(ion).intercepted<=impact(regular).intercepted);
 assert.equal(ion.sides.B.ionized,false);
});
test('Esplosivo: distribuisce danno vero alla seconda scudiera, senza danneggiare direttamente un vitale',()=>{
 const gun=PHASE1_CATALOG.weapons.find(w=>tacticalWeaponTechnology({...w,id:w.id,name:w.nome})==='esplosivo');
 assert.ok(gun);
 const game=createTacticalDuel({shipA:gun.nave_id,shipB:'C01',levelA:5,levelB:5});
 const out=run(game,choose(gun.id));
 assert.equal(impact(out).technology,'esplosivo');
 assert.ok(impact(out).splash>0);
 assert.ok(out.sides.B.escorts[1].hp<20);
 assert.ok(out.sides.B.defense.parts.engine.hp===10);
});
test('Laser: senza scudiere avversarie privilegiare laser porta un bonus nativo entro +45%',()=>{
 const ship=PHASE1_CATALOG.ships.find(s=>{
  const tech=PHASE1_CATALOG.weapons.filter(w=>w.nave_id===s.id).map(w=>tacticalWeaponTechnology({...w,name:w.nome}));
  return tech.includes('laser')&&tech.includes('esplosivo');
 });
 assert.ok(ship,'una nave possiede laser e tecnologia alternativa');
 const game=createTacticalDuel({shipA:ship.id,shipB:'C01',levelA:5,levelB:1});
 const laser=game.sides.A.weapons.find(w=>tacticalWeaponTechnology(w)==='laser');
 const other=game.sides.A.weapons.find(w=>tacticalWeaponTechnology(w)==='esplosivo');
 assert.ok(laser&&other);
 const a=run(game,choose(laser.id));
 const b=run(createTacticalDuel({shipA:ship.id,shipB:'C01',levelA:5,levelB:1}),choose(other.id));
 assert.ok(impact(a).damage>=impact(b).damage);
 assert.ok(impact(a).packet>=impact(b).packet);
 assert.ok(impact(a).packet<=Math.floor(nativeBarrierPacket(game.sides.A)*1.45)+1);
});
