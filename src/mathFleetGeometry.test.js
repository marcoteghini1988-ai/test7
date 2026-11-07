import {readFileSync} from 'node:fs';
import test from 'node:test';import assert from 'node:assert/strict';
import {BOARD_SIZE,ENGINE_POINTS,SHIP_ENGINE_POINTS,SHIP_PLAYER_ENGINE_POINTS,GUN_POINTS,gunPoint,enginePoint,boardPoint,sourceToTarget,fleetFormation,fleetDisplayCenters,engineHudShift,engineHudPlacement,WEAPON_MOUNTS,weaponMount,weaponMuzzleCount,engineSurface,engineVisualState} from './mathFleetGeometry.js';
import {PHASE1_CATALOG} from './phase1FleetCatalog.js';
import {newVessel} from './mathDuelEngine.js';
const box=(left,top,width,height)=>({left,top,width,height});
test('quattro motori per lato, posizione sempre dentro lo sprite',()=>{
 for(const side of ['enemy','player']){
  assert.deepEqual(Object.keys(ENGINE_POINTS[side]),['plus','minus','times','divide']);
  for(const [x,y] of Object.values(ENGINE_POINTS[side])){assert.ok(x>0&&x<1);assert.ok(y>0&&y<1);}
 }
});
test('la nave del giocatore è orientata in verso opposto e ogni motore si rispecchia',()=>{
 for(const op of ['plus','minus','times','divide']){
  assert.equal(ENGINE_POINTS.player[op][0],ENGINE_POINTS.enemy[op][0]);
  assert.ok(Math.abs(ENGINE_POINTS.player[op][1]+ENGINE_POINTS.enemy[op][1]-1)<1e-10);
 }
});
test('le armi hanno da uno a quattro attacchi visivi agganciati per ogni lato',()=>{
 for(const side of ['enemy','player'])for(let count=1;count<=4;count++){
  assert.equal(GUN_POINTS[side][count].length,count);
  for(let i=0;i<count;i++){assert.deepEqual(gunPoint(side,count,i),GUN_POINTS[side][count][i]);}
 }
});
test('coordinate centro proiettile corrette in tavola senza scalatura',()=>{
 const root=box(100,50,450,800),gun=box(200,600,20,20),motor=box(310,200,40,40);
 assert.deepEqual(boardPoint(root,gun),[110,560]);
 assert.deepEqual(boardPoint(root,motor),[230,170]);
 const v=sourceToTarget(root,gun,motor);
 assert.deepEqual([v.x,v.y,v.dx,v.dy],[110,560,120,-390]);
});
test('la scalatura 9:16 non cambia origine e arrivo del colpo',()=>{
 for(const scale of [.37,.5,.75,1,1.4]){
  const root=box(17,26,BOARD_SIZE.width*scale,BOARD_SIZE.height*scale);
  const gun=box(17+82*scale,26+574*scale,24*scale,24*scale);
  const motor=box(17+249*scale,26+112*scale,52*scale,52*scale);
  const v=sourceToTarget(root,gun,motor);
  for(const [actual,expected] of [[v.x,94],[v.y,586],[v.dx,181],[v.dy,-448]])assert.ok(Math.abs(actual-expected)<1e-8,`${actual} ≠ ${expected}`);
 }
});
test('rifiuta riferimenti non validi senza generare NaN nei proiettili',()=>{
 assert.equal(boardPoint(null,box(0,0,4,4)),null);
 assert.equal(boardPoint(box(0,0,0,800),box(0,0,4,4)),null);
 assert.equal(sourceToTarget(box(0,0,450,800),null,box(0,0,4,4)),null);
});

