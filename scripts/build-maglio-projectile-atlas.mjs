// Render riproducibili dei volumi del gioco, non immagini generate o ruotate.
import {mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createMaglioProjectile,disposeProjectile} from '../src/maglioProjectile3D.js';
const work=mkdtempSync(join(tmpdir(),'maglio-perspective-'));
for(let tier=0;tier<4;tier++){
 const root=createMaglioProjectile(tier),objects=[];root.updateMatrixWorld(true);
 root.traverse(o=>{
  if(!o.isMesh)return;const g=o.geometry,m=o.material;
  objects.push({name:o.name,position:Array.from(g.attributes.position.array),
   normal:Array.from(g.attributes.normal.array),index:g.index?Array.from(g.index.array):null,
   matrix:o.matrixWorld.toArray(),material:{name:m.name,color:m.color.getHexString(),
    metalness:m.metalness,roughness:m.roughness,emissive:m.emissive.getHexString(),intensity:m.emissiveIntensity}});
 });
 writeFileSync(join(work,'model-'+tier+'.json'),JSON.stringify(objects));disposeProjectile(root);
}
const destination=resolve('public/assets/fleet-weapons/maglio/projectiles');
const result=spawnSync('blender',['-b','-t','4','--python','scripts/render-maglio-projectile-atlas.py',
 '--',work,destination],{stdio:'inherit'});
if(result.status!==0)process.exit(result.status||1);
const extra=spawnSync('blender',['-b','-t','4','--python','scripts/render-maglio-projectile-atlas.py',
 '--','--extra',work,destination],{stdio:'inherit'});
if(extra.status!==0)process.exit(extra.status||1);
const pack=spawnSync('python3',['scripts/render-maglio-projectile-atlas.py','--pack',work,destination],{stdio:'inherit'});
process.exit(pack.status||0);
