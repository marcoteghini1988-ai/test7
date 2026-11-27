// Restore only the six exact approved PNG files; StackBlitz serves them remotely.
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const archive='asset-sources/weapon-fronts/lancia-comando-2026-11-27';
const hash=data=>createHash('sha256').update(data).digest('hex');
export async function restoreCommandLanceFronts({root=fileURLToPath(new URL('../',import.meta.url))}={}){
 const manifest=JSON.parse(await readFile(path.join(root,archive,'manifest.json'),'utf8'));
 if(manifest.cards.length!==6)throw Error('Archivio Lancia incompleto');let restored=0;
 for(const c of manifest.cards){
  if(!/^public\/assets\/fleet-weapon-fronts\/weapon-designed-ionic-lancia-comando-ionico(?:-rarity-[el])?(?:-text-base)?\.png$/.test(c.destination))throw Error('Destinazione Lancia non valida');
  const file=path.join(root,c.destination);try{const old=await readFile(file);if(old.length===c.bytes&&hash(old)===c.sha256)continue;}catch{}
  const parts=[];for(const p of c.parts){
   if(!/^weapon-designed-ionic-lancia-comando-ionico(?:-rarity-[el])?(?:-text-base)?\.part-\d{3}$/.test(p.name))throw Error('Parte Lancia non valida');
   const bytes=await readFile(path.join(root,archive,p.name));if(bytes.length!==p.bytes||hash(bytes)!==p.sha256)throw Error('Parte Lancia non integra');parts.push(bytes);
  }
  const png=Buffer.concat(parts);
  if(png.length!==c.bytes||hash(png)!==c.sha256||png.readUInt32BE(16)!==3072||png.readUInt32BE(20)!==4608||png[25]!==6)throw Error('PNG Lancia non integro');
  await mkdir(path.dirname(file),{recursive:true});const temp=file+'.restoring-'+process.pid;await writeFile(temp,png);await rename(temp,file);restored++;
 }
 console.log('Lancia del Comando: 3 fronti e 3 basi PNG HD verificati; ricomposti: '+restored+'.');
 return {verified:6,restored};
}
