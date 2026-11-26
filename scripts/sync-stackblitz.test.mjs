import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,readFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {syncStackblitz,sourcePath,gitBlobSha} from './sync-stackblitz.mjs';
test('Synchronizes verified canonical sources, keeps asset settings and backs up the existing copy',async()=>{
 const cwd=await mkdtemp(path.join(os.tmpdir(),'test7-sync-check-'));
 try{
  await mkdir(path.join(cwd,'src'));await writeFile(path.join(cwd,'src/OfficialFleetBattle3D.jsx'),'old');
  const env='VITE_ASSET_ROOT=https://raw.githubusercontent.com/marcoteghini1988-ai/test7/main/public/assets\n';
  await writeFile(path.join(cwd,'.env.local'),env);
  const files={'package.json':'{"type":"module"}','src/OfficialFleetBattle3D.jsx':'verified'};
  const tree=Object.entries(files).map(([p,s])=>({path:p,type:'blob',sha:gitBlobSha(Buffer.from(s)),size:Buffer.byteLength(s)}));
  const fetchImpl=async url=>({ok:true,status:200,json:async()=>({tree}),arrayBuffer:async()=>Buffer.from(files[url.split('/').slice(6).join('/')])});
  const result=await syncStackblitz({cwd,ref:'a'.repeat(40),apply:true,fetchImpl,log:()=>{}});
  assert.equal(result.updated,2);assert.equal(await readFile(path.join(cwd,'src/OfficialFleetBattle3D.jsx'),'utf8'),'verified');
  assert.equal(await readFile(path.join(result.backup,'src/OfficialFleetBattle3D.jsx'),'utf8'),'old');
  assert.equal(await readFile(path.join(cwd,'.env.local'),'utf8'),env);
  await rm(result.backup,{recursive:true});
 }finally{await rm(cwd,{recursive:true});}
});
test('A corrupt download leaves all existing source files untouched',async()=>{
 const cwd=await mkdtemp(path.join(os.tmpdir(),'test7-sync-check-'));
 try{
  await mkdir(path.join(cwd,'src'));await writeFile(path.join(cwd,'src/OfficialFleetBattle3D.jsx'),'old');
  const files={'package.json':'{}','src/OfficialFleetBattle3D.jsx':'new'};
  const tree=Object.entries(files).map(([p,s])=>({path:p,type:'blob',sha:gitBlobSha(Buffer.from(s)),size:Buffer.byteLength(s)}));
  await assert.rejects(syncStackblitz({cwd,ref:'a'.repeat(40),apply:true,log:()=>{},fetchImpl:async()=>({ok:true,json:async()=>({tree}),arrayBuffer:async()=>Buffer.from('corrupt')})}),/non integro/);
  assert.equal(await readFile(path.join(cwd,'src/OfficialFleetBattle3D.jsx'),'utf8'),'old');
 }finally{await rm(cwd,{recursive:true});}
});
test('Large archives and unsafe destinations never enter the source synchronization',()=>{
 for(const p of ['../package.json','/src/App.jsx','src/../.env.local','src\\App.jsx','asset-sources/front.part-001','public/assets/front.png','.env.local'])assert.equal(sourcePath(p),false,p);
 assert.equal(sourcePath('src/OfficialFleetBattle3D.jsx'),true);
});
