// Byte-exact HD PNG archive for CI and fresh local checkouts. StackBlitz serves the published native files remotely.
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const archive='asset-sources/weapon-fronts/sonda-martello-2026-11-27';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function restoreProbeHammerFronts({root=fileURLToPath(new URL('../',import.meta.url)),remoteAssets=''}={}){
 let local=true,manifest;
 try{manifest=JSON.parse(await readFile(path.join(root,archive,'manifest.json'),'utf8'));}
 catch(error){if(error.code!=='ENOENT')throw error;local=false;}
 if(!local){
  if(!remoteAssets)try{remoteAssets=(await readFile(path.join(root,'.env.local'),'utf8')).match(/^VITE_ASSET_ROOT\s*=\s*([^\s]+)/m)?.[1]||'';}catch{}
  const remote=/^(https:\/\/raw\.githubusercontent\.com\/marcoteghini1988-ai\/test7\/(?:main|[a-f0-9]{40}))\/public\/assets\/?$/.exec(remoteAssets)?.[1];
  if(!remote)throw Error('Archivio HD Sonda/Martello o riferimento Test7 non disponibile');
  const response=await fetch(remote+'/'+archive+'/manifest.json',{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('Manifest HD Sonda/Martello: '+response.status);
  manifest=await response.json();remoteAssets=remote;
 }
 if(manifest.cards.length!==14)throw Error('Archivio Sonda/Martello incompleto');
 let restored=0;
 // Keep the memory and network budget bounded: one PNG, at most four parts.
 for(const card of manifest.cards){
  if(!/^public\/assets\/fleet-weapon-fronts\/weapon-designed-ionic-(?:sonda-ionica|martello-tuono)(?:-rarity-[rel])?(?:-text-base)?\.png$/.test(card.destination))throw Error('Destinazione PNG non valida');
  const destination=path.join(root,card.destination);
  try{const current=await readFile(destination);if(current.length===card.bytes&&hash(current)===card.sha256)continue;}catch{}
  const chunks=await Promise.all(card.parts.map(async part=>{
   if(!/^weapon-designed-ionic-(?:sonda-ionica|martello-tuono)(?:-rarity-[rel])?(?:-text-base)?\.part-\d{3}$/.test(part.name))throw Error('Parte PNG non valida');
   let bytes;
   if(local)bytes=await readFile(path.join(root,archive,part.name));
   else{const r=await fetch(remoteAssets+'/'+archive+'/'+part.name,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error('Parte PNG non disponibile: '+r.status);bytes=Buffer.from(await r.arrayBuffer());}
   if(bytes.length!==part.bytes||hash(bytes)!==part.sha256)throw Error('Parte PNG non integra: '+part.name);return bytes;
  }));
  const png=Buffer.concat(chunks);
  if(png.length!==card.bytes||hash(png)!==card.sha256||png.readUInt32BE(16)!==3072||png.readUInt32BE(20)!==4608||png[25]!==6)throw Error('PNG HD non integro: '+card.id);
  await mkdir(path.dirname(destination),{recursive:true});const temporary=destination+'.restoring-'+process.pid;
  await writeFile(temporary,png);await rename(temporary,destination);restored++;
 }
 console.log('Sonda/Martello: 7 fronti e 7 basi PNG HD verificati; ricomposti: '+restored+'.');
 return {verified:manifest.cards.length,restored};
}
