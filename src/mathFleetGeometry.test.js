import test from 'node:test';import assert from 'node:assert/strict';
import {BOARD_SIZE,ENGINE_POINTS,SHIP_ENGINE_POINTS,SHIP_PLAYER_ENGINE_POINTS,GUN_POINTS,gunPoint,enginePoint,boardPoint,sourceToTarget,volleyTimeline,fleetFormation,engineHudShift} from './mathFleetGeometry.js';
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

test("l'impatto segue l'ultimo proiettile, anche con piu armi",()=>{
 assert.deepEqual(volleyTimeline([]),{arrivalMs:0,settleMs:550});
 assert.deepEqual(volleyTimeline([{bullets:1}]),{arrivalMs:640,settleMs:1290});
 assert.deepEqual(volleyTimeline([{bullets:8}]),{arrivalMs:890,settleMs:1540});
 assert.deepEqual(volleyTimeline([{bullets:8},{bullets:1},{bullets:13}]),{arrivalMs:1010,settleMs:1660});
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

test('indicatori HP separati sulle due coppie dei moduli, nessuna sovrapposizione laterale',()=>{
 for(const id of ['N00','C01','C02','C03','C04']){
  const a=SHIP_ENGINE_POINTS[id];
  // Dardo uses 46px readouts; the other sprites use 54px readouts on 218px ships.
  assert.ok((a.minus[0]-a.plus[0])*218>=(id==='C04'?46:54),id+' coppia superiore');
  assert.ok(a.divide[0]-a.times[0]>=.27,id+' coppia inferiore');
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

test('HP e bersagli leggibili anche su tre navi e sui motori ravvicinati del Dardo',()=>{
 for(const side of ['player','enemy'])for(const count of [1,2,3])for(const id of ['N00','C01','C02','C03','C04']){
  const {size,hudWidth}=fleetFormation(count,side);
  for(const pair of [['plus','minus'],['times','divide']]){
   const centers=pair.map(op=>enginePoint(side,id,op)[0]*size+engineHudShift(side,id,op,size,hudWidth));
   assert.ok(centers[0]-hudWidth/2>=0,id+' HUD sinistro dentro lo slot');
   assert.ok(centers[1]+hudWidth/2<=size,id+' HUD destro dentro lo slot');
   assert.ok(centers[1]-centers[0]>=hudWidth+5.99,id+' bersagli separati');
  }
 }
});
