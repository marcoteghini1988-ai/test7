// Twelve exact approved PNGs; never regenerate or recompress their pixels.
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const archive='asset-sources/weapon-fronts/lotto-giudizio-fuoco-2026-11-27';
const hash=b=>createHash('sha256').update(b).digest('hex');
export async function restoreJudgmentFireFronts({root=fileURLToPath(new URL('../',import.meta.url))}={}){
 const manifest=JSON.parse(await readFile(path.join(root,archive,'manifest.json'),'utf8'));
 if(manifest.cards.length!==12||manifest.fronts!==6||!manifest.approved)throw Error('Archivio sei Armi incompleto');let restored=0;
 for(const c of manifest.cards){
  if(!/^public\/assets\/fleet-weapon-fronts\/weapon-designed-(?:ionic-giudizio-temporale|plasma-(?:mortaio-magmatico|inceneritore-rotante))(?:-rarity-[el])?(?:-text-base)?\.png$/.test(c.destination))throw Error('Destinazione sei Armi non valida');
  const file=path.join(root,c.destination);try{const b=await readFile(file);if(b.length===c.bytes&&hash(b)===c.sha256)continue;}catch{}
  const parts=[];for(const p of c.parts){
   if(path.basename(p.name)!==p.name||!p.name.startsWith(c.id)||!p.name.match(/\.part-\d{3}$/))throw Error('Parte sei Armi non valida');
   const b=await readFile(path.join(root,archive,p.name));if(b.length!==p.bytes||hash(b)!==p.sha256)throw Error('Parte sei Armi non integra');parts.push(b);
  }
  const b=Buffer.concat(parts);if(b.length!==c.bytes||hash(b)!==c.sha256||b.readUInt32BE(16)!==3072||b.readUInt32BE(20)!==4608||b[25]!==6)throw Error('PNG sei Armi non integro');
  await mkdir(path.dirname(file),{recursive:true});const temp=file+'.restoring-'+process.pid;await writeFile(temp,b);await rename(temp,file);restored++;
 }
 console.log('Sei Armi: 6 fronti e 6 basi HD verificati; ricomposti: '+restored+'.');return {verified:12,restored};
}
