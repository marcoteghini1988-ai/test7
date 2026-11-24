import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3,Box3,Scene,BoxGeometry,Mesh,MeshStandardMaterial} from 'three';
import {createProjectileCamera,projectileFlightFrame,worldPointToBoard,
 createMaglioProjectile,disposeProjectile,MAGLIO_NOSE_Z,MAGLIO_PROJECTILE_SCALE} from './maglioProjectile3D.js';
import {MaglioSoftwareRenderer} from './maglioSoftwareRenderer.js';
import {projectileViewSamples} from './maglioPerspectiveRenderer.js';

const camera=createProjectileCamera();
for(const who of ['A','B'])for(const x of [110,225,340]){
 test('Camera del tavolo: '+who+' verso x='+x+', faccia corretta e naso sul bersaglio',()=>{
  const from={x:225,y:who==='A'?812:-12},to={x,y:who==='A'?230:570};
  for(const t of [0,.25,.5,.75,1]){
   const frame=projectileFlightFrame(from,to,t,camera);
   assert.equal(frame.visibleEnd,who==='A'?'rear':'front');
   const views=projectileViewSamples({position:frame.center,rotation:{y:frame.yaw}},camera);
   assert.ok(views.every(v=>v.end===frame.visibleEnd));
   assert.ok(Math.abs(views.reduce((sum,v)=>sum+v.weight,0)-1)<1e-10,
    'Le viste fisiche si interpolano senza perdere opacità');
   assert.ok(views.every(v=>v.row>=0&&v.row<8&&v.col>=0&&v.col<3));
   const forward=new Vector3(0,0,-1).applyAxisAngle(new Vector3(0,1,0),frame.yaw);
   assert.ok(forward.dot(frame.direction)>1-1e-10,'La testata punta lungo la traiettoria');
   const nose=frame.center.clone().addScaledVector(forward,-MAGLIO_NOSE_Z*MAGLIO_PROJECTILE_SCALE);
   assert.ok(nose.distanceTo(frame.nose)<1e-10);
   const point=worldPointToBoard(nose,camera);
   if(t===0)assert.ok(Math.hypot(point.x-from.x,point.y-from.y)<1e-8);
   if(t===1)assert.ok(Math.hypot(point.x-to.x,point.y-to.y)<1e-8);
   assert.ok(Math.abs((point.x-from.x)*(to.y-from.y)-(point.y-from.y)*(to.x-from.x))<1e-6,
    'La traiettoria proiettata passa per origine e bersaglio misurati');
  }
 });
}
test('La camera riduce fisicamente il corpo che si allontana e conserva la verticale',()=>{
 const width=(from,to,t)=>{
  const p=projectileFlightFrame(from,to,t,camera);
  const a=worldPointToBoard(p.center.clone().add(new Vector3(-.6,0,0)),camera);
  const b=worldPointToBoard(p.center.clone().add(new Vector3(.6,0,0)),camera);
  const top=worldPointToBoard(p.center.clone().add(new Vector3(0,.6,0)),camera);
  assert.ok(top.y<worldPointToBoard(p.center,camera).y,'Il lato superiore resta sopra il corpo');
  return b.x-a.x;
 };
 assert.ok(width({x:225,y:812},{x:225,y:230},.1)>width({x:225,y:812},{x:225,y:230},.9));
 assert.ok(width({x:225,y:-12},{x:225,y:570},.1)<width({x:225,y:-12},{x:225,y:570},.9));
});
test('Quattro volumi con retro, testata, giroscopi, dissipatori e prismi fisici',()=>{
 for(let tier=0;tier<4;tier++){
  const model=createMaglioProjectile(tier),names=[];model.traverse(o=>names.push(o.name));
  assert.ok(names.includes('Ugello interno')&&names.includes('Segmento corazza testata'));
  assert.equal(names.includes('Giroscopio'),tier===1);
  assert.equal(names.includes('Aletta dissipatrice'),tier>=2);
  assert.equal(names.includes('Prisma sfaccettato'),tier===3);
  const box=new Box3().setFromObject(model);assert.ok(box.max.z>.9&&box.min.z<-.86);
  disposeProjectile(model);
 }
});
test('Fallback 3D: tutte le facce di una geometria a materiale unico sono opache',()=>{
 let pixels;
 const canvas={getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),
  putImageData:p=>{pixels=p.data;}})};
 const renderer=new MaglioSoftwareRenderer(canvas,{contactShadow:false});renderer.setSize(450,800);
 const scene=new Scene(),cube=new Mesh(new BoxGeometry(2,2,2),new MeshStandardMaterial({color:'#73869a'}));scene.add(cube);
 renderer.render(scene,camera);
 const index=(400*450+225)*4;
 assert.equal(pixels[index+3],255,'La faccia superiore/frontale non sparisce per i gruppi del BoxGeometry');
 renderer.dispose();cube.geometry.dispose();cube.material.dispose();
});