test('motori calibrati per i cinque modelli e per le due viste della nave',()=>{
 for(const id of ['N00','C01','C02','C03','C04'])for(const op of Object.keys(ENGINE_POINTS.enemy)){
  const e=enginePoint('enemy',id,op),p=enginePoint('player',id,op);
  assert.deepEqual(e,SHIP_ENGINE_POINTS[id][op]);
  assert.ok(e[0]>.2&&e[0]<.8&&e[1]>.25&&e[1]<.8);
  assert.ok(p[0]>.2&&p[0]<.8&&p[1]>.25&&p[1]<.8);
  assert.deepEqual(p,SHIP_PLAYER_ENGINE_POINTS[id][op]);
  if(op==='plus'||op==='minus')assert.ok(e[1]<.5&&p[1]>.5,'motori sui lati di scarico delle due viste');
 }
});

test('i due motori di scarico hanno punti distinti per ogni modello',()=>{
 for(const id of ['N00','C01','C02','C03','C04']){
  const a=SHIP_ENGINE_POINTS[id];
  // Dardo uses 46px readouts; the other sprites use 54px readouts on 218px ships.
  assert.ok((a.minus[0]-a.plus[0])*218>=(id==='C04'?46:54),id+' coppia superiore');
  assert.ok(a.plus[0]<a.minus[0],id+' ordine dei moduli');
 }
});

test('formazioni 1–3: stessa riga, scala uniforme, margini e intervalli senza sovrapposizioni',()=>{
 for(const side of ['player','enemy'])for(const count of [1,2,3]){
  const {centers,size,top}=fleetFormation(count,side);
  assert.equal(centers.length,count);
  assert.equal((centers[0]+centers.at(-1))/2,BOARD_SIZE.width/2,'formazione centrata');
  assert.ok(centers[0]-size/2>=20,'ala sinistra dentro la plancia');
  assert.ok(centers.at(-1)+size/2<=BOARD_SIZE.width-20,'ala destra dentro la plancia');
  for(let i=1;i<count;i++)assert.ok(centers[i]-centers[i-1]-size>=18,'sprite distinti');
  const absoluteTop=(side==='enemy'?88:326)+top;
  assert.ok(absoluteTop>=75&&absoluteTop+size<=(side==='enemy'?300:560),'nessun contatto con carte o timer');
 }
 assert.ok(fleetFormation(1,'enemy').size>fleetFormation(2,'enemy').size);
 assert.ok(fleetFormation(2,'enemy').size>fleetFormation(3,'enemy').size);
});

test('HP dei motori realmente sbloccati non si sovrappongono, per ogni livello e formazione',()=>{
 for(const side of ['player','enemy'])for(const count of [1,2,3])for(const {id} of PHASE1_CATALOG.ships)for(const level of [1,2,3,4,5]){
  const {size,hudWidth,engineSize}=fleetFormation(count,side),height=count===3?22:27;
  const rects=Object.keys(newVessel(id,level).engines).map(op=>{
   const [x,y]=enginePoint(side,id,op);
   return {left:x*size+engineHudShift(side,id,op,size,hudWidth)-hudWidth/2,
    top:y*size+(engineHudPlacement(side,id,op)==='above'?-engineSize/2-2-height:engineSize/2+2),width:hudWidth,height};
  });
  for(const a of rects)assert.ok(a.left>=0&&a.left+a.width<=size,id+' HUD nello slot');
  for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
   const a=rects[i],b=rects[j];
   assert.ok(Math.min(a.left+a.width,b.left+b.width)<=Math.max(a.left,b.left)||Math.min(a.top+a.height,b.top+b.height)<=Math.max(a.top,b.top),`${id}/${side}/${count}/${level}: letture separate`);
  }
 }
});

