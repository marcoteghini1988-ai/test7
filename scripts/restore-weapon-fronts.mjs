// Ricompone i PNG approvati dalle parti binarie versionate. Nessuna modifica
// a risoluzione, colori, trasparenza o compressione del file originale.
import {readFile,writeFile,mkdir,access,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const sources=path.join(root,'asset-sources/weapon-fronts/metallo-3');
const manifest=JSON.parse(await readFile(path.join(sources,'manifest.json'),'utf8'));
const hash=data=>createHash('sha256').update(data).digest('hex');
let restored=0;
for(const card of manifest.cards){
 const target=path.join(root,card.destination);
 try{
  await access(target);const current=await readFile(target);
  if(current.length===card.bytes&&hash(current)===card.sha256)continue;
 }catch{/* Un checkout nuovo ricrea soltanto i sei fronti del manifest. */}
 const chunks=[];
 for(const part of card.parts){
  const data=await readFile(path.join(sources,part.name));
  if(data.length!==part.bytes||hash(data)!==part.sha256)throw Error('Parte PNG non integra: '+part.name);
  chunks.push(data);
 }
 const png=Buffer.concat(chunks);
 if(png.length!==card.bytes||hash(png)!==card.sha256)throw Error('Fronte PNG non integro: '+card.id);
 await mkdir(path.dirname(target),{recursive:true});
 const temporary=target+'.restoring-'+process.pid;
 await writeFile(temporary,png);await rename(temporary,target);restored++;
}
console.log('Fronti Metallo HD verificati: '+manifest.cards.length+'; ricomposti: '+restored+'.');
