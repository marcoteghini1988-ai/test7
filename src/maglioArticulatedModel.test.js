import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Vector3,Scene,OrthographicCamera} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {MAGLIO_VARIANTS,maglioModelPath} from './maglioBattleVisuals.js';
import {solveMaglioAim,maglioRigPose,maglioRestYaw,MAGLIO_REST_PITCH} from './maglioRigPose.js';
import {MaglioSoftwareRenderer} from './maglioSoftwareRenderer.js';
const scenes=new Map();
async function model(id){
 if(!scenes.has(id)){const bytes=readFileSync('public'+maglioModelPath(id));
  const data=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
  scenes.set(id,new GLTFLoader().parseAsync(data,''));}
 return (await scenes.get(id)).scene.clone(true);
}
for(const variant of MAGLIO_VARIANTS){
 test(variant.rarity+' · modello GLB con base e tre snodi reali',async()=>{
  const root=await model(variant.id),base=root.getObjectByName('BaseFixed'),yaw=root.getObjectByName('TurretYaw'),pitch=root.getObjectByName('ArmPitch'),recoil=root.getObjectByName('PistonRecoil'),muzzle=root.getObjectByName('Muzzle');
  assert.ok(base&&yaw&&pitch&&recoil&&muzzle);assert.equal(base.parent,yaw.parent);
  assert.equal(pitch.parent,yaw);assert.equal(recoil.parent,pitch);assert.equal(muzzle.parent,recoil);
  let vertices=0,meshes=0,surfaces=0;root.traverse(o=>{if(o.name.endsWith('_Surface'))surfaces++;
   if(o.isMesh){meshes++;vertices+=o.geometry.attributes.position.count;}});
  assert.equal(surfaces,4,'Superfici raggruppate per snodo');assert.ok(meshes<=32,'Budget di primitive per materiale');
  assert.ok(vertices>10000,'Geometria fisica, senza piani immagine');
 });
 for(const side of ['player','enemy'])for(const x of [-9,9])test(variant.rarity+' · '+side+' punta '+(x<0?'sinistra':'destra')+' con base ferma',async()=>{
  const root=await model(variant.id),base=root.getObjectByName('BaseFixed'),yaw=root.getObjectByName('TurretYaw'),pitch=root.getObjectByName('ArmPitch'),recoil=root.getObjectByName('PistonRecoil'),muzzle=root.getObjectByName('Muzzle');
  yaw.rotation.y=maglioRestYaw(side);pitch.rotation.x=MAGLIO_REST_PITCH;root.updateMatrixWorld(true);
  const fixed=base.matrixWorld.toArray(),before=muzzle.getWorldPosition(new Vector3());
  const target=new Vector3(x,1.10,side==='player'?-15:15),pivot=new Vector3();
  let aim;
  for(let i=0;i<5;i++){
   aim=solveMaglioAim(side,target,pitch.getWorldPosition(pivot));
   const pose=maglioRigPose({side,ageMs:740,aim,fires:true});yaw.rotation.y=pose.yaw;pitch.rotation.x=pose.pitch;recoil.position.z=pose.recoil;root.updateMatrixWorld(true);
  }
  const tip=muzzle.getWorldPosition(new Vector3()),origin=pitch.getWorldPosition(new Vector3());
  assert.ok(before.distanceTo(tip)>.2,'La testa cambia orientamento nello spazio');
  assert.ok(tip.clone().sub(origin).normalize().dot(target.clone().sub(origin).normalize())>.99999,'Il braccio mira al bersaglio');
  assert.deepEqual(base.matrixWorld.toArray(),fixed,'Il basamento non trasla e non ruota');
  const kick=maglioRigPose({side,ageMs:980,aim,fires:true});recoil.position.z=kick.recoil;root.updateMatrixWorld(true);
  assert.ok(kick.recoil>0);assert.deepEqual(base.matrixWorld.toArray(),fixed);
  const home=maglioRigPose({side,ageMs:2000,aim,fires:true});yaw.rotation.y=home.yaw;pitch.rotation.x=home.pitch;recoil.position.z=home.recoil;root.updateMatrixWorld(true);
  assert.ok(muzzle.getWorldPosition(new Vector3()).distanceTo(before)<1e-8,'Ritorna alla posa di riposo');
 });
}
test('Arma bloccata e attesa: nessun puntamento, rinculo o carica',()=>{
 for(const side of ['player','enemy'])for(const ageMs of [-200,0,500,900,1700,2300]){
  const p=maglioRigPose({side,ageMs,aim:{yaw:1,pitch:.3},fires:false});
  assert.equal(p.yaw,maglioRestYaw(side));assert.equal(p.pitch,MAGLIO_REST_PITCH);assert.equal(p.recoil,0);assert.equal(p.charge,0);
 }
});
test('Movimento ridotto: puntamento immediato senza interpolazione e rinculo',()=>{
 const p=maglioRigPose({side:'player',ageMs:740,aim:{yaw:.5,pitch:.1},fires:true,reducedMotion:true});
 assert.deepEqual(p,{yaw:.5,pitch:.1,recoil:0,charge:0});
});
test('Renderer CPU: rasterizza la geometria del GLB e gli snodi cambiano il fotogramma',async()=>{
 let painted;
 const context={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:image=>{painted=image.data.slice();}};
 const canvas={width:0,height:0,getContext:()=>context},renderer=new MaglioSoftwareRenderer(canvas);
 renderer.setPixelRatio(2);renderer.setSize(114,86);
 const root=await model(MAGLIO_VARIANTS[0].id),scene=new Scene();scene.add(root);
 const camera=new OrthographicCamera(-3.2,3.2,2.4,-2.4,.1,50);camera.position.set(0,7.95,4.59);camera.lookAt(0,1.40,0);
 root.getObjectByName('ArmPitch').rotation.x=MAGLIO_REST_PITCH;
 renderer.render(scene,camera);const before=painted;
 assert.equal(canvas.width,228);assert.equal(canvas.height,172);
 assert.ok(renderer.info.render.calls>0);assert.ok(before.filter((_,i)=>i%4===3&&before[i]===255).length>1000,'La mesh e visibile e copre pixel reali');
 // Il GLB contiene piu materiali in ogni snodo: il bagliore non deve
 // ereditare il grigio della prima primitiva della mesh.
 const warm=Array.from({length:before.length/4},(_,i)=>i*4).filter(i=>
  before[i+3]===255&&before[i]>before[i+1]*1.18&&before[i+1]>before[i+2]*1.5&&before[i]>90).length;
 assert.ok(warm>50,'I materiali arancioni delle primitive restano visibili nel renderer CPU');
 root.getObjectByName('TurretYaw').rotation.y=.55;root.getObjectByName('ArmPitch').rotation.x=-.04;
 renderer.render(scene,camera);let changed=0;for(let i=0;i<painted.length;i++)if(painted[i]!==before[i])changed++;
 assert.ok(changed>1000,'Il raster cambia con lo snodo 3D');
});
