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

// Fronti ed effetti confermati: stessi byte dei PNG nativi approvati,
// compreso il pannello Arma rosso e i conteggi rivisti delle salve.
const approvedSources=path.join(root,'asset-sources/weapon-fronts/approved-2026-11-26');
const approved=JSON.parse(await readFile(path.join(approvedSources,'manifest.json'),'utf8'));
let approvedRestored=0;
for(const card of approved.cards){
 const target=path.join(root,card.destination);
 try{const current=await readFile(target);if(current.length===card.bytes&&hash(current)===card.sha256)continue;}catch{/* Primo avvio. */}
 const chunks=[];
 for(const part of card.parts){
  const data=await readFile(path.join(approvedSources,part.name));
  if(data.length!==part.bytes||hash(data)!==part.sha256)throw Error('Parte approvata non integra: '+part.name);
  chunks.push(data);
 }
 const png=Buffer.concat(chunks);
 if(png.length!==card.bytes||hash(png)!==card.sha256)throw Error('PNG approvato non integro: '+card.id);
 await mkdir(path.dirname(target),{recursive:true});
 const temporary=target+'.restoring-'+process.pid;
 await writeFile(temporary,png);await rename(temporary,target);approvedRestored++;
}
console.log('Fronti confermati HD verificati: '+approved.cards.length+'; ricomposti: '+approvedRestored+'.');
