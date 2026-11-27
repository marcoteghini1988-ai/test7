// Ricompone i PNG approvati dalle parti binarie versionate. Nessuna modifica
// a risoluzione, colori, trasparenza o compressione del file originale.
import {restoreProbeHammerFronts} from './restore-probe-hammer-fronts.mjs';
import {restoreStormCapacitorFronts} from './restore-storm-capacitor-fronts.mjs';
import {restoreCommandLanceFronts} from './restore-command-lance-fronts.mjs';
import {readFile,writeFile,mkdir,access,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const sources=path.join(root,'asset-sources/weapon-fronts/metallo-3');
// La copia StackBlitz salvata usa gli stessi PNG pubblicati da GitHub.
// Se non ospita l'archivio binario, non richiederne la clonazione per avviare Vite.
let remoteAssets=process.env.VITE_ASSET_ROOT||'';
try{remoteAssets||=(await readFile(path.join(root,'.env.local'),'utf8')).match(/^VITE_ASSET_ROOT\s*=\s*["']?([^\s"']+)/m)?.[1]||'';}catch(e){if(e.code!=='ENOENT')throw e;}
try{await access(path.join(sources,'manifest.json'));}catch(e){
 if(e.code==='ENOENT'&&/^https:\/\/raw\.githubusercontent\.com\/marcoteghini1988-ai\/test7\/(?:main|[a-f0-9]{40})\/public\/assets\/?$/.test(remoteAssets)){
  console.log('StackBlitz: PNG HD serviti dal repository Test7; archivio binario locale non necessario.');
  process.exit(0);
 }
 throw e;
}
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

// Basi senza scritte delle carte localizzabili. Gli originali approvati
// rimangono intatti; il livello SVG della lingua viene disegnato nell'app.
const textSources=path.join(root,'asset-sources/card-text/nucleo-folgore');
const textManifest=JSON.parse(await readFile(path.join(textSources,'manifest.json'),'utf8'));
let textRestored=0;
for(const card of textManifest.cards){
 const target=path.join(root,card.path);
 try{const current=await readFile(target);if(current.length===card.bytes&&hash(current)===card.sha256)continue;}catch{/* Checkout nuovo. */}
 const parts=[];
 for(const part of card.parts){const bytes=await readFile(path.join(textSources,part.name));
  if(bytes.length!==part.bytes||hash(bytes)!==part.sha256)throw Error('Parte base traducibile non integra: '+part.name);parts.push(bytes);}
 const png=Buffer.concat(parts);
 if(png.length!==card.bytes||hash(png)!==card.sha256)throw Error('Base traducibile non integra: '+card.id);
 await mkdir(path.dirname(target),{recursive:true});const temporary=target+'.restoring-'+process.pid;
 await writeFile(temporary,png);await rename(temporary,target);textRestored++;
}
console.log('Basi traducibili HD verificate: '+textManifest.cards.length+'; ricomposte: '+textRestored+'.');

await restoreProbeHammerFronts({root,remoteAssets});
await restoreCommandLanceFronts({root});

await restoreStormCapacitorFronts({root});
