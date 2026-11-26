// Aggiorna la copia Test7 già salvata: solo sorgenti del repository canonico.
// I PNG HD rimangono su GitHub, senza clonare l'archivio binario nel WebContainer.
import {readFile,mkdir,writeFile,rename,mkdtemp,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';

export const REPOSITORY='marcoteghini1988-ai/test7';
const API='https://api.github.com/repos/'+REPOSITORY;
const ROOT_FILES=new Set(['package.json','package-lock.json','index.html','vite.config.ts',
 'tsconfig.json','tsconfig.app.json','tsconfig.node.json','README.md','AGENTS.md','.gitignore']);
const IMPORTED_ART=new Set(['docs/riferimenti-carte/font/EclissiVettore-Regular.ttf']);
export function sourcePath(name){
 if(typeof name!=='string'||name.startsWith('/')||name.includes('\\')||path.posix.normalize(name)!==name||name.split('/').includes('..'))return false;
 return ROOT_FILES.has(name)||name.startsWith('src/')||IMPORTED_ART.has(name)||
  name.startsWith('scripts/')&&/\.(?:mjs|js|py)$/.test(name)||
  name.startsWith('docs/')&&name.endsWith('.json');
}
export const gitBlobSha=data=>createHash('sha1').update('blob '+data.length+'\0').update(data).digest('hex');
async function existing(file){try{return await readFile(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}}
export async function syncStackblitz({cwd=process.cwd(),ref='main',apply=false,fetchImpl=fetch,log=console.log}={}){
 if(ref!=='main'&&!/^[a-f0-9]{40}$/.test(ref))throw Error('Usare main oppure uno SHA del solo repository Test7.');
 const get=async url=>{const response=await fetchImpl(url,{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw Error('Sorgente non disponibile ('+response.status+'): '+url);return response;};
 const commit=ref==='main'?(await (await get(API+'/branches/main')).json()).commit.sha:ref;
 const tree=await (await get(API+'/git/trees/'+commit+'?recursive=1')).json();
 if(tree.truncated||!Array.isArray(tree.tree))throw Error('Indice GitHub incompleto; nessun file modificato.');
 const entries=tree.tree.filter(e=>e.type==='blob'&&sourcePath(e.path));
 if(!entries.some(e=>e.path==='src/OfficialFleetBattle3D.jsx')||!entries.some(e=>e.path==='package.json'))throw Error('Sorgenti Test7 incompleti.');
 const changed=[];
 for(const entry of entries){const old=await existing(path.join(cwd,entry.path));
  if(!old||gitBlobSha(old)!==entry.sha)changed.push({...entry,old});}
 log('TEST7 '+commit+' · '+entries.length+' sorgenti · '+changed.length+' da aggiornare');
 if(!apply)return {commit,files:entries.length,changed:changed.map(e=>e.path),applied:false};
 const staged=[],queue=[...changed];let downloaded=0;
 const worker=async()=>{while(queue.length){const entry=queue.shift();
  const response=await get('https://raw.githubusercontent.com/'+REPOSITORY+'/'+commit+'/'+entry.path);
  const data=Buffer.from(await response.arrayBuffer());
  if(data.length!==entry.size||gitBlobSha(data)!==entry.sha)throw Error('File non integro: '+entry.path+'; nessuna modifica applicata.');
  staged.push({...entry,data});downloaded++;if(downloaded%50===0)log('Verificati '+downloaded+'/'+changed.length);
 }};
 await Promise.all(Array.from({length:6},worker));
 // Tutti i download sono verificati prima di scrivere. Una copia temporanea
 // dei soli file sostituiti consente il recupero senza creare un altro progetto.
 const backup=await mkdtemp(path.join(os.tmpdir(),'eclissi-stackblitz-'));
 for(const entry of staged){
  if(entry.old){const saved=path.join(backup,entry.path);await mkdir(path.dirname(saved),{recursive:true});await writeFile(saved,entry.old);}
  const destination=path.join(cwd,entry.path);await mkdir(path.dirname(destination),{recursive:true});
  await writeFile(destination+'.syncing',entry.data);await rename(destination+'.syncing',destination);
 }
 // Il foglio ufficiale è ora servito da ASSET_ROOT. Rimuovere dalla copia
 // soltanto il vecchio duplicato identico e verificato, conservandone il backup.
 const oldSheet='docs/riferimenti-carte/SIMBOLI_CATEGORIE_ELEMENTI_2026-11-21.png';
 const sheet=await existing(path.join(cwd,oldSheet)),reference=tree.tree.find(e=>e.path===oldSheet);
 if(sheet&&reference&&gitBlobSha(sheet)===reference.sha){
  await mkdir(path.dirname(path.join(backup,oldSheet)),{recursive:true});await writeFile(path.join(backup,oldSheet),sheet);
  await unlink(path.join(cwd,oldSheet));
 }
 const env=path.join(cwd,'.env.local'),oldEnv=await existing(env);
 if(!oldEnv||!/^VITE_ASSET_ROOT\s*=/m.test(oldEnv.toString())){
  await writeFile(env,(oldEnv?.toString()||'')+'\nVITE_ASSET_ROOT=https://raw.githubusercontent.com/'+REPOSITORY+'/main/public/assets\n');
 }
 const result={repository:REPOSITORY,commit,files:entries.length,updated:staged.length,applied:true,backup};
 await writeFile(path.join(cwd,'.stackblitz-sync.json'),JSON.stringify(result,null,2)+'\n');
 log('Sorgenti verificati e aggiornati. Conservata la configurazione degli asset remoti.');
 log('Avviare: npm install, poi npm run dev. Salvare la copia StackBlitz e verificare dopo il ricaricamento.');
 return result;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const ref=process.argv.find(a=>a.startsWith('--ref='))?.slice(6)||'main';
 await syncStackblitz({ref,apply:process.argv.includes('--apply')});
}
