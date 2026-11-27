import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,symlink,unlink,rm,access} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {restoreProbeHammerFronts} from '../scripts/restore-probe-hammer-fronts.mjs';
test('A fresh checkout restores the exact approved PNG; a damaged archive is rejected before writing',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'eclissi-probe-restore-'));
 const archive='asset-sources/weapon-fronts/sonda-martello-2026-11-27';
 try{
  const manifest=JSON.parse(await readFile(archive+'/manifest.json','utf8'));
  await mkdir(path.join(root,archive),{recursive:true});
  for(const c of manifest.cards){
   const dest=path.join(root,c.destination);await mkdir(path.dirname(dest),{recursive:true});await symlink(path.resolve(c.destination),dest);
   for(const p of c.parts)await symlink(path.resolve(archive,p.name),path.join(root,archive,p.name));
  }
  const first=manifest.cards[0],dest=path.join(root,first.destination),manifestPath=path.join(root,archive,'manifest.json');
  await writeFile(manifestPath,JSON.stringify(manifest));await unlink(dest);
  assert.deepEqual(await restoreProbeHammerFronts({root}),{verified:14,restored:1});
  const bytes=await readFile(dest);assert.equal(bytes.length,first.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),first.sha256);
  await unlink(dest);first.parts[0].sha256='0'.repeat(64);await writeFile(manifestPath,JSON.stringify(manifest));
  await assert.rejects(restoreProbeHammerFronts({root}),/Parte PNG non integra/);
  await assert.rejects(access(dest));
 }finally{await rm(root,{recursive:true,force:true});}
});