test('ogni arma del catalogo iniziale ha un attacco proprio e una bocca per entrambe le viste',()=>{
 assert.equal(Object.keys(WEAPON_MOUNTS).length,PHASE1_CATALOG.weapons.length);
 for(const weapon of PHASE1_CATALOG.weapons)for(const side of ['player','enemy'])for(let muzzleIndex=0;muzzleIndex<weaponMuzzleCount(weapon.id);muzzleIndex++){
  const mount=weaponMount(side,weapon.nave_id,weapon.id,muzzleIndex);
  assert.ok(mount,weapon.id+' presente');
  const [x,y]=mount.point;
  assert.ok(x>.1&&x<.9&&y>.07&&y<.93,'bocca dentro il canvas');
  assert.ok(mount.width>0&&mount.length>0,'montaggio dimensionato con lo sprite');
  for(const op of Object.keys(newVessel(weapon.nave_id,5).engines)){
   const [ex,ey]=enginePoint(side,weapon.nave_id,op);
   assert.ok(Math.hypot(x-ex,y-ey)>.12,weapon.id+' non usa un motore come bocca');
  }
 }
 assert.equal(weaponMount('player','N00','W07'),null,'nessuna arma su una nave diversa');
});

test('il danno visivo segue la propria gondola e non cambia lo stato degli altri motori',()=>{
 for(const side of ['player','enemy'])for(const {id} of PHASE1_CATALOG.ships)for(const op of Object.keys(newVessel(id,5).engines)){
  const s=engineSurface(side,id,op);
  assert.deepEqual(s.point,enginePoint(side,id,op));
  for(const r of s.radius)assert.ok(r>0&&r<.1);
  if(op==='times'||op==='divide')assert.equal(s.exhaustY,null,'reattore ausiliario senza scia inventata');
  else assert.ok(side==='player'?s.exhaustY>s.point[1]:s.exhaustY<s.point[1]);
 }
 const engines={plus:{hp:100,max:100},minus:{hp:100,max:100}};
 engines.plus.hp=65;assert.equal(engineVisualState(engines.plus),'damaged');
 engines.plus.hp=30;assert.equal(engineVisualState(engines.plus),'critical');
 engines.plus.hp=0;assert.equal(engineVisualState(engines.plus),'destroyed');
 assert.equal(engineVisualState(engines.minus),'intact');
});


test('ripristino ZIP 03/11: madre centro, nave 2 sinistra e nave 3 destra a 9:16',()=>{
 for(const side of ['enemy','player']){
  const ships=[{id:'N00'},{id:'C01'},{id:'R01'}];
  assert.deepEqual(fleetDisplayCenters(ships,side),[225,83,367]);
  assert.deepEqual(fleetDisplayCenters(ships.slice(0,1),side),[225]);
  assert.deepEqual(fleetDisplayCenters(ships.slice(0,2),side),[121,329]);
  const slots=fleetDisplayCenters(ships,side);
  const frame=fleetFormation(3,side);
  assert.equal(frame.size,124);
  assert.equal(slots[0],BOARD_SIZE.width/2);
  assert.equal(slots[1]+slots[2],BOARD_SIZE.width);
  assert.equal(ships.length,3,'nessuna carta navicella scartata nel calcolo degli slot');
 }
});

test('madre centrale anche se nello stato della flotta compare in posizione diversa',()=>{
 for(const mother of [0,1,2]){
  const fleet=Array.from({length:3},(_,i)=>({
   id:'C0'+(i+1),defense:i===mother?{kind:'mother'}:null
  }));
  const centers=fleetDisplayCenters(fleet,'player');
  assert.equal(centers[mother],225);
  assert.deepEqual([...centers].sort((a,b)=>a-b),[83,225,367]);
 }
 assert.throws(()=>fleetDisplayCenters([],'enemy'),RangeError);
 assert.throws(()=>fleetDisplayCenters(Array(4).fill({id:'N00'}),'player'),RangeError);
});

test('la plancia boss usa gli stessi centri per scafi, armi e selezione slot',()=>{
 const source=readFileSync(new URL('./BossBattle3D.jsx',import.meta.url),'utf8');
 assert.match(source,/const centers=fleetDisplayCenters\(ship\.fleet,side\)/);
 assert.equal(source.split('centers[i]/450*100').length-1,2,
  'sia la nave sia il pulsante della stessa nave seguono il suo indice');
 assert.match(source,/data-fleet-role=/);
});
