// Genera il package da incollare nell'editor della copia StackBlitz esistente.
// Le scritture del terminale modificano il WebContainer, non la copia salvata.
// Dopo l’incolla nativo, aggiungere una nuova riga e Ctrl+S; verificare lo SHA
// dopo il reload, attendendo prima il completamento del salvataggio.
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export function savedStackblitzPackage(original,ref){
 if(!/^[a-f0-9]{40}$/.test(ref))throw Error('Specificare il commit Test7 verificato (40 caratteri esadecimali).');
 const root='https://raw.githubusercontent.com/marcoteghini1988-ai/test7/';
 const code=[
  'import{readFile,writeFile}from"node:fs/promises";',
  'import{pathToFileURL}from"node:url";',
  'const saved=await readFile("package.json","utf8"),ref="'+ref+'",root="'+root+'",file="/tmp/eclissi-source-sync.mjs";',
  'const response=await fetch(root+ref+"/scripts/sync-stackblitz.mjs");',
  'if(!response.ok)throw Error("Sincronizzatore Test7 non disponibile: "+response.status);',
  'await writeFile(file,await response.text());',
  'await(await import(pathToFileURL(file))).syncStackblitz({ref,apply:true});',
  'await writeFile("package.json",saved);',
  'const env=await readFile(".env.local","utf8"),line="VITE_ASSET_ROOT="+root+ref+"/public/assets";',
  'await writeFile(".env.local",env.replace(/^VITE_ASSET_ROOT\\s*=.*$/m,line));',
  'await import(pathToFileURL(process.cwd()+"/scripts/review-maglio.mjs"));'
 ].join('');
 return {...original,scripts:{...original.scripts,predev:"node --input-type=module -e '"+code+"'"}};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const ref=process.argv.find(arg=>arg.startsWith('--ref='))?.slice(6);
 const original=JSON.parse(await readFile('package.json','utf8'));
 console.log(JSON.stringify(savedStackblitzPackage(original,ref),null,2));
}
