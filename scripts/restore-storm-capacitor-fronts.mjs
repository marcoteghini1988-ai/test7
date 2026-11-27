// Restore only the four exact approved PNG files; StackBlitz serves them remotely.
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const archive='asset-sources/weapon-fronts/condensatore-tempesta-2026-11-27';
const hash=data=>createHash('sha256').update(data).digest('hex');
export async function restoreStormCapacitorFronts({root=fileURLToPath(new URL('../',import.meta.url))}={}){
 const manifest=JSON.parse(await readFile(path.join(root,archive,'manifest.json'),'utf8'));
 if(manifest.cards.length!==4)throw Error('Archivio Tempesta incompleto');let restored=0;
 for(const c of manifest.cards){
  if(!/^public\/assets\/fleet-weapon-fronts\/weapon-designed-ionic-condensatore-tempesta(?:-rarity-l)?(?:-text-base)?\.png$/.test(c.destination))throw Error('Destinazione Tempesta non valida');
  const file=path.join(root,c.destination);try{const old=await readFile(file);if(old.length===c.bytes&&hash(old)===c.sha256)continue;}catch{}
  const parts=[];for(const p of c.parts){
   if(!/^weapon-designed-ionic-condensatore-tempesta(?:-rarity-l)?(?:-text-base)?\.part-\d{3}$/.test(p.name))throw Error('Parte Tempesta non valida');
   const bytes=await readFile(path.join(root,archive,p.name));if(bytes.length!==p.bytes||hash(bytes)!==p.sha256)throw Error('Parte Tempesta non integra');parts.push(bytes);
  }
  const png=Buffer.concat(parts);
  if(png.length!==c.bytes||hash(png)!==c.sha256||png.readUInt32BE(16)!==3072||png.readUInt32BE(20)!==4608||png[25]!==6)throw Error('PNG Tempesta non integro');
  await mkdir(path.dirname(file),{recursive:true});const temp=file+'.restoring-'+process.pid;await writeFile(temp,png);await rename(temp,file);restored++;
 }
 console.log('Condensatore: 2 fronti e 2 basi PNG HD verificati; ricomposti: '+restored+'.');
 return {verified:4,restored};
}
